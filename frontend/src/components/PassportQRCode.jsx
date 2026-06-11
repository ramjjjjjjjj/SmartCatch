import { useState } from 'react';
import { useAuth } from '../pages/AuthContext.jsx';
import QRCode from 'react-qr-code';

const API = 'https://smartcatch-production.up.railway.app';

export default function PassportQRCode() {
  const { user } = useAuth();
  const [form, setForm] = useState({ species: '', weight: '' });
  const [batchCode, setBatchCode] = useState(null);
  const [scanCode, setScanCode] = useState('');
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(false);

  const createBatch = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`${API}/api/batches/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fisher_id: user.uid,
          fisher_name: user.displayName,
          species: form.species,
          weight: form.weight,
          location_lat: pos.coords.latitude,
          location_lng: pos.coords.longitude,
        }),
      });
      const data = await res.json();
      setBatchCode(data.batch_code);
      setLoading(false);
    });
  };

  const lookupBatch = async () => {
    const res = await fetch(`${API}/api/batches/${scanCode}`);
    const data = await res.json();
    setChainData(data);
  };

  const ROLE_LABELS = {
    fisher: '🎣 Рыбак',
    driver: '🚚 Водитель',
    company: '🏭 Компания',
    restaurant: '🍽️ Ресторан',
    inspector: '📋 Инспектор',
  };

  return (
    <div style={{ padding: '20px', background: '#050D1A', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ color: '#00D4AA', marginBottom: 24 }}>🐟 Паспорт улова</h2>

      {/* CREATE BATCH */}
      <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ color: '#00D4AA', fontWeight: 600, marginBottom: 16 }}>Создать паспорт</div>
        <input
          placeholder="Вид рыбы (напр. сазан)"
          value={form.species}
          onChange={e => setForm({ ...form, species: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="Вес (кг)"
          type="number"
          value={form.weight}
          onChange={e => setForm({ ...form, weight: e.target.value })}
          style={inputStyle}
        />
        <button onClick={createBatch} disabled={loading} style={btnStyle}>
          {loading ? 'Создаём...' : '✅ Создать QR-паспорт'}
        </button>

        {batchCode && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <div style={{ color: '#00D4AA', marginBottom: 12, fontWeight: 600 }}>{batchCode}</div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block' }}>
              <QRCode value={batchCode} size={180} />
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>
              Покажи этот QR следующему звену цепи
            </div>
          </div>
        )}
      </div>

      {/* LOOKUP BATCH */}
      <div style={{ background: 'rgba(0,120,255,0.06)', border: '1px solid rgba(0,120,255,0.2)', borderRadius: 16, padding: 20 }}>
        <div style={{ color: '#0078FF', fontWeight: 600, marginBottom: 16 }}>Проверить паспорт</div>
        <input
          placeholder="Введи код (SC-...)"
          value={scanCode}
          onChange={e => setScanCode(e.target.value)}
          style={inputStyle}
        />
        <button onClick={lookupBatch} style={{ ...btnStyle, background: 'rgba(0,120,255,0.15)', border: '1px solid rgba(0,120,255,0.4)', color: '#0078FF' }}>
          🔍 Проверить
        </button>

        {chainData && chainData.batch && (
          <div style={{ marginTop: 20 }}>
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>
              {chainData.batch.species} — {chainData.batch.weight} кг
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16 }}>
              Рыбак: {chainData.batch.fisher_name}
            </div>
            {chainData.chain.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ color: '#00D4AA', fontSize: 18 }}>{ROLE_LABELS[step.actor_role] || step.actor_role}</div>
                <div>
                  <div style={{ color: '#fff', fontSize: 13 }}>{step.actor_name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    {new Date(step.timestamp).toLocaleString()} — {step.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px', marginBottom: 12,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#fff', fontSize: 14, boxSizing: 'border-box'
};

const btnStyle = {
  width: '100%', padding: '13px',
  background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.4)',
  borderRadius: 10, color: '#00D4AA', fontSize: 14, fontWeight: 600, cursor: 'pointer'
};