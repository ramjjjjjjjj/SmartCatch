import { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

const DESKTOP_BREAKPOINT = 640;
import { useAuth } from './AuthContext.jsx';
import {
  FishIcon, HookIcon, ShopIcon, MapIcon,
  RestaurantIcon, BrainIcon, ProfileIcon,
} from '../components/DuotoneIcons.jsx';
import CaspiNetLogo from '../components/CaspiNetLogo.jsx';
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
import PassportQRCode from '../components/PassportQRCode';
import LicenseView from '../components/LicenseView';
import { db } from './firebase.js';

const TABS_BY_ROLE = {
  fisher: [
    { id: 'fisher',   icon: HookIcon,    label: 'Улов' },
    { id: 'passport', icon: '🪪',      label: 'Паспорт' },
    { id: 'license', icon: '🛡️', label: 'Лицензия' },
    { id: 'profile',  icon: ProfileIcon, label: 'Профиль' },
  ],
  restaurant: [
    { id: 'market',     icon: ShopIcon,       label: 'Рынок' },
    { id: 'restaurant', icon: RestaurantIcon, label: 'Меню' },
    { id: 'passport',   icon: '🪪',         label: 'Проверить' },
    { id: 'profile',    icon: ProfileIcon,    label: 'Профиль' },
  ],
  inspector: [
    { id: 'inspector', icon: MapIcon,      label: 'Карта' },
    { id: 'passport',  icon: '🪪',       label: 'Паспорта' },
    { id: 'ai',        icon: BrainIcon,    label: 'AI' },
    { id: 'profile',   icon: ProfileIcon,  label: 'Профиль' },
  ],
};

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.15 } },
};

function PhoneFrame({ children }) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > DESKTOP_BREAKPOINT);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > DESKTOP_BREAKPOINT);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Live clock in status bar
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!isDesktop) return <>{children}</>;

  return createPortal(
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f5f7fa 40%, #e8ecf2 100%)',
      padding: 20,
      position: 'fixed', inset: 0, zIndex: 9999,
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(0,212,170,0.04) 0%, transparent 60%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />

      {/* Phone body */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 393,
          height: 'calc(100vh - 60px)',
          maxHeight: 852,
          background: '#050D1A',
          borderRadius: 54,
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: `
            0 0 0 1px rgba(0,0,0,0.10),
            0 4px 8px rgba(0,0,0,0.12),
            0 12px 28px rgba(0,0,0,0.18),
            0 30px 70px rgba(0,0,0,0.25),
            0 55px 120px rgba(0,0,0,0.15),
            0 0 100px rgba(0,212,170,0.06)
          `,
          overflow: 'hidden',
        }}
      >
        {/* Side buttons */}
        <div style={{
          position: 'absolute', right: -3, top: 140, width: 3, height: 55,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '0 2px 2px 0', zIndex: 400,
        }} />
        <div style={{
          position: 'absolute', right: -3, top: 210, width: 3, height: 38,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '0 2px 2px 0', zIndex: 400,
        }} />
        <div style={{
          position: 'absolute', left: -3, top: 175, width: 3, height: 45,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px 0 0 2px', zIndex: 400,
        }} />

        {/* iPhone Status Bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 54,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          zIndex: 250,
        }}>
          {/* Time */}
          <span style={{
            fontSize: 15, fontWeight: 700,
            color: '#fff', letterSpacing: '0.3px',
            fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            {currentTime.toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit',
              hour12: false,
            }).replace(/^0/, '')}
          </span>

          {/* Status Right: Signal, WiFi, Battery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Signal bars */}
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#fff" opacity="0.2"/>
              <rect x="5" y="5" width="3" height="7" rx="0.5" fill="#fff" opacity="0.2"/>
              <rect x="10" y="2.5" width="3" height="9.5" rx="0.5" fill="#fff" opacity="0.2"/>
              <rect x="14" y="0" width="3" height="12" rx="0.5" fill="#fff"/>
            </svg>

            {/* WiFi icon */}
            <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden="true">
              <path d="M7 8.5c-1 0-1.8.4-2.5 1" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
              <path d="M4.5 6.5C5.8 5.5 6.4 5 7 5s1.2.5 2.5 1.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
              <path d="M7 11h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>

            {/* Battery */}
            <div style={{
              position: 'relative',
              width: 25, height: 12,
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 3,
              display: 'flex', alignItems: 'center',
              padding: 1,
            }} aria-hidden="true">
              <div style={{
                width: '92%', height: '100%',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 1.5,
              }} />
              {/* Battery tip */}
              <div style={{
                position: 'absolute', right: -4, top: '50%',
                transform: 'translateY(-50%)',
                width: 2, height: 4,
                background: 'rgba(255,255,255,0.35)',
                borderRadius: '0 1px 1px 0',
              }} />
            </div>
          </div>
        </div>

        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 33,
          background: '#000',
          borderRadius: 20,
          zIndex: 260,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: 14,
        }}>
          {/* Camera lens */}
          <div style={{
            width: 9, height: 9, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #2a5aaa, #1a3a7a)',
            boxShadow: '0 0 6px rgba(30,60,150,0.4)',
          }} />
        </div>

        {/* Screen content */}
        <div style={{
          height: '100%',
          display: 'flex', flexDirection: 'column',
          paddingTop: 54,
        }}>
          {children}
        </div>

        {/* Home indicator */}
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          width: 134, height: 5, borderRadius: 3,
          background: 'rgba(255,255,255,0.15)',
          zIndex: 200,
        }} />
      </motion.div>
    </div>,
    document.body
  );
}

export default function App() {
  const { user, role } = useAuth();
  const TABS = TABS_BY_ROLE[role] || TABS_BY_ROLE.fisher;
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
      <PhoneFrame>
      <div style={{
        width: '100%', flex: 1,
        background: '#050D1A', padding: '60px 16px 40px',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(0,212,170,0.2)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 8,
          }}>
            <CaspiNetLogo size={28} />
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>CaspiNet</div>
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
        >            ← Войти в приложение
          </motion.button>
        </div>
      </PhoneFrame>
      );
    }

  if (!user) return <PhoneFrame><div style={{ flex: 1, height: '100%', overflow: 'hidden' }}><LoginPage /></div></PhoneFrame>;
  if (!role) return <PhoneFrame><div style={{ flex: 1, height: '100%', overflow: 'hidden' }}><RegisterPage /></div></PhoneFrame>;

  return (
    <PhoneFrame>
    <div style={{
      width: '100%', flex: 1,
      background: '#050D1A', fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'
    }}>
      {/* Фоновые градиентные пятна */}
      <div style={{
        position: 'absolute', top: -100, left: -100, width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: 100, right: -80, width: 250, height: 250,
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
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(0,212,170,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><CaspiNetLogo size={22} /></div>
          <div>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>CaspiNet</div>
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
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
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
            {activeTab === 'passport' && <PassportQRCode />}
            {activeTab === 'profile'    && <ProfileView />}
            {activeTab === 'license' && <LicenseView />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Нижний навбар */}
      <div style={{
        width: '100%', flexShrink: 0, zIndex: 100,
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
              <span style={{ fontSize: 20, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {typeof tab.icon === 'string' ? tab.icon : <tab.icon size={20} />}
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
    </PhoneFrame>
  );
}