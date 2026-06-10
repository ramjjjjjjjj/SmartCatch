import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = "https://smartcatch-production.up.railway.app";

const CARD = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0,212,170,0.12)',
  borderRadius: 16,
};

function CatchCard({ c, onOrder, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        ...CARD, padding: '16px 18px', marginBottom: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🐠</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{c.fish_type}</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          ⚖️ {c.weight_kg} кг · 🚤 {c.boat_number}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onOrder(c)}
        style={{
          padding: '10px 18px',
          background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
          color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,212,170,0.2)',
        }}
      >
        Заказать
      </motion.button>
    </motion.div>
  );
}

function OrderCard({ o, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        ...CARD, padding: '16px 18px', marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{o.fish_type}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>— {o.quantity_kg} кг</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            от: {o.restaurant_name}
          </div>
        </div>
        <span style={{
          padding: '4px 12px', borderRadius: 20,
          fontSize: 11, fontWeight: 500,
          background: o.status === 'pending'
            ? 'rgba(255,149,0,0.1)'
            : 'rgba(0,212,170,0.1)',
          color: o.status === 'pending' ? '#FF9500' : '#00D4AA',
          border: `1px solid ${o.status === 'pending'
            ? 'rgba(255,149,0,0.2)'
            : 'rgba(0,212,170,0.2)'}`,
        }}>
          {o.status === 'pending' ? '⏳ Ожидает' : '✅ Принят'}
        </span>
      </div>
    </motion.div>
  );
}

const TABS = [
  { id: 'catches', icon: '🐟', label: 'Уловы' },
  { id: 'orders',  icon: '📋', label: 'Заказы' },
];

export default function RestaurantView() {
  const [catches, setCatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ restaurant_name: '', restaurant_contact: '', quantity_kg: '', message: '' });
  const [tab, setTab] = useState('catches');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/catches`).then(r => r.json()).then(setCatches).catch(() => {});
    fetch(`${API}/api/orders`).then(r => r.json()).then(setOrders).catch(() => {});
  }, []);

  const handleOrder = async () => {
    if (!form.restaurant_name || !form.quantity_kg) return alert('Заполните имя и количество');
    setLoading(true);
    try {
      await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, catch_id: selected.id, quantity_kg: Number(form.quantity_kg) })
      });
      setSuccess(true);
      setSelected(null);
      setForm({ restaurant_name: '', restaurant_contact: '', quantity_kg: '', message: '' });
      const updated = await fetch(`${API}/api/orders`).then(r => r.json());
      setOrders(updated);
    } catch {
      alert('Ошибка при отправке заказа');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px 16px', minHeight: '100vh', background: '#050D1A', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Успех */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: 'rgba(0,212,170,0.08)',
              border: '1px solid rgba(0,212,170,0.2)',
              borderRadius: 14, padding: '12px 16px',
              marginBottom: 14, fontSize: 13, color: '#00D4AA',
            }}
          >
            ✅ Заказ отправлен! Рыбак свяжется с вами.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Табы */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 18,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 14, padding: 4,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 16px',
                border: 'none', borderRadius: 11,
                background: active ? 'rgba(0,212,170,0.12)' : 'transparent',
                color: active ? '#00D4AA' : 'rgba(255,255,255,0.4)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {t.icon} {t.label}
            </motion.button>
          );
        })}
      </div>

      {/* Контент */}
      <AnimatePresence mode="wait">
        {tab === 'catches' ? (
          <motion.div
            key="catches"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {catches.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '30px 16px', fontSize: 13 }}>
                Нет доступных уловов
              </div>
            ) : (
              catches.map((c, i) => (
                <CatchCard key={c.id} c={c} index={i} onOrder={setSelected} />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="orders"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '30px 16px', fontSize: 13 }}>
                Заказов пока нет
              </div>
            ) : (
              orders.map((o, i) => (
                <OrderCard key={o.id} o={o} index={i} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалка заказа */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 200, padding: 20,
            }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 360,
                background: '#0D1F35',
                border: '1px solid rgba(0,212,170,0.15)',
                borderRadius: 24, padding: '28px 24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>🐠</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
                    Заказать: {selected.fish_type}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                    Доступно: {selected.weight_kg} кг
                  </div>
                </div>
              </div>

              {[
                { key: 'restaurant_name', label: 'Название ресторана *', type: 'text' },
                { key: 'restaurant_contact', label: 'Контакт (тел/email)', type: 'text' },
                { key: 'quantity_kg', label: 'Количество (кг) *', type: 'number' },
                { key: 'message', label: 'Сообщение рыбаку', type: 'text' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, fontSize: 13, color: '#fff',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#00D4AA'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleOrder}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
                    color: '#fff', border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Отправка...' : 'Отправить заказ'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelected(null)}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: 'rgba(255,255,255,0.6)',
                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Отмена
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}