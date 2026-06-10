import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { saveCatchLocally, getPendingCatches, markSynced, getAllCatches, updateCatchPassportId } from '../db/dexie';
import { db } from '../pages/firebase.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../pages/AuthContext.jsx';
import CatchLimitBanner from './CatchLimitBanner.jsx';
import PassportQRCode from './PassportQRCode';
import CatchPassportModal from './CatchPassportModal';
import FishPhotoCapture from './FishPhotoCapture';
import { createPassport } from '../services/passportService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FISH_OPTIONS = [
  { name: 'Осётр', icon: '🐟' },
  { name: 'Сазан', icon: '🐠' },
  { name: 'Вобла', icon: '🐡' },
];

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0,212,170,0.12)',
  borderRadius: 16,
};

export default function FisherView({ isOnline }) {
  const { user } = useAuth();
  const [selectedFish, setSelectedFish] = useState(FISH_OPTIONS[0]);
  const [weight, setWeight] = useState('');
  const [boat, setBoat] = useState('МЧ-2847');
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [catches, setCatches] = useState([]);
  const [pending, setPending] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [passportModalId, setPassportModalId] = useState(null);

  // Photo & AI verification
  const [photoData, setPhotoData] = useState(null); // { photoBase64, photoMimeType, aiVerified, aiConfidence }
  const [aiVerificationPassed, setAiVerificationPassed] = useState(false);

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
        setGps({ lat: (43.65 + Math.random() * 0.2).toFixed(5), lng: (51.17 + Math.random() * 0.3).toFixed(5) });
        setGpsLoading(false);
      },
      { timeout: 5000 }
    );
  }

  async function handleAddCatch() {
    if (!weight || isNaN(weight)) return alert('Введите вес улова');

    const catchRecord = {
      fish: selectedFish.name,
      icon: selectedFish.icon,
      weight: parseFloat(weight),
      boat,
      lat: gps ? parseFloat(gps.lat) : null,
      lng: gps ? parseFloat(gps.lng) : null,
      // Photo & AI data
      photoBase64: photoData?.photoBase64 || '',
      photoMimeType: photoData?.photoMimeType || '',
      aiVerified: photoData?.aiVerified || false,
      aiConfidence: photoData?.aiConfidence || 0,
    };

    await saveCatchLocally(catchRecord);

    if (gps && user) {
      await setDoc(doc(db, 'locations', user.uid), {
        uid: user.uid,
        name: user.displayName,
        boat,
        lat: parseFloat(gps.lat),
        lng: parseFloat(gps.lng),
        fish: selectedFish.name,
        icon: selectedFish.icon,
        weight: parseFloat(weight),
        updatedAt: serverTimestamp(),
      });
    }

    setWeight('');
    setGps(null);
    setPhotoData(null);
    setAiVerificationPassed(false);
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

      // Generate digital passport for each synced catch
      for (const c of toSync) {
        try {
          const passport = await createPassport(c);
          await updateCatchPassportId(c.id, passport.passportId);
        } catch (passErr) {
          console.warn('Passport generation failed for catch', c.id, passErr);
        }
      }

      await markSynced(toSync.map((c) => c.id));
      await loadCatches();
      alert(`✅ Синхронизировано ${toSync.length} уловов! Паспорта ожидают проверки инспектора.`);
    } catch (e) {
      alert('Ошибка синхронизации: ' + e.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div style={{ padding: '20px 16px', minHeight: '100vh', background: '#050D1A', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Синхронизация */}
      {pending.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,149,0,0.08)',
            border: '1px solid rgba(255,149,0,0.2)',
            borderRadius: 14, padding: '12px 16px',
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
          }}
        >
          <span style={{ fontSize: 18 }}>⏳</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', flex: 1 }}>
            {pending.length} {pending.length === 1 ? 'улов ожидает' : 'улова ожидают'} синхронизации
          </span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSync}
            disabled={!isOnline || syncing}
            style={{
              padding: '7px 16px',
              background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: !isOnline ? 0.4 : 1,
            }}
          >
            {syncing ? 'Отправка...' : 'Sync ↑'}
          </motion.button>
        </motion.div>
      )}

      {/* AI лимиты */}
      <CatchLimitBanner fishName={selectedFish.name} isOnline={isOnline} />

      {/* Выбор рыбы */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Выбор рыбы
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {FISH_OPTIONS.map((f, i) => {
          const active = selectedFish.name === f.name;
          return (
            <motion.button
              key={f.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setSelectedFish(f)}
              style={{
                padding: '12px 6px',
                border: `1.5px solid ${active ? '#00D4AA' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14,
                background: active ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
              <div style={{
                fontSize: 12,
                color: active ? '#00D4AA' : 'rgba(255,255,255,0.5)',
                fontWeight: active ? 600 : 400,
              }}>
                {f.name}
              </div>

            </motion.button>
          );
        })}
      </div>

      {/* Форма улова */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ ...CARD_STYLE, padding: '18px 16px', marginBottom: 20 }}
      >
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          Данные улова
        </div>

        {/* Photo & AI verification — key forces remount on fish change */}
        <FishPhotoCapture
          key={selectedFish.name}
          selectedFish={selectedFish}
          onPhotoVerified={(data) => {
            setPhotoData(data);
            setAiVerificationPassed(true);
          }}
          onVerificationCleared={() => {
            setPhotoData(null);
            setAiVerificationPassed(false);
          }}
        />

        {/* Вес */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Вес (кг)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="например: 25"
            style={{
              width: '100%', padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, fontSize: 14, color: '#fff',
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#00D4AA'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Лодка */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Номер лодки</label>
          <input
            type="text"
            value={boat}
            onChange={(e) => setBoat(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, fontSize: 14, color: '#fff',
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#00D4AA'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* GPS */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={getGPS}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: gps ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${gps ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, cursor: 'pointer', marginBottom: 16,
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: gps ? '#00D4AA' : gpsLoading ? '#FF9500' : 'rgba(255,255,255,0.2)',
            boxShadow: gps ? '0 0 10px rgba(0,212,170,0.5)' : 'none',
          }} />
          <span style={{ fontSize: 13, color: gps ? '#00D4AA' : 'rgba(255,255,255,0.4)', flex: 1 }}>
            {gpsLoading ? 'Определяем...' : gps ? `${gps.lat}°N, ${gps.lng}°E` : 'Нажмите для фиксации GPS'}
          </span>
          <span style={{ fontSize: 16 }}>📍</span>
        </motion.div>

        {/* Кнопка — disabled until AI verification passes */}
        <motion.button
          whileTap={aiVerificationPassed ? { scale: 0.96 } : {}}
          onClick={handleAddCatch}
          disabled={!aiVerificationPassed}
          style={{
            width: '100%', padding: '14px',
            background: aiVerificationPassed
              ? 'linear-gradient(135deg, #00D4AA, #0078FF)'
              : 'rgba(255,255,255,0.06)',
            color: aiVerificationPassed ? '#fff' : 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 600, cursor: aiVerificationPassed ? 'pointer' : 'not-allowed',
            boxShadow: aiVerificationPassed ? '0 4px 20px rgba(0,212,170,0.2)' : 'none',
          }}
        >
          {aiVerificationPassed ? '+ Зафиксировать улов' : '📸 Требуется AI верификация фото'}
        </motion.button>
      </motion.div>

      {/* Локальная база */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        История уловов
      </div>
      {catches.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '30px 16px', fontSize: 13 }}>
          Пока нет зафиксированных уловов
        </div>
      ) : (
        catches.slice(0, 12).map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', marginBottom: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              borderLeft: `3px solid ${c.synced ? '#00D4AA' : '#FF9500'}`,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              {c.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>
                {c.fish} · {c.weight} кг
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                {c.boat} · {c.lat ? `${c.lat}°N` : 'GPS не зафиксирован'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                🕐 {c.caught_at
                  ? new Date(c.caught_at).toLocaleString('ru-RU', {
                      day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '—'
                }
              </div>
              {/* Passport QR for synced catches */}
              {c.synced && c.passportId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <div
                    onClick={() => setPassportModalId(c.passportId)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <PassportQRCode passportId={c.passportId} size={60} compact />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setPassportModalId(c.passportId)}
                    style={{
                      padding: '4px 10px', fontSize: 9,
                      background: 'rgba(0,212,170,0.08)',
                      border: '1px solid rgba(0,212,170,0.15)',
                      borderRadius: 6, color: '#00D4AA', cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    📄 Паспорт
                  </motion.button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{
                fontSize: 10, padding: '4px 10px', borderRadius: 20,
                background: c.synced ? 'rgba(0,212,170,0.1)' : 'rgba(255,149,0,0.1)',
                color: c.synced ? '#00D4AA' : '#FF9500',
                border: `1px solid ${c.synced ? 'rgba(0,212,170,0.2)' : 'rgba(255,149,0,0.2)'}`,
                fontWeight: 500, whiteSpace: 'nowrap',
              }}>
                {c.synced ? '✓ Sync' : '⏳ Local'}
              </span>
              {/* Small passport ID badge */}
              {c.synced && c.passportId && (
                <span style={{
                  fontSize: 8, color: 'rgba(255,255,255,0.2)',
                  fontFamily: 'monospace',
                }}>
                  {c.passportId.slice(0, 10)}...
                </span>
              )}
            </div>
          </motion.div>
        ))
      )}

      {/* Passport modal */}
      {passportModalId && (
        <CatchPassportModal
          passportId={passportModalId}
          onClose={() => setPassportModalId(null)}
        />
      )}
    </div>
  );
}
