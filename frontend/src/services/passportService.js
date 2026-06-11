/**
 * Digital Catch Passport & Traceability Service
 *
 * Generates a unique digital passport for every synced catch.
 * Stores passports in Firestore (collection: 'passports') and locally in Dexie.
 * QR codes encode a verification URL pointing to the passport.
 */

import { db } from '../pages/firebase.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import {
  savePassportLocally,
  getPassportLocally,
  getAllPassports as getLocalPassports,
} from '../db/dexie';

const PASSPORTS_COLLECTION = 'passports';

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Generate a unique passport ID based on timestamp + random suffix.
 */
function generatePassportId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SC-${ts}-${rand}`;
}

/**
 * Build the verification URL for a passport.
 * Uses the current origin so it works in dev and production.
 */
function buildVerificationUrl(passportId) {
  return `${window.location.origin}?verify=${passportId}`;
}

/**
 * Get the QR code image URL from the free API service.
 */
export function getQRCodeUrl(passportId, size = 300) {
  const data = buildVerificationUrl(passportId);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

// ─── Legal status determination ─────────────────────────────────

function determineLegalStatus(catchData, quotaInfo) {
  const hasValidGps = catchData.lat && catchData.lng;

  if (!hasValidGps) {
    return { status: 'pending', label: 'Ожидает проверки', color: '#FF9500' };
  }

  // No quota data — assume compliant (no evidence of violation)
  if (!quotaInfo) {
    return { status: 'compliant', label: '✓ Данные зафиксированы', color: '#00D4AA' };
  }

  // Check quota
  const isQuotaOk = quotaInfo.percentDaily < 90;
  if (!isQuotaOk) {
    return { status: 'quota_warning', label: 'Квота на пределе', color: '#FF5050' };
  }

  return { status: 'compliant', label: '✓ Соответствует нормам', color: '#00D4AA' };
}

// ─── Inspector approval helpers ──────────────────────────────────

const INSPECTOR_STATUS = {
  PENDING: 'pending_inspector',
  APPROVED: 'inspector_approved',
  REJECTED: 'inspector_rejected',
};

function getInspectorStatusLabel(status) {
  switch (status) {
    case INSPECTOR_STATUS.PENDING:
      return { label: '⏳ Ожидает проверки инспектором', color: '#FF9500' };
    case INSPECTOR_STATUS.APPROVED:
      return { label: '✅ Одобрено инспектором', color: '#00D4AA' };
    case INSPECTOR_STATUS.REJECTED:
      return { label: '❌ Отклонено инспектором', color: '#FF5050' };
    default:
      return { label: '—', color: 'rgba(255,255,255,0.3)' };
  }
}

// ─── Passport CRUD ──────────────────────────────────────────────

/**
 * Create a digital passport for a catch.
 * Stores in Firestore + local Dexie, returns the passport object.
 */
export async function createPassport(catchData, quotaInfo = null) {
  const passportId = generatePassportId();
  const now = new Date().toISOString();
  const verificationUrl = buildVerificationUrl(passportId);

  const legalStatus = determineLegalStatus(catchData, quotaInfo);
  const inspectorStatus = getInspectorStatusLabel(INSPECTOR_STATUS.PENDING);

  const passport = {
    passportId,
    verificationUrl,

    // Catch data
    fish: catchData.fish || catchData.fish_type || '',
    fishIcon: catchData.icon || '🐟',
    weight: parseFloat(catchData.weight || catchData.weight_kg || 0),
    boat: catchData.boat || catchData.boat_number || '',
    fisher: catchData.fisher || catchData.name || '',
    fisherUid: catchData.uid || catchData.fisherUid || '',

    // GPS coordinates (Caspian Sea)
    latitude: catchData.lat || catchData.latitude || null,
    longitude: catchData.lng || catchData.longitude || null,

    // Timestamps
    caughtAt: catchData.caught_at || catchData.createdAt || now,
    createdAt: now,

    // Photo & AI verification
    photoBase64: catchData.photoBase64 || '',
    photoMimeType: catchData.photoMimeType || '',
    aiVerified: !!catchData.aiVerified,
    aiConfidence: catchData.aiConfidence || 0,

    // Legal & quota info
    legalStatus: legalStatus.status,
    legalLabel: legalStatus.label,
    legalColor: legalStatus.color,
    quotaDailyUsage: quotaInfo?.dailyUsage || 0,
    quotaDailyLimit: quotaInfo?.dailyLimit || 0,
    quotaPercent: quotaInfo?.percentDaily || 0,

    // Inspector approval
    inspectorApproved: INSPECTOR_STATUS.PENDING,
    inspectorLabel: inspectorStatus.label,
    inspectorColor: inspectorStatus.color,
    inspectorUid: '',
    inspectorName: '',
    inspectorApprovedAt: '',
    inspectorNotes: '',

    // Traceability chain
    traceChain: [
      {
        event: 'catch_recorded',
        label: '🐟 Улов зафиксирован',
        timestamp: catchData.caught_at || now,
        actor: catchData.fisher || 'Рыбак',
        details: `${catchData.fish || 'Рыба'} · ${catchData.weight || 0} кг`,
      },
      {
        event: 'ai_verified',
        label: '🤖 AI верификация вида',
        timestamp: now,
        actor: 'Gemini AI',
        details: catchData.aiVerified
          ? `${catchData.fish} — вид подтверждён (${Math.round((catchData.aiConfidence || 0) * 100)}%)`
          : 'Верификация не проводилась',
      },
      {
        event: 'passport_issued',
        label: '📄 Паспорт выдан',
        timestamp: now,
        actor: 'CaspiNet System',
        details: `Паспорт №${passportId} · Ожидает инспектора`,
      },
    ],
  };

  // Save to Firestore
  try {
    await setDoc(doc(db, PASSPORTS_COLLECTION, passportId), {
      ...passport,
      firestoreSavedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Firestore save failed (offline?):', e.message);
  }

  // Save locally
  await savePassportLocally(passport);

  return passport;
}

/**
 * Approve a passport as an inspector.
 */
export async function approvePassport(passportId, inspectorUser, notes = '') {
  const now = new Date().toISOString();
  const statusInfo = getInspectorStatusLabel(INSPECTOR_STATUS.APPROVED);

  const updates = {
    inspectorApproved: INSPECTOR_STATUS.APPROVED,
    inspectorLabel: statusInfo.label,
    inspectorColor: statusInfo.color,
    inspectorUid: inspectorUser?.uid || '',
    inspectorName: inspectorUser?.displayName || 'Инспектор',
    inspectorApprovedAt: now,
    inspectorNotes: notes,
  };

  // Update Firestore
  try {
    await setDoc(doc(db, PASSPORTS_COLLECTION, passportId), updates, { merge: true });
  } catch {}

  // Add trace event
  await addTraceEvent(passportId, {
    event: 'inspector_approved',
    label: '✅ Инспектор одобрил',
    actor: inspectorUser?.displayName || 'Инспектор',
    details: notes || 'Улов проверен и одобрен',
  });

  // Update local
  const local = await getPassportLocally(passportId);
  if (local) {
    await savePassportLocally({ ...local, ...updates });
  }

  return { ...updates };
}

/**
 * Reject a passport as an inspector.
 */
export async function rejectPassport(passportId, inspectorUser, reason = '') {
  const now = new Date().toISOString();
  const statusInfo = getInspectorStatusLabel(INSPECTOR_STATUS.REJECTED);

  const updates = {
    inspectorApproved: INSPECTOR_STATUS.REJECTED,
    inspectorLabel: statusInfo.label,
    inspectorColor: statusInfo.color,
    inspectorUid: inspectorUser?.uid || '',
    inspectorName: inspectorUser?.displayName || 'Инспектор',
    inspectorApprovedAt: now,
    inspectorNotes: reason,
  };

  // Update Firestore
  try {
    await setDoc(doc(db, PASSPORTS_COLLECTION, passportId), updates, { merge: true });
  } catch {}

  // Add trace event
  await addTraceEvent(passportId, {
    event: 'inspector_rejected',
    label: '❌ Инспектор отклонил',
    actor: inspectorUser?.displayName || 'Инспектор',
    details: reason || 'Улов отклонён при проверке',
  });

  // Update local
  const local = await getPassportLocally(passportId);
  if (local) {
    await savePassportLocally({ ...local, ...updates });
  }

  return { ...updates };
}

/**
 * Retrieve a passport by its ID.
 * Tries Firestore first, falls back to local Dexie.
 */
export async function getPassport(passportId) {
  // Try Firestore first
  try {
    const snap = await getDoc(doc(db, PASSPORTS_COLLECTION, passportId));
    if (snap.exists()) {
      const data = snap.data();
      // Sync to local
      await savePassportLocally(data);
      return { source: 'firestore', ...data };
    }
  } catch {
    // Offline or error — fall through to local
  }

  // Fallback to local Dexie
  const local = await getPassportLocally(passportId);
  if (local) {
    return { source: 'local', ...local };
  }

  return null;
}

/**
 * Fetch all passports from Firestore (latest first).
 */
export async function getAllPassports(max = 50) {
  try {
    const q = query(
      collection(db, PASSPORTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(max)
    );
    const snap = await getDocs(q);
    const passports = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Cache locally
    passports.forEach((p) => savePassportLocally(p));
    return passports;
  } catch {
    return await getLocalPassports();
  }
}

/**
 * Extend the traceability chain when a catch changes hands
 * (e.g., sold to market, bought by restaurant).
 */
export async function addTraceEvent(passportId, eventData) {
  const passport = await getPassport(passportId);
  if (!passport) return null;

  const newChain = [
    ...(passport.traceChain || []),
    {
      event: eventData.event,
      label: eventData.label,
      timestamp: new Date().toISOString(),
      actor: eventData.actor,
      details: eventData.details,
    },
  ];

  // Update Firestore
  try {
    await setDoc(
      doc(db, PASSPORTS_COLLECTION, passportId),
      { traceChain: newChain, lastEvent: eventData.event },
      { merge: true }
    );
  } catch {}

  // Update local
  const local = await getPassportLocally(passportId);
  if (local) {
    await savePassportLocally({ ...local, traceChain: newChain, lastEvent: eventData.event });
  }

  return newChain;
}
