const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY;
const CASPIAN_FISH = [
  'Осётр каспийский', 'Белуга', 'Севрюга', 'Шип', 'Стерлядь',
  'Вобла', 'Лещ', 'Судак', 'Сазан', 'Щука',
  'Сом', 'Килька каспийская', 'Кефаль',
  'Берш', 'Жерех', 'Карась', 'Линь', 'Окунь',
];

export function isFishRecognitionAvailable() {
  return true;
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
      const mimeType = 'image/jpeg';
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

export async function recognizeFish(base64Image, mimeType, expectedSpecies) {
  alert('KEY: ' + GEMINI_API_KEY);

  if (!GEMINI_API_KEY) {
    return {
      match: true,
      species: expectedSpecies,
      confidence: 0,
      explanation: 'Подтверждено рыбаком. Ожидает проверки инспектора.',
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: `Ты эксперт-ихтиолог по рыбам Каспийского моря. На фото должна быть рыба вида: "${expectedSpecies}". Известные каспийские виды: ${CASPIAN_FISH.join(', ')}. Ответь ТОЛЬКО валидным JSON без markdown: {"is_fish": true, "species": "вид", "match": true, "confidence": 0.9, "explanation": "пояснение"}` }
            ]
          }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    alert('Gemini ответил: ' + JSON.stringify(result));

    return {
      match: result.match ?? false,
      species: result.species ?? expectedSpecies,
      confidence: result.confidence ?? 0,
      explanation: result.explanation ?? '',
      is_fish: result.is_fish ?? true,
    };
  } catch (e) {
    alert('Gemini error: ' + e.message);
    return {
      match: true,
      species: expectedSpecies,
      confidence: 0,
      explanation: 'ИИ недоступен. Подтверждено рыбаком.',
    };
  }
}