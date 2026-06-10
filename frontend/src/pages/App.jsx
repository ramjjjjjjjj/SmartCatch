import { useState, useEffect } from 'react';
import FisherView from '../components/FisherView';
import MarketView from '../components/MarketView';
import InspectorView from '../components/InspectorView';

const ROLES = [
  { id: 'fisher', label: '🎣 Рыбак' },
  { id: 'market', label: '🏪 Рынок' },
  { id: 'inspector', label: '📊 Инспектор' },
];

export default function App() {
  const [role, setRole] = useState('fisher');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🐟</span>
            <div>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>Smart Catch</div>
              <div style={{ color: '#9FE1CB', fontSize: 11 }}>Цифровой улов · Мангистау</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 10px', borderRadius: 20, background: isOnline ? '#1D9E75' : '#E24B4A', color: '#fff' }}>
            <span>●</span> {isOnline ? 'Онлайн' : 'Офлайн'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, paddingBottom: 0 }}>
          {ROLES.map((r) => (
            <button key={r.id} onClick={() => setRole(r.id)} style={{ flex: 1, padding: '8px 4px', border: 'none', borderRadius: '8px 8px 0 0', fontSize: 12, cursor: 'pointer', background: role === r.id ? '#fff' : 'rgba(255,255,255,0.15)', color: role === r.id ? '#0F6E56' : '#9FE1CB', fontWeight: role === r.id ? 500 : 400 }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {role === 'fisher' && <FisherView isOnline={isOnline} />}
      {role === 'market' && <MarketView />}
      {role === 'inspector' && <InspectorView />}
    </div>
  );
}
