import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PRICES = { 'Осётр': 120, 'Сазан': 45, 'Вобла': 6 };

const DEMO_CATCHES = [
  { id: 'd1', fish_type: 'Осётр',  fish_icon: '🐟', weight_kg: 42, boat_number: 'МЧ-2847', fisher: 'Ержан К.',  fresh: true  },
  { id: 'd2', fish_type: 'Сазан',  fish_icon: '🐠', weight_kg: 18, boat_number: 'МЧ-1134', fisher: 'Болат М.',  fresh: true  },
  { id: 'd3', fish_type: 'Вобла',  fish_icon: '🐡', weight_kg: 95, boat_number: 'МЧ-3301', fisher: 'Серик Д.',  fresh: false },
  { id: 'd4', fish_type: 'Осётр',  fish_icon: '🐟', weight_kg: 61, boat_number: 'МЧ-0892', fisher: 'Асхат Н.',  fresh: true  },
  { id: 'd5', fish_type: 'Сазан',  fish_icon: '🐠', weight_kg: 33, boat_number: 'МЧ-4417', fisher: 'Дамир Т.',  fresh: false },
];

function CatchCard({ c, index, onBuy }) {
  const price = Math.round(c.weight_kg * (PRICES[c.fish_type] || 30));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        display: 'flex', gap: 12, padding: '14px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(0,212,170,0.12)',
        borderRadius: 16, marginBottom: 10,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: 'rgba(0,212,170,0.08)',
        border: '1px solid rgba(0,212,170,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>
        {c.fish_icon || '🐟'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
          {c.fish_type} · {c.weight_kg} кг
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
          🚢 {c.boat_number}{c.fisher ? ` · ${c.fisher}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 20,
            background: 'rgba(0,212,170,0.1)', color: '#00D4AA',
            border: '1px solid rgba(0,212,170,0.2)',
          }}>✓ Квота подтверждена</span>
          {c.fresh && (
            <span style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 20,
              background: 'rgba(0,120,255,0.1)', color: '#4DA6FF',
              border: '1px solid rgba(0,120,255,0.2)',
            }}>⚡ Свежий улов</span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#00D4AA' }}>
          {price.toLocaleString()} ₸
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>за партию</div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onBuy(c, price)}
          style={{
            padding: '7px 14px',
            background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Купить
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function MarketView() {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/catches`)
      .then(r => r.json())
      .then(data => { setCatches(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleBuy(c, price) {
    alert(`🛒 Заявка отправлена!\n${c.fish_type} · ${c.weight_kg} кг · ${price.toLocaleString()} ₸\nЛодка: ${c.boat_number}`);
  }

  // Реальные данные с сервера + демо (без дублей по id)
  const realIds = new Set(catches.map(c => c.id));
  const combined = [
    ...catches,
    ...DEMO_CATCHES.filter(d => !realIds.has(d.id)),
  ];

  return (
    <div style={{ padding: '20px 16px', minHeight: '100vh', background: '#050D1A', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Шапка */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Свежие уловы · Прямая продажа
        </span>
        <span style={{ fontSize: 11, color: '#00D4AA' }}>
          {combined.length} предложений
        </span>
      </div>

      {/* Контент */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40, fontSize: 13 }}>
          Загрузка уловов...
        </div>
      ) : (
        combined.map((c, i) => (
          <CatchCard key={c.id} c={c} index={i} onBuy={handleBuy} />
        ))
      )}
    </div>
  );
}