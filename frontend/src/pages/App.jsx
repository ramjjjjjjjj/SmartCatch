import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './AuthContext.jsx';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import FisherView from '../components/FisherView';
import MarketView from '../components/MarketView';
import InspectorView from '../components/InspectorView';
import RestaurantView from '../components/RestaurantView';
import ProfileView from '../components/ProfileView';
import FisheryLimitsDashboard from '../components/FisheryLimitsDashboard.jsx';
import CatchPassportModal from '../components/CatchPassportModal';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.js';

const TABS = [
  { id: 'fisher',     icon: '🎣', label: 'Улов' },
  { id: 'market',     icon: '🏪', label: 'Рынок' },
  { id: 'inspector',  icon: '📊', label: 'Карта' },
  { id: 'restaurant', icon: '🍽️', label: 'Меню' },
  { id: 'ai',         icon: '🤖', label: 'AI' },
  { id: 'profile',    icon: '👤', label: 'Профиль' },
];

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.15 } },
};

export default function App() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [alertCount, setAlertCount] = useState(0);
  const [verifyPassportId, setVerifyPassportId] = useState(null);

  // Listen for active alerts for badge
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'alerts');
    const unsub = onSnapshot(q, (snap) => {
      const unacknowledged = snap.docs.filter((d) => !d.data().acknowledged);
      setAlertCount(unacknowledged.length);
    });
    return () => unsub();
  }, [user]);

  // Handle ?verify=PASSPORT_ID query param for QR code verification links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vid = params.get('verify');
    if (vid) {
      setVerifyPassportId(vid);
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (role) setActiveTab(role === 'market' ? 'market' : role);
  }, [role]);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // If opened via QR verification link, show passport directly (no auth needed for viewing)
  if (verifyPassportId) {
    return (
      <div style={{
        maxWidth: 480, margin: '0 auto', minHeight: '100vh',
        background: '#050D1A', padding: '60px 16px 40px',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 8,
          }}>
            🐟
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Smart Catch</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
            Верификация цифрового паспорта улова
          </div>
        </div>

        <CatchPassportModal
          passportId={verifyPassportId}
          inline
        />

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setVerifyPassportId(null)}
          style={{
            marginTop: 20, padding: '14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, color: 'rgba(255,255,255,0.4)',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          ← Войти в приложение
        </motion.button>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (!role) return <RegisterPage />;

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      background: '#050D1A', fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'
    }}>
      {/* Фоновые градиентные пятна */}
      <div style={{
        position: 'fixed', top: -100, left: -100, width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: 100, right: -80, width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(0,120,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Шапка */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,13,26,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,212,170,0.12)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>🐟</div>
          <div>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>Smart Catch</div>
            <div style={{ color: '#00D4AA', fontSize: 10, opacity: 0.8 }}>Мангистау · Digital Fleet</div>
          </div>
        </div>

        {/* Онлайн-статус */}
        <motion.div
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            background: isOnline ? 'rgba(0,212,170,0.12)' : 'rgba(255,80,80,0.12)',
            border: `1px solid ${isOnline ? 'rgba(0,212,170,0.3)' : 'rgba(255,80,80,0.3)'}`,
            fontSize: 11, color: isOnline ? '#00D4AA' : '#FF5050'
          }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isOnline ? '#00D4AA' : '#FF5050'
          }} />
          {isOnline ? 'Online' : 'Offline'}
        </motion.div>
      </div>

      {/* Контент */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80, position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {activeTab === 'fisher'     && <FisherView isOnline={isOnline} />}
            {activeTab === 'market'     && <MarketView />}
            {activeTab === 'inspector'  && <InspectorView />}
            {activeTab === 'restaurant' && <RestaurantView />}
            {activeTab === 'ai'         && <FisheryLimitsDashboard />}
            {activeTab === 'profile'    && <ProfileView />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Нижний навбар */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 100,
        background: 'rgba(5,13,26,0.92)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(0,212,170,0.12)',
        display: 'flex', padding: '8px 8px 12px'
      }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.88 }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, padding: '8px 4px', border: 'none', background: 'transparent',
                cursor: 'pointer', borderRadius: 12, position: 'relative',
                transition: 'background 0.2s'
              }}
            >
              {active && (
                <motion.div
                  layoutId="tab-bg"
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 12,
                    background: 'rgba(0,212,170,0.1)',
                    border: '1px solid rgba(0,212,170,0.2)'
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span style={{ fontSize: 20, position: 'relative', zIndex: 1 }}>
                {tab.icon}
                {tab.id === 'ai' && alertCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -8,
                    background: '#FF0033', color: '#fff',
                    fontSize: 8, fontWeight: 700, minWidth: 16, height: 16,
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: '0 0 8px rgba(255,0,51,0.5)',
                  }}>
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </span>
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? '#00D4AA' : 'rgba(255,255,255,0.35)',
                position: 'relative', zIndex: 1, transition: 'color 0.2s'
              }}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}