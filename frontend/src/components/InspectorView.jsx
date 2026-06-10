import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { db } from '../pages/firebase.js';
import { collection, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import FisheryLimitsDashboard from './FisheryLimitsDashboard.jsx';
import QRScannerInspector from './QRScannerInspector';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const VIEW_TABS = [
  { id: 'map', icon: '🗺️', label: 'Карта' },
  { id: 'scanner', icon: '📷', label: 'QR Скан' },
  { id: 'limits', icon: '🤖', label: 'AI Лимиты' },
];

export default function InspectorView() {
  const [viewTab, setViewTab] = useState('map');
  const [catches, setCatches] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [liveBoats, setLiveBoats] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Загрузка уловов и квот
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/catches`).then(r => r.json()),
      fetch(`${API_URL}/api/quotas`).then(r => r.json()),
    ]).then(([c, q]) => {
      setCatches(c);
      setQuotas(q);
    }).catch(() => {});
  }, []);

  // Реальное время — позиции рыбаков из Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'locations'), (snap) => {
      const boats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLiveBoats(boats);
    });
    return () => unsub();
  }, []);

  // Инициализация карты
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css');

      const map = L.map(mapRef.current, { zoomControl: false }).setView([43.65, 51.17], 8);

      // Тёмный тайл
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    });
  }, []);

  // Обновление маркеров при изменении liveBoats
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then(L => {
      const map = mapInstanceRef.current;
      const currentIds = new Set(liveBoats.map(b => b.id));

      // Удалить старые маркеры которых нет
      Object.keys(markersRef.current).forEach(id => {
        if (!currentIds.has(id)) {
          map.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });

      liveBoats.forEach(boat => {
        if (!boat.lat || !boat.lng) return;

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              position:relative;
              width:36px; height:36px;
              display:flex; align-items:center; justify-content:center;
            ">
              <div style="
                position:absolute; inset:0; border-radius:50%;
                background:rgba(0,212,170,0.2);
                animation:pulse 2s ease-in-out infinite;
              "></div>
              <div style="
                width:28px; height:28px; border-radius:50%;
                background:#050D1A;
                border:2px solid #00D4AA;
                display:flex; align-items:center; justify-content:center;
                font-size:14px; position:relative; z-index:1;
                box-shadow: 0 0 12px rgba(0,212,170,0.5);
              ">${boat.icon || '🎣'}</div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const updatedAt = boat.updatedAt?.toDate?.();
        const timeStr = updatedAt
          ? updatedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          : '—';

        const popup = `
          <div style="font-family:Inter,sans-serif; min-width:160px;">
            <div style="font-weight:600; font-size:13px; margin-bottom:4px;">${boat.icon || '🎣'} ${boat.name || 'Рыбак'}</div>
            <div style="font-size:12px; color:#666;">🚢 ${boat.boat}</div>
            <div style="font-size:12px; color:#666;">🐟 ${boat.fish} · ${boat.weight} кг</div>
            <div style="font-size:11px; color:#aaa; margin-top:4px;">Обновлено: ${timeStr}</div>
          </div>
        `;

        if (markersRef.current[boat.id]) {
          markersRef.current[boat.id].setLatLng([boat.lat, boat.lng]);
          markersRef.current[boat.id].setPopupContent(popup);
        } else {
          const marker = L.marker([boat.lat, boat.lng], { icon })
            .addTo(map)
            .bindPopup(popup);
          markersRef.current[boat.id] = marker;
        }
      });
    });
  }, [liveBoats]);

  const totalKg = catches.reduce((s, c) => s + parseFloat(c.weight_kg || 0), 0);
  const chartData = quotas.map(q => ({
    name: q.fish_type,
    used: Math.round(q.used_kg),
    total: Math.round(q.total_kg),
    percent: parseFloat(q.percent),
  }));

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(0,212,170,0.12)',
    borderRadius: 16,
    padding: '14px 16px',
  };

  return (
    <div style={{ padding: '20px 16px', minHeight: '100vh', background: '#050D1A', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes alertPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,0,51,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(255,0,51,0); }
        }
        .leaflet-popup-content-wrapper {
          background: #0D1F35 !important;
          border: 1px solid rgba(0,212,170,0.2) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          color: #fff !important;
        }
        .leaflet-popup-tip { background: #0D1F35 !important; }
        .leaflet-popup-close-button { color: rgba(255,255,255,0.4) !important; }
      `}</style>

      {/* Переключатель вида */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 14, padding: 4,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {VIEW_TABS.map((t) => {
          const active = viewTab === t.id;
          return (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewTab(t.id)}
              style={{
                flex: 1, padding: '10px 16px',
                border: 'none', borderRadius: 11,
                background: active ? 'rgba(0,212,170,0.12)' : 'transparent',
                color: active ? '#00D4AA' : 'rgba(255,255,255,0.4)',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {t.icon} {t.label}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
      {viewTab === 'map' ? (
        <motion.div
          key="map"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
        >

      {/* Статы */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { val: Math.round(totalKg).toLocaleString(), label: 'кг зафиксировано', icon: '⚖️' },
          { val: liveBoats.length, label: 'лодок онлайн', icon: '🚢' },
          { val: catches.length, label: 'записей в базе', icon: '📋' },
          { val: quotas.filter(q => q.percent >= 85).length, label: 'квот на пределе', icon: '⚠️' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={cardStyle}
          >
            <div style={{ fontSize: 11, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#00D4AA' }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Карта */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
            GPS карта флота
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#00D4AA' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4AA', animation: 'pulse 2s infinite' }} />
            Live
          </div>
        </div>
        <div
          ref={mapRef}
          style={{
            height: 260, borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(0,212,170,0.15)',
            boxShadow: '0 0 30px rgba(0,212,170,0.05)',
          }}
        />
        {liveBoats.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 10 }}>
            Нет активных лодок — рыбаки появятся после фиксации улова с GPS
          </div>
        )}
      </motion.div>

      {/* Квоты */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          Контроль квот
        </div>
        {quotas.map(q => {
          const pct = parseFloat(q.percent);
          const color = pct >= 85 ? '#FF5050' : pct >= 60 ? '#FF9500' : '#00D4AA';
          return (
            <div key={q.fish_type} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{q.fish_type}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  {Math.round(q.used_kg).toLocaleString()} / {Math.round(q.total_kg).toLocaleString()} кг ·{' '}
                  <b style={{ color }}>{pct}%</b>
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 4 }}
                />
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* График */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={cardStyle}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            График квот
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0D1F35', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, color: '#fff', fontSize: 12 }}
                formatter={v => v.toLocaleString() + ' кг'}
              />
              <Bar dataKey="used" name="Использовано" radius={[6, 6, 0, 0]}>
                {chartData.map(entry => (
                  <Cell key={entry.name} fill={entry.percent >= 85 ? '#FF5050' : entry.percent >= 60 ? '#FF9500' : '#00D4AA'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
        </motion.div>
      ) : (
        <motion.div
          key="limits"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          <FisheryLimitsDashboard />
        </motion.div>
      )}

      {/* QR Scanner Tab */}
      {viewTab === 'scanner' && (
        <motion.div
          key="scanner"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          <QRScannerInspector />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}