import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY;

const CASPIAN_FISH = [
  'Осётр каспийский', 'Белуга', 'Севрюга', 'Шип', 'Стерлядь',
  'Вобла (каспийская плотва)', 'Лещ', 'Судак', 'Сазан', 'Щука',
  'Сом', 'Килька каспийская', 'Атерина каспийская', 'Кефаль',
  'Берш', 'Жерех', 'Карась', 'Линь', 'Окунь', 'Голавль',
];

async function classifyFish(base64Image, mimeType) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: { mime_type: mimeType, data: base64Image },
              },
              {
                text: `Ты эксперт-ихтиолог по рыбам Каспийского моря.
Определи вид рыбы на фотографии. Известные каспийские виды: ${CASPIAN_FISH.join(', ')}.

Ответь ТОЛЬКО валидным JSON без пояснений и без markdown-блоков:
{
  "species": "Название вида (русское)",
  "latin": "Латинское название",
  "confidence": 0.0-1.0,
  "weight_estimate": "примерный вес в кг (диапазон)",
  "quota_category": "осётровые | промысловые | прочие",
  "signs": ["характерный признак 1", "характерный признак 2", "характерный признак 3"],
  "note": "краткое пояснение (1-2 предложения)",
  "is_fish": true
}

Если рыба не определяется или изображение плохое — верни is_fish: false и species: "Не удалось определить".`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.1 },
      }),
    }
  );

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

const QUOTA_COLOR = {
  'осётровые':   { bg: 'rgba(255,80,80,0.12)',  border: 'rgba(255,80,80,0.35)',  text: '#FF5050', label: '⚠ Осётровые — квотируются' },
  'промысловые': { bg: 'rgba(0,212,170,0.1)',   border: 'rgba(0,212,170,0.3)',   text: '#00D4AA', label: '✓ Промысловый вид' },
  'прочие':      { bg: 'rgba(0,120,255,0.1)',   border: 'rgba(0,120,255,0.3)',   text: '#0078FF', label: '○ Прочие виды' },
};

export default function FishClassifier({ onResult }) {
  const [stage, setStage] = useState('idle');
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setStage('loading');
    setResult(null);
    setError('');
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const data = await classifyFish(base64, file.type);
      setResult(data);
      setStage('result');
      if (onResult) onResult(data);
    } catch (e) {
      setError(e.message || 'Ошибка при определении рыбы');
      setStage('error');
    }
  };

  const reset = () => {
    setStage('idle');
    setResult(null);
    setPreview(null);
    setError('');
    if (preview) URL.revokeObjectURL(preview);
  };

  const quotaInfo = result ? QUOTA_COLOR[result.quota_category] || QUOTA_COLOR['прочие'] : null;

  return (
    <div style={{ background: '#050D1A', minHeight: '100%', padding: '20px 20px 32px', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(0,212,170,0.7)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>AI-определение</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Вид рыбы</div>
      </div>

      <AnimatePresence mode="wait">
        {stage === 'idle' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => cameraRef.current?.click()} style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,120,255,0.1))', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>📷</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#00D4AA', fontWeight: 600, fontSize: 15 }}>Сфотографировать</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Открыть камеру</div>
              </div>
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🖼</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>Выбрать из галереи</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>JPG, PNG, HEIC</div>
              </div>
            </motion.button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(0,120,255,0.06)', border: '1px solid rgba(0,120,255,0.15)', borderRadius: 12 }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6 }}>
                ИИ распознаёт <span style={{ color: '#0078FF' }}>{CASPIAN_FISH.length} видов</span> рыб Каспийского моря, включая осётровых.
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
            {preview && (
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <img src={preview} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16, border: '1px solid rgba(0,212,170,0.2)', filter: 'brightness(0.5)' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                  <ScanAnimation />
                  <div style={{ color: '#00D4AA', fontSize: 13, fontWeight: 500 }}>Анализ изображения...</div>
                </div>
              </div>
            )}
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>ИИ определяет вид рыбы</div>
          </motion.div>
        )}

        {stage === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {preview && <img src={preview} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 16, border: '1px solid rgba(0,212,170,0.2)', marginBottom: 16 }} />}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{result.species}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 2 }}>{result.latin}</div>
                </div>
                <ConfidenceBadge value={result.confidence} />
              </div>
              {result.weight_estimate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Примерный вес:</span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{result.weight_estimate}</span>
                </div>
              )}
            </div>
            {quotaInfo && <div style={{ background: quotaInfo.bg, border: `1px solid ${quotaInfo.border}`, borderRadius: 12, padding: '10px 14px', marginBottom: 12, color: quotaInfo.text, fontSize: 13, fontWeight: 500 }}>{quotaInfo.label}</div>}
            {result.signs?.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Признаки</div>
                {result.signs.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: '#00D4AA', fontSize: 14, marginTop: 1 }}>·</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {result.note && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>{result.note}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button whileTap={{ scale: 0.96 }} onClick={reset} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Новое фото</motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => onResult && onResult(result)} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #00D4AA, #0078FF)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Добавить в улов</motion.button>
            </div>
          </motion.div>
        )}

        {stage === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: '#FF5050', fontWeight: 600, marginBottom: 8 }}>Не удалось определить</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>{error}</div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={reset} style={{ padding: '12px 28px', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 12, color: '#00D4AA', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Попробовать снова</motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScanAnimation() {
  return (
    <div style={{ position: 'relative', width: 56, height: 56 }}>
      <style>{`
        @keyframes scan-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scan-ping { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.15; transform: scale(1.3); } }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(0,212,170,0.2)', borderTop: '2px solid #00D4AA', borderRadius: '50%', animation: 'scan-spin 1s linear infinite' }} />
      <div style={{ position: 'absolute', inset: 8, border: '1.5px solid rgba(0,212,170,0.3)', borderRadius: '50%', animation: 'scan-ping 1.5s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 18 }}>🐟</div>
    </div>
  );
}

function ConfidenceBadge({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? '#00D4AA' : pct >= 55 ? '#FF9500' : '#FF5050';
  return (
    <div style={{ textAlign: 'center', padding: '6px 10px', background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 10, minWidth: 52 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{pct}%</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>точность</div>
    </div>
  );
}