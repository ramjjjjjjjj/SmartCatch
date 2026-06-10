import { useState, useEffect } from 'react';
import { saveCatchLocally, getPendingCatches, markSynced, getAllCatches } from '../db/dexie';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FISH_OPTIONS = [
  { name: 'Осётр', icon: '🐟', pricePerKg: 120 },
  { name: 'Сазан', icon: '🐠', pricePerKg: 45 },
  { name: 'Вобла', icon: '🐡', pricePerKg: 6 },
];

export default function FisherView({ isOnline }) {
  const [selectedFish, setSelectedFish] = useState(FISH_OPTIONS[0]);
  const [weight, setWeight] = useState('');
  const [boat, setBoat] = useState('МЧ-2847');
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [catches, setCatches] = useState([]);
  const [pending, setPending] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadCatches();
  }, []);

  async function loadCatches() {
    const all = await getAllCatches();
    const pend = await getPendingCatches();
    setCatches(all);
    setPending(pend);
  }

  function getGPS() {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) });
        setGpsLoading(false);
      },
      () => {
        // Фолбэк для демо — координаты Актау
        setGps({ lat: (51.18 + Math.random() * 0.3).toFixed(5), lng: (51.35 + Math.random() * 0.4).toFixed(5) });
        setGpsLoading(false);
      },
      { timeout: 5000 }
    );
  }

  async function handleAddCatch() {
    if (!weight || isNaN(weight)) return alert('Введите вес улова');
    await saveCatchLocally({
      fish: selectedFish.name,
      icon: selectedFish.icon,
      weight: parseFloat(weight),
      boat,
      lat: gps ? parseFloat(gps.lat) : null,
      lng: gps ? parseFloat(gps.lng) : null,
    });
    setWeight('');
    setGps(null);
    await loadCatches();
  }

  async function handleSync() {
    if (!isOnline) return alert('Нет соединения с интернетом');
    const toSync = await getPendingCatches();
    if (!toSync.length) return alert('Нет данных для синхронизации');

    setSyncing(true);
    try {
      const res = await fetch(`${API_URL}/api/catches/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catches: toSync }),
      });
      if (!res.ok) throw new Error('Ошибка сервера');
      await markSynced(toSync.map((c) => c.id));
      await loadCatches();
      alert(`✅ Синхронизировано ${toSync.length} уловов!`);
    } catch (e) {
      alert('Ошибка синхронизации: ' + e.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      {pending.length > 0 && (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span>⏳ {pending.length} улова ожидают синхронизации</span>
          <button onClick={handleSync} disabled={!isOnline || syncing} style={{ marginLeft: 'auto', padding: '4px 12px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            {syncing ? 'Отправка...' : 'Sync ↑'}
          </button>
        </div>
      )}

      <p style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Выбор рыбы</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {FISH_OPTIONS.map((f) => (
          <button key={f.name} onClick={() => setSelectedFish(f)} style={{ padding: '10px 6px', border: `1.5px solid ${selectedFish.name === f.name ? '#0F6E56' : '#e0e0e0'}`, borderRadius: 8, background: selectedFish.name === f.name ? '#E1F5EE' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>{f.icon}</div>
            <div style={{ fontSize: 11, color: selectedFish.name === f.name ? '#0F6E56' : '#888', fontWeight: selectedFish.name === f.name ? 500 : 400 }}>{f.name}</div>
          </button>
        ))}
      </div>

      <div style={{ border: '0.5px solid #e0e0e0', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <label style={{ fontSize: 13, color: '#888', minWidth: 60 }}>Вес (кг)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="например: 25" style={{ flex: 1, padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: '#888', minWidth: 60 }}>Лодка</label>
          <input type="text" value={boat} onChange={(e) => setBoat(e.target.value)} style={{ flex: 1, padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 14 }} />
        </div>
        <div onClick={getGPS} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#f5f5f5', borderRadius: 8, marginBottom: 14, cursor: 'pointer', fontSize: 13, color: '#555' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: gps ? '#1D9E75' : gpsLoading ? '#EF9F27' : '#E24B4A' }} />
          <span>{gpsLoading ? 'Определяем...' : gps ? `${gps.lat}°N, ${gps.lng}°E` : 'Нажмите для фиксации GPS'}</span>
          <span style={{ marginLeft: 'auto' }}>📍</span>
        </div>
        <button onClick={handleAddCatch} style={{ width: '100%', padding: 12, background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          + Зафиксировать улов
        </button>
      </div>

      <p style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Локальная база (IndexedDB)</p>
      {catches.slice(0, 8).map((c) => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8, borderLeft: `3px solid ${c.synced ? '#1D9E75' : '#EF9F27'}`, marginBottom: 6 }}>
          <span style={{ fontSize: 20 }}>{c.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{c.fish} · {c.weight} кг</div>
            <div style={{ fontSize: 11, color: '#888' }}>{c.boat} · {c.lat ? `${c.lat}°N` : 'GPS не зафиксирован'}</div>
          </div>
          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: c.synced ? '#E1F5EE' : '#FAEEDA', color: c.synced ? '#085041' : '#633806' }}>
            {c.synced ? '✓ Sync' : '⏳ Local'}
          </span>
        </div>
      ))}
    </div>
  );
}
