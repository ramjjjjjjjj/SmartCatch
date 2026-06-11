import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Fish, Scales, Boat, Crosshair, CheckCircle, Camera,
  Clock, FileText, CloudArrowUp, Warning, SpinnerGap,
  MapPin, Waves, Hourglass
} from 'phosphor-react';
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
  { name: 'Осётр', id: 'osyotr' },
  { name: 'Сазан', id: 'sazan' },
  { name: 'Вобла', id: 'vobla' },
];

/* ─── Duotone icon helper ─── */
const ICON_SIZE = 22;
const ICON_COLOR = 'currentColor';

/* ─── Shared glassmorphism card style ─── */
const GLASS_CARD = {
  background: 'rgba(5, 13, 26, 0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(0, 212, 170, 0.12)',
  borderRadius: 16,
};

/* ─── Input field base style ─── */
const INPUT_BASE = {
  width: '100%',
  padding: '10px 14px 10px 36px',
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  fontSize: 14,
  color: '#fff',
  outline: 'none',
  transition: 'border-color 0.25s ease',
  boxSizing: 'border-box',
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
  const [photoData, setPhotoData] = useState(null);
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
      icon: selectedFish.id,
      weight: parseFloat(weight),
      boat,
      lat: gps ? parseFloat(gps.lat) : null,
      lng: gps ? parseFloat(gps.lng) : null,
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
        icon: selectedFish.id,
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
      alert(`Синхронизировано ${toSync.length} уловов! Паспорта ожидают проверки инспектора.`);
    } catch (e) {
      alert('Ошибка синхронизации: ' + e.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div style={{ padding: '20px 16px', minHeight: '100vh', background: '#050D1A', fontFamily: 'Inter, system-ui, sans-serif', '--ph-duotone-opacity': '0.15' }}>
      {/* ═══════════════════════════════════════ */}
      {/* СИНХРОНИЗАЦИЯ                          */}
      {/* ═══════════════════════════════════════ */}
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
          <Warning size={20} weight="duotone" color="#FF9500" />
          <span style={{ color: 'rgba(255,255,255,0.7)', flex: 1 }}>
            {pending.length} {pending.length === 1 ? 'улов ожидает' : 'улова ожидают'} синхронизации
          </span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSync}
            disabled={!isOnline || syncing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px',
              background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: !isOnline ? 0.4 : 1,
            }}
          >
            {syncing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ display: 'flex' }}
              >
                <SpinnerGap size={14} weight="bold" />
              </motion.div>
            ) : (
              <CloudArrowUp size={14} weight="bold" />
            )}
            {syncing ? 'Отправка...' : 'Sync'}
          </motion.button>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* AI ЛИМИТЫ                               */}
      {/* ═══════════════════════════════════════ */}
      <CatchLimitBanner fishName={selectedFish.name} isOnline={isOnline} />

      {/* ═══════════════════════════════════════ */}
      {/* ВЫБОР РЫБЫ                             */}
      {/* ═══════════════════════════════════════ */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, fontWeight: 500 }}>
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
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '14px 6px',
                border: `1px solid ${active ? '#00D4AA' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14,
                background: active ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: active ? '0 0 12px rgba(0,212,170,0.2)' : 'none',
              }}
            >
              <Fish
                size={26}
                weight="duotone"
                color={active ? '#00D4AA' : 'rgba(255,255,255,0.4)'}
                style={{ transition: 'color 0.25s ease' }}
              />
              <span style={{
                fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? '#00D4AA' : 'rgba(255,255,255,0.4)',
                transition: 'color 0.25s ease',
              }}>
                {f.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* ФОРМА ДАННЫХ УЛОВА (GLASSMORPHISM)     */}
      {/* ═══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ ...GLASS_CARD, padding: '20px 18px', marginBottom: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Waves size={14} weight="duotone" color="rgba(0,212,170,0.7)" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500 }}>
            Данные улова
          </span>
        </div>

        {/* Photo & AI verification */}
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
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', letterSpacing: 0.5 }}>
            Вес (кг)
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              zIndex: 1, pointerEvents: 'none', display: 'flex', alignItems: 'center',
            }}>
              <Scales size={16} weight="duotone" color="rgba(255,255,255,0.3)" />
            </div>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="например: 25"
              style={INPUT_BASE}
              onFocus={(e) => e.target.style.borderColor = '#00D4AA'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        </div>

        {/* Лодка */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', letterSpacing: 0.5 }}>
            Номер лодки
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              zIndex: 1, pointerEvents: 'none', display: 'flex', alignItems: 'center',
            }}>
              <Boat size={16} weight="duotone" color="rgba(255,255,255,0.3)" />
            </div>
            <input
              type="text"
              value={boat}
              onChange={(e) => setBoat(e.target.value)}
              style={INPUT_BASE}
              onFocus={(e) => e.target.style.borderColor = '#00D4AA'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        </div>

        {/* GPS */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={getGPS}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
            background: gps ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${gps ? 'rgba(0,212,170,0.25)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 12, cursor: 'pointer', marginBottom: 16,
            transition: 'all 0.25s ease',
          }}
        >
          {gps ? (
            <CheckCircle size={20} weight="duotone" color="#00D4AA" />
          ) : (
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Crosshair size={20} weight="duotone" color={gpsLoading ? '#FF9500' : '#00D4AA'} />
            </motion.div>
          )}
          <span style={{
            fontSize: 13, fontFamily: gps ? 'monospace' : 'inherit',
            color: gps ? '#00D4AA' : 'rgba(0,212,170,0.6)', flex: 1,
            transition: 'color 0.25s ease',
          }}>
            {gpsLoading ? 'Определяем...' : gps ? `${gps.lat}°N, ${gps.lng}°E` : 'Нажмите для фиксации GPS'}
          </span>
          <MapPin size={16} weight="duotone" color={gps ? '#00D4AA' : 'rgba(255,255,255,0.2)'} />
        </motion.div>

        {/* Кнопка фиксации улова */}
        <motion.button
          whileTap={aiVerificationPassed ? { scale: 0.96 } : {}}
          onClick={handleAddCatch}
          disabled={!aiVerificationPassed}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '14px',
            background: aiVerificationPassed
              ? 'linear-gradient(135deg, #00D4AA, #0078FF)'
              : 'rgba(255,255,255,0.06)',
            color: aiVerificationPassed ? '#fff' : 'rgba(255,255,255,0.25)',
            border: aiVerificationPassed ? 'none' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            fontSize: 14, fontWeight: 600, cursor: aiVerificationPassed ? 'pointer' : 'not-allowed',
            boxShadow: aiVerificationPassed ? '0 4px 20px rgba(0,212,170,0.2)' : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          {aiVerificationPassed ? (
            <>
              <CheckCircle size={18} weight="duotone" />
              Зафиксировать улов
            </>
          ) : (
            <>
              <Camera size={18} weight="duotone" color="#0078FF" />
              <span style={{ color: '#0078FF' }}>Сделайте фото улова</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* ═══════════════════════════════════════ */}
      {/* ИСТОРИЯ УЛОВОВ                         */}
      {/* ═══════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Clock size={14} weight="duotone" color="rgba(255,255,255,0.3)" />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500 }}>
          История уловов
        </span>
      </div>

      {catches.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '40px 16px', fontSize: 13 }}>
          <Waves size={32} weight="duotone" color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
          <div>Пока нет зафиксированных уловов</div>
        </div>
      ) : (
        catches.slice(0, 12).map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', marginBottom: 8,
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 14,
              borderLeft: `3px solid ${c.synced ? '#00D4AA' : '#FF9500'}`,
            }}
          >
            {/* Icon */}
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Fish size={18} weight="duotone" color={c.synced ? '#00D4AA' : 'rgba(255,255,255,0.5)'} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.2px' }}>
                {c.fish} · {c.weight} кг
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Boat size={11} weight="duotone" color="rgba(255,255,255,0.2)" />
                {c.boat} · {c.lat ? `${c.lat}°N` : 'GPS —'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} weight="duotone" color="rgba(255,255,255,0.2)" />
                {c.caught_at
                  ? new Date(c.caught_at).toLocaleString('ru-RU', {
                      day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '—'
                }
              </div>

              {/* Passport QR */}
              {c.synced && c.passportId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div
                    onClick={() => setPassportModalId(c.passportId)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <PassportQRCode passportId={c.passportId} size={56} compact />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setPassportModalId(c.passportId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '5px 10px', fontSize: 10,
                      background: 'rgba(0,212,170,0.08)',
                      border: '1px solid rgba(0,212,170,0.15)',
                      borderRadius: 8, color: '#00D4AA', cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    <FileText size={11} weight="duotone" />
                    Паспорт
                  </motion.button>
                </div>
              )}
            </div>

            {/* Status badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 3,
                fontSize: 10, padding: '4px 10px', borderRadius: 20,
                background: c.synced ? 'rgba(0,212,170,0.1)' : 'rgba(255,149,0,0.1)',
                color: c.synced ? '#00D4AA' : '#FF9500',
                border: `1px solid ${c.synced ? 'rgba(0,212,170,0.2)' : 'rgba(255,149,0,0.2)'}`,
                fontWeight: 500, whiteSpace: 'nowrap',
              }}>
                {c.synced ? <CheckCircle size={10} weight="duotone" /> : <Hourglass size={10} weight="duotone" />}
                {c.synced ? 'Sync' : 'Local'}
              </span>
              {c.synced && c.passportId && (
                <span style={{
                  fontSize: 8, color: 'rgba(255,255,255,0.15)',
                  fontFamily: 'monospace', letterSpacing: '0.5px',
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
