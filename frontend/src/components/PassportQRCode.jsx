import { useState, useEffect } from 'react';
import { useAuth } from '../pages/AuthContext.jsx';
import QRCode from 'react-qr-code';

const API = 'https://smartcatch-production.up.railway.app';

export default function PassportQRCode() {
  const { user, role } = useAuth();
  const [form, setForm] = useState({ species: '', weight: '' });
  const [batchCode, setBatchCode] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanCode, setScanCode] = useState('');
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load fisher's batch history
  useEffect(() => {
    if (role === 'fisher' && user) loadHistory();
  }, [role, user]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API}/api/batches/fisher/${user.uid}`);
      const data = await res.json();
      setHistory(data);
    } catch (e) {}
  };

  const createBatch = async () => {
    if (!form.species || !form.weight) return setError('Заполни все поля');
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
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
        setForm({ species: '', weight: '' });
        loadHistory();
      } catch (e) {
        setError('Ошибка сервера');
      }
      setLoading(false);
    }, () => {
      setError('Нет доступа к геолокации');
      setLoading(false);
    });
  };

  const lookupBatch = async () => {
    if (!scanCode) return;
    setError('');
    try {
      const res = await fetch(`${API}/api/batches/${scanCode}`);
      const data = await res.json();
      if (!data.batch) return setError('Паспорт не найден');
      setChainData(data);
    } catch (e) {
      setError('Ошибка при поиске');
    }
  };

  const signBatch = async (batch_code, note) => {
    await fetch(`${API}/api/batches/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batch_code,
        actor_role: role,
        actor_name: user.displayName,
        note,
      }),
    });
    lookupBatch();
  };

  const ROLE_LABELS = {
    fisher: '🎣 Рыбак',
    driver: '🚚 Водитель',
    company: '🏭 Компания',
    restaurant: '🍽️ Ресторан',
    inspector: '📋 Инспектор',
  };

  const STATUS_COLOR = {
    caught: '#00D4AA',
    restaurant: '#FF9500',
    inspector: '#0078FF',
  };

  return (
    <div style={{ padding: '20px', background: '#050D1A', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 100 }}>

      {/* ── FISHER VIEW ── */}
      {role === 'fisher' && (
        <>
          <h2 style={{ color: '#00D4AA', marginBottom: 24 }}>🎣 Мои паспорта улова</h2>

          <div style={card('#00D4AA')}>
            <div style={cardTitle('#00D4AA')}>Новый паспорт</div>
            <input placeholder="Вид рыбы (напр. сазан)" value={form.species}
              onChange={e => setForm({ ...form, species: e.target.value })} style={inputStyle} />
            <input placeholder="Вес (кг)" type="number" value={form.weight}
              onChange={e => setForm({ ...form, weight: e.target.value })} style={inputStyle} />
            {error && <div style={{ color: '#FF5050', fontSize: 12, marginBottom: 8 }}>{error}</div>}
            <button onClick={createBatch} disabled={loading} style={btn('#00D4AA')}>
              {loading ? 'Создаём...' : '✅ Создать QR-паспорт'}
            </button>

            {batchCode && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <div style={{ color: '#00D4AA', fontWeight: 700, marginBottom: 12, fontSize: 16 }}>{batchCode}</div>
                <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block' }}>
                  <QRCode value={batchCode} size={160} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>
                  Покажи QR следующему звену цепи
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <div style={{ marginTop: 24 }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              История паспортов
            </div>
            {history.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                Паспортов пока нет
              </div>
            )}
            {history.map((b) => (
              <div key={b.batch_code} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '14px 16px', marginBottom: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{b.species} — {b.weight} кг</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 3 }}>
                    {b.batch_code} · {new Date(b.caught_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{
                  fontSize: 10, padding: '4px 10px', borderRadius: 20,
                  background: `${STATUS_COLOR[b.status] || '#00D4AA'}18`,
                  color: STATUS_COLOR[b.status] || '#00D4AA',
                  border: `1px solid ${STATUS_COLOR[b.status] || '#00D4AA'}44`,
                  fontWeight: 600
                }}>{b.status}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── RESTAURANT / INSPECTOR VIEW ── */}
      {(role === 'restaurant' || role === 'inspector') && (
        <>
          <h2 style={{ color: role === 'inspector' ? '#0078FF' : '#FF9500', marginBottom: 24 }}>
            {role === 'inspector' ? '📋 Аудит паспортов' : '🍽️ Проверить рыбу'}
          </h2>

          <div style={card(role === 'inspector' ? '#0078FF' : '#FF9500')}>
            <div style={cardTitle(role === 'inspector' ? '#0078FF' : '#FF9500')}>Введи код партии</div>
            <input placeholder="SC-..." value={scanCode}
              onChange={e => setScanCode(e.target.value)} style={inputStyle} />
            {error && <div style={{ color: '#FF5050', fontSize: 12, marginBottom: 8 }}>{error}</div>}
            <button onClick={lookupBatch}
              style={btn(role === 'inspector' ? '#0078FF' : '#FF9500')}>
              🔍 Проверить паспорт
            </button>
          </div>

          {chainData && chainData.batch && (
            <div style={{ marginTop: 20 }}>
              {/* Batch info */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: 20, marginBottom: 16
              }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
                  {chainData.batch.species} — {chainData.batch.weight} кг
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
                  Рыбак: {chainData.batch.fisher_name} · {new Date(chainData.batch.caught_at).toLocaleString()}
                </div>
              </div>

              {/* Chain */}
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                Цепочка поставки
              </div>
              {chainData.chain.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: 22 }}>{ROLE_LABELS[step.actor_role]?.split(' ')[0]}</div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{step.actor_name}</div>
                    <div style={{ color: '#00D4AA', fontSize: 11 }}>{ROLE_LABELS[step.actor_role]}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                      {new Date(step.timestamp).toLocaleString()} — {step.note}
                    </div>
                  </div>
                </div>
              ))}

              {/* Sign button */}
              <button onClick={() => signBatch(chainData.batch.batch_code,
                role === 'restaurant' ? 'Принято рестораном' : 'Проверено инспектором')}
                style={{ ...btn(role === 'inspector' ? '#0078FF' : '#FF9500'), marginTop: 20 }}>
                {role === 'inspector' ? '✅ Подтвердить проверку' : '🛒 Подтвердить покупку'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Styles
const inputStyle = {
  width: '100%', padding: '12px', marginBottom: 12,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#fff', fontSize: 14, boxSizing: 'border-box'
};

const card = (color) => ({
  background: `rgba(${color === '#00D4AA' ? '0,212,170' : color === '#0078FF' ? '0,120,255' : '255,149,0'},0.06)`,
  border: `1px solid ${color}33`,
  borderRadius: 16, padding: 20,
});

const cardTitle = (color) => ({
  color, fontWeight: 600, marginBottom: 16
});

const btn = (color) => ({
  width: '100%', padding: '13px',
  background: `${color}18`, border: `1px solid ${color}44`,
  borderRadius: 10, color, fontSize: 14, fontWeight: 600, cursor: 'pointer'
});