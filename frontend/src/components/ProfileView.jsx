import { motion } from 'framer-motion';
import { useAuth } from '../pages/AuthContext.jsx';
import { logOut } from '../pages/firebase.js';

const ROLE_INFO = {
  fisher:     { emoji: '🎣', label: 'Рыбак',     color: '#00D4AA' },
  restaurant: { emoji: '🍽️', label: 'Ресторан',  color: '#FF9500' },
  inspector:  { emoji: '📋', label: 'Инспектор', color: '#0078FF' },
  market:     { emoji: '🏪', label: 'Рынок',      color: '#FF6B6B' },
};

const StatCard = ({ value, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    style={{
      flex: 1, background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(0,212,170,0.12)',
      borderRadius: 16, padding: '16px 8px', textAlign: 'center'
    }}>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#00D4AA' }}>{value}</div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{label}</div>
  </motion.div>
);

export default function ProfileView() {
  const { user, role } = useAuth();
  const info = ROLE_INFO[role] || { emoji: '👤', label: role, color: '#00D4AA' };

  return (
    <div style={{ padding: '24px 20px', minHeight: '100vh', background: '#050D1A' }}>

      {/* Аватар + имя */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}
      >
        {/* Аватар с glow */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: -6, borderRadius: '50%',
              background: `radial-gradient(circle, ${info.color}33, transparent 70%)`,
            }}
          />
          <img
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=0F6E56&color=fff`}
            alt="avatar"
            style={{
              width: 90, height: 90, borderRadius: '50%',
              border: `2px solid ${info.color}`,
              position: 'relative', zIndex: 1
            }}
          />
          {/* Роль-бейдж */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0, zIndex: 2,
            background: '#050D1A', border: `2px solid ${info.color}`,
            borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
          }}>
            {info.emoji}
          </div>
        </div>

        <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{user?.displayName}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>{user?.email}</div>

        {/* Роль-тег */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            marginTop: 12, padding: '6px 16px', borderRadius: 20,
            background: `${info.color}18`, border: `1px solid ${info.color}44`,
            color: info.color, fontSize: 13, fontWeight: 600
          }}>
          {info.label}
        </motion.div>
      </motion.div>

      {/* Статистика */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
          Статистика
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard value="—" label="Уловов" delay={0.1} />
          <StatCard value="—" label="Кг рыбы" delay={0.2} />
          <StatCard value="—" label="Дней" delay={0.3} />
        </div>
      </div>

      {/* Инфо */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: 20, marginBottom: 24
        }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' }}>
          Аккаунт
        </div>
        {[
          { label: 'Имя', value: user?.displayName },
          { label: 'Email', value: user?.email },
          { label: 'Роль', value: info.label },
          { label: 'Вход через', value: 'Google' },
        ].map((item) => (
          <div key={item.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{item.label}</span>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{item.value}</span>
          </div>
        ))}
      </motion.div>

      {/* Кнопка выйти */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.96 }}
        onClick={logOut}
        style={{
          width: '100%', padding: '16px',
          background: 'rgba(255,80,80,0.08)',
          border: '1px solid rgba(255,80,80,0.25)',
          borderRadius: 16, color: '#FF5050',
          fontSize: 15, fontWeight: 600, cursor: 'pointer',
          letterSpacing: '-0.2px'
        }}>
        Выйти из аккаунта
      </motion.button>

    </div>
  );
}