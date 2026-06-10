/**
 * Fish Recognition Service — Smart Catch
 *
 * Uses Google Gemini REST API to identify fish species from a photo.
 * Uses direct fetch() with correct camelCase field names.
 * Available when VITE_GEMINI_API_KEY is configured.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Models to try (all support image inputs via inlineData)
const MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

// API versions to try
const API_VERSIONS = ['v1', 'v1beta'];

export function isFishRecognitionAvailable() {
  return !!GEMINI_API_KEY;
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function compressImage(file, maxDimension = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas compression failed'));
          resolve(new File([blob], file.name, { type: mimeType }));
        },
        mimeType,
        quality
      );
    };

    img.onerror = reject;
    img.src = url;
  });
}

async function callGemini(apiVersion, model, apiKey, prompt, base64Image, mimeType, timeoutMs = 20000) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
          ],
        }],
      }),
      signal: controller.signal,
    });

    const json = await response.json();

    if (!response.ok) {
      const errMsg = json?.error?.message || response.statusText;
      throw new Error(`[${response.status}] ${errMsg}`);
    }

    return json;
  } finally {
    clearTimeout(timeout);
  }
}

function extractJson(text) {
  try { return JSON.parse(text.trim()); } catch {}
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[1].trim()); } catch {} }
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) { try { return JSON.parse(braceMatch[0]); } catch {} }
  throw new Error('Неверный формат ответа AI. Ответ: ' + text.slice(0, 200));
}

export async function recognizeFish(base64Image, mimeType, expectedSpecies) {
  if (!GEMINI_API_KEY) {
    throw new Error('Ключ Gemini API не настроен. Добавьте VITE_GEMINI_API_KEY в .env файл.');
  }

  const speciesDescriptions = {
    'Осётр': 'Осётр (Sturgeon) — крупная рыба с удлинённым телом, покрытым костяными щитками. Имеет острый нос и усики. Цвет от тёмно-серого до коричневато-зелёного.',
    'Сазан': 'Сазан (Common Carp) — крупная рыба с толстым телом, крупной чешуёй, двумя парами усиков. Окрас золотисто-коричневый или зеленовато-серый.',
    'Вобла': 'Вобла (Caspian Roach) — небольшая рыба из семейства карповых. Тело покрыто серебристой чешуёй. Глаза с оранжеватым оттенком.',
  };

  const prompt = `Ты — эксперт-ихтиолог по рыбе Каспийского моря, Мангистауская область, Казахстан.

Справочная информация о возможных видах:
${Object.entries(speciesDescriptions).map(([name, desc]) => `- ${name}: ${desc}`).join('\n')}

Задача: Проанализируй фотографию рыбы и определи, является ли она тем видом, который указал рыбак.

Рыбак утверждает, что это: "${expectedSpecies}"

Ответь ТОЛЬКО валидным JSON (без markdown, без code fences):
{
  "match": true/false,
  "species": "название вида на русском",
  "confidence": 0.0-1.0,
  "explanation": "Краткое объяснение на русском (1-2 предложения)"
}

Правила:
- Если на фото не рыба или невозможно определить → match: false
- Если match: false, укажи species: null
- Будь консервативен`;

  // Try all API version + model combinations
  let lastError = null;
  let authError = false;

  for (const apiVersion of API_VERSIONS) {
    if (authError) break;
    for (const model of MODELS) {
      try {
        console.log(`[FishRecognition] Trying ${apiVersion}/${model}...`);
        const json = await callGemini(apiVersion, model, GEMINI_API_KEY, prompt, base64Image, mimeType);

        const candidate = json?.candidates?.[0];
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
          throw new Error(`Запрос заблокирован AI (${candidate.finishReason})`);
        }
        const text = candidate?.content?.parts?.[0]?.text || '';
        if (!text) throw new Error('Пустой ответ');

        console.log(`[FishRecognition] ${apiVersion}/${model} OK:`, text.slice(0, 200));
        const parsed = extractJson(text);

        return {
          match: !!parsed.match,
          species: parsed.species || null,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
          explanation: parsed.explanation || '',
        };
      } catch (e) {
        const msg = e.message;
        console.warn(`[FishRecognition] ${apiVersion}/${model} failed:`, msg);
        lastError = e;

        if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY') || msg.includes('not authorized')) {
          authError = true;
          break;
        }
      }
    }
  }

  const msg = lastError?.message || 'Неизвестная ошибка';

  if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('not authorized') || msg.includes('API key not valid')) {
    throw new Error(
      'Ключ API недействителен. Получите новый ключ: https://aistudio.google.com/apikey\n' +
      'Нажмите "Get API Key" → выберите "Create API key" → скопируйте ключ (начинается с AIzaSy...)'
    );
  }

  if (msg.includes('429') || msg.includes('quota')) {
    throw new Error('Превышен лимит запросов. Подождите и попробуйте снова.');
  }

  if (msg.includes('404') || msg.includes('not found')) {
    throw new Error(
      'Модель Gemini недоступна для этого ключа. Перейдите в Google Cloud Console:\n' +
      '1. https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com\n' +
      '2. Нажмите "Enable"\n' +
      '3. Затем создайте новый ключ: https://console.cloud.google.com/apis/credentials'
    );
  }

  throw new Error('Ошибка Gemini API: ' + msg.slice(0, 200));
}
