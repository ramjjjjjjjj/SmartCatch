import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function InspectorView() {
  const [catches, setCatches] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/catches`).then((r) => r.json()),
      fetch(`${API_URL}/api/quotas`).then((r) => r.json()),
    ]).then(([c, q]) => {
      setCatches(c);
      setQuotas(q);
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');
      const map = L.map(mapRef.current).setView([51.18, 51.35], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);
      mapInstanceRef.current = map;

      catches.forEach((c) => {
        if (c.latitude && c.longitude) {
          L.circleMarker([c.latitude, c.longitude], {
            radius: 8, fillColor: '#0F6E56', color: '#fff', weight: 2, fillOpacity: 0.9,
          }).addTo(map).bindPopup(`${c.fish_icon || '🐟'} ${c.fish_type} · ${c.weight_kg} кг<br>Лодка: ${c.boat_number}`);
        }
      });
    });
  }, [catches]);

  const totalKg = catches.reduce((s, c) => s + parseFloat(c.weight_kg || 0), 0);
  const uniqueBoats = new Set(catches.map((c) => c.boat_number)).size;

  const chartData = quotas.map((q) => ({
    name: q.fish_type,
    used: Math.round(q.used_kg),
    total: Math.round(q.total_kg),
    percent: parseFloat(q.percent),
  }));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { val: Math.round(totalKg), label: 'кг зафиксировано' },
          { val: uniqueBoats, label: 'лодок сегодня' },
          { val: catches.length, label: 'записей в базе' },
          { val: quotas.filter((q) => q.percent >= 85).length, label: 'квот на пределе' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#f5f5f5', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Карта вылова</p>
      <div ref={mapRef} style={{ height: 200, borderRadius: 10, marginBottom: 16, border: '0.5px solid #e0e0e0', overflow: 'hidden' }} />

      <p style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Контроль квот</p>
      {quotas.map((q) => {
        const pct = parseFloat(q.percent);
        const color = pct >= 85 ? '#E24B4A' : pct >= 60 ? '#EF9F27' : '#1D9E75';
        return (
          <div key={q.fish_type} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{q.fish_type}</span>
              <span style={{ fontSize: 12, color: '#888' }}>
                {Math.round(q.used_kg).toLocaleString()} / {Math.round(q.total_kg).toLocaleString()} кг ·{' '}
                <b style={{ color }}>{pct}%</b>
              </span>
            </div>
            <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
          </div>
        );
      })}

      {chartData.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '16px 0 8px' }}>График использования квот</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => v.toLocaleString() + ' кг'} />
              <Bar dataKey="used" name="Использовано" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.percent >= 85 ? '#E24B4A' : entry.percent >= 60 ? '#EF9F27' : '#1D9E75'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
