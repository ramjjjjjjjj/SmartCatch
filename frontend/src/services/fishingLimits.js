/**
 * Fishing Limits Service — Smart Catch
 *
 * Manages Firestore collections for:
 * - fishing_limits: daily/monthly catch limits per fish type
 * - alerts: active alerts when thresholds are exceeded
 */

import { db } from '../pages/firebase.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { DEFAULT_DAILY_LIMITS, generatePoliceAlert } from './fisheryAI.js';

const LIMITS_COLLECTION = 'fishing_limits';
const ALERTS_COLLECTION = 'alerts';

// ─── Limits CRUD ────────────────────────────────────────────────

/**
 * Get all fishing limits from Firestore.
 * Falls back to defaults if none are set.
 */
export async function getLimits() {
  try {
    const snap = await getDocs(collection(db, LIMITS_COLLECTION));
    if (snap.empty) {
      // Seed defaults
      const defaults = DEFAULT_DAILY_LIMITS;
      for (const [fishType, lim] of Object.entries(defaults)) {
        await setDoc(doc(db, LIMITS_COLLECTION, fishType), {
          fishType,
          daily: lim.daily,
          monthly: lim.monthly,
          updatedAt: serverTimestamp(),
        });
      }
      return defaults;
    }

    const limits = {};
    snap.forEach((d) => {
      const data = d.data();
      limits[data.fishType || d.id] = {
        daily: data.daily || 0,
        monthly: data.monthly || 0,
      };
    });
    return limits;
  } catch {
    return { ...DEFAULT_DAILY_LIMITS };
  }
}

/**
 * Update a limit for a specific fish type.
 */
export async function setLimit(fishType, dailyLimit, monthlyLimit) {
  await setDoc(doc(db, LIMITS_COLLECTION, fishType), {
    fishType,
    daily: dailyLimit,
    monthly: monthlyLimit,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Listen to limit changes in real-time.
 */
export function onLimitsChange(callback) {
  return onSnapshot(collection(db, LIMITS_COLLECTION), (snap) => {
    const limits = {};
    snap.forEach((d) => {
      const data = d.data();
      limits[data.fishType || d.id] = {
        daily: data.daily || 0,
        monthly: data.monthly || 0,
      };
    });
    callback(Object.keys(limits).length > 0 ? limits : { ...DEFAULT_DAILY_LIMITS });
  });
}

// ─── Alerts ─────────────────────────────────────────────────────

/**
 * Create a new alert (from AI analysis or threshold exceedance).
 */
export async function createAlert(alertData) {
  const ref = doc(collection(db, ALERTS_COLLECTION));
  const alert = {
    ...alertData,
    id: ref.id,
    createdAt: serverTimestamp(),
    acknowledged: false,
    policeNotified: false,
  };
  await setDoc(ref, alert);
  return alert;
}

/**
 * Get all recent alerts.
 */
export async function getAlerts(max = 20) {
  const q = query(
    collection(db, ALERTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Listen to alerts in real-time.
 */
export function onAlertsChange(callback, max = 20) {
  const q = query(
    collection(db, ALERTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(max)
  );
  return onSnapshot(q, (snap) => {
    const alerts = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() || new Date(),
    }));
    callback(alerts);
  });
}

/**
 * Mark an alert as acknowledged.
 */
export async function acknowledgeAlert(alertId) {
  await updateDoc(doc(db, ALERTS_COLLECTION, alertId), {
    acknowledged: true,
  });
}

/**
 * Mark that police has been notified for an alert.
 */
export async function notifyPolice(alertId) {
  await updateDoc(doc(db, ALERTS_COLLECTION, alertId), {
    policeNotified: true,
    policeNotifiedAt: serverTimestamp(),
  });
}

/**
 * Delete an alert.
 */
export async function deleteAlert(alertId) {
  await deleteDoc(doc(db, ALERTS_COLLECTION, alertId));
}

/**
 * Generate and save an alert when a critical threshold is exceeded.
 */
export async function triggerThresholdAlert(atRiskItem, region = 'Мангистау') {
  const alert = generatePoliceAlert(atRiskItem, region);
  return await createAlert(alert);
}
