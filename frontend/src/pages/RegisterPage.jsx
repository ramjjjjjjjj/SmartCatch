import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { useAuth } from './AuthContext.jsx';

import CaspiNetLogo from '../components/CaspiNetLogo.jsx';

const INPUT_STYLE = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, fontSize: 13, color: '#fff',
  outline: 'none', transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};

const ROLES = [
  { id: "fisher",     emoji: "🎣", label: "Рыбак",      desc: "Фиксирую улов и продаю", color: "#00D4AA" },
  { id: "restaurant", emoji: "🍽️", label: "Ресторан",   desc: "Покупаю свежую рыбу",   color: "#FF9500" },
  { id: "inspector",  emoji: "📋", label: "Инспектор",  desc: "Слежу за квотами",      color: "#0078FF" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const inputProps = (val, setter, placeholder) => ({
  value: val,
  onChange: (e) => setter(e.target.value),
  placeholder,
  style: INPUT_STYLE,
  onFocus: (e) => e.target.style.borderColor = '#00D4AA',
  onBlur: (e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)',
});

export default function RegisterPage() {
  const { user, setRole } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.displayName?.split(' ')[0] || '');
    setLastName(user.displayName?.split(' ').slice(1).join(' ') || '');
    // Try to load existing profile from Firestore
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.firstName) setFirstName(d.firstName);
        if (d.lastName) setLastName(d.lastName);
        if (d.contactNumber) setContactNumber(d.contactNumber);
      }
    }).catch(() => {});
  }, [user]);

  const handleSelect = async (roleId) => {
    await setDoc(doc(db, "users", user.uid), {
      firstName: firstName || '',
      lastName: lastName || '',
      contactNumber: contactNumber || '',
      name: `${firstName || ''} ${lastName || ''}`.trim() || user.displayName,
      email: user.email,
      role: roleId,
      // createdAt already set on account creation — preserve it
      createdAt: new Date(),
    });
    setRole(roleId);
  };

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: '#050D1A', padding: 20,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Фоновые градиенты */}
      <div style={{
        position: 'absolute', top: -100, right: -100, width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -80, width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(0,120,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />

      {/* Логотип */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(0,212,170,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CaspiNetLogo size={24} />
        </div>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>
          CaspiNet
        </div>
      </motion.div>

      {/* Профиль */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(0,212,170,0.12)',
          borderRadius: 18, padding: '18px 16px',
          marginBottom: 20, width: '100%', maxWidth: 360,
        }}
      >
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, textAlign: 'center' }}>
          Ваши данные
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 4 }}>Имя</label>
            <input {...inputProps(firstName, setFirstName, 'Имя')} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 4 }}>Фамилия</label>
            <input {...inputProps(lastName, setLastName, 'Фамилия')} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 4 }}>Номер телефона</label>
          <input {...inputProps(contactNumber, setContactNumber, '+7 777 123 45 67')} />
        </div>
      </motion.div>

      {/* Роль */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ textAlign: 'center', marginBottom: 16, color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}
      >
        Выберите вашу роль
      </motion.div>

      {/* Карточки ролей */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}
      >
        {ROLES.map((r) => (
          <motion.button
            key={r.id}
            variants={cardVariants}
            whileHover={{ scale: 1.02, borderColor: r.color }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(r.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              cursor: 'pointer', fontSize: 16, textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: `${r.color}15`,
              border: `1px solid ${r.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>
              {r.emoji}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>{r.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>{r.desc}</div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: 18 }}
            >
              →
            </motion.div>
          </motion.button>
        ))}
      </motion.div>

      {/* Футер */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          position: 'absolute', bottom: 24,
          fontSize: 11, color: 'rgba(255,255,255,0.15)',
          textAlign: 'center',
        }}
      >
        CaspiNet v2.0 · Цифровой учёт улова
      </motion.div>
    </div>
  );
}