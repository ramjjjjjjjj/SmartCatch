import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MarketView() {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const PRICES = { 'Осётр': 120, 'Сазан': 45, 'Вобла': 6 };

  useEffect(() => {
    fetch(`${API_URL}/api/catches`)
      .then((r) => r.json())
      .then((data) => { setCatches(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleBuy(c) {
    const price = (c.weight_kg * (PRICES[c.fish_type] || 30)).toLocaleString();
    alert(`🛒 Заявка отправлена!\n${c.fish_type} · ${c.weight_kg} кг · ${price} ₸\nЛодка: ${c.boat_number}`);
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>Загрузка уловов...</div>;

  if (!catches.length) return (
    <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🐟</div>
      <p>Уловы появятся здесь после синхронизации рыбаков</p>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
        Свежие уловы · Прямая продажа
      </p>
      {catches.map((c) => {
        const price = Math.round(c.weight_kg * (PRICES[c.fish_type] || 30));
        return (
          <div key={c.id} style={{ display: 'flex', gap: 10, padding: 12, background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 30, lineHeight: 1 }}>{c.fish_icon || '🐟'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{c.fish_type} · {c.weight_kg} кг</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Лодка {c.boat_number}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, background: '#E1F5EE', color: '#085041', padding: '2px 6px', borderRadius: 10, marginTop: 4 }}>
                ✓ Квота подтверждена
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0F6E56' }}>{price.toLocaleString()} ₸</div>
              <div style={{ fontSize: 11, color: '#888' }}>за партию</div>
              <button onClick={() => handleBuy(c)} style={{ marginTop: 6, padding: '5px 12px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                Купить
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
