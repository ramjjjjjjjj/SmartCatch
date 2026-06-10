import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../pages/firebase.js';
import { collection, onSnapshot } from 'firebase/firestore';
import { analyzeCatches, DEFAULT_DAILY_LIMITS } from '../services/fisheryAI.js';

/**
 * CatchLimitBanner — Shows warnings to fishers when they are
 * approaching daily/monthly catch limits for the selected fish type.
 */
export default function CatchLimitBanner({ fishName, weight, isOnline }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [boatCatches, setBoatCatches] = useState([]);

  // Listen to locations collection for real-time catch totals
  useEffect(() => {
    if (!isOnline) return;
    const unsub = onSnapshot(collection(db, 'locations'), (snap) => {
      const catches = snap.docs.map((d) => ({
        fish: d.data().fish || '',
        weight: d.data().weight || 0,
        boat: d.data().boat || '',
        lat: d.data().lat,
        lng: d.data().lng,
        fish_type: d.data().fish || '',
        weight_kg: d.data().weight || 0,
        caught_at: d.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        createdAt: d.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
      setBoatCatches(catches);
    });
    return () => unsub();
  }, [isOnline]);

  // Run analysis when catches or fish selection changes
  useEffect(() => {
    if (!boatCatches.length || !fishName) return;

    // Filter catches for the relevant fish type
    const relevantCatches = boatCatches.filter(
      (c) => c.fish === fishName || c.fish_type === fishName
    );

    if (relevantCatches.length === 0) {
      setAnalysis(null);
      return;
    }

    const doAnalysis = async () => {
      setLoading(true);
      try {
        const result = await analyzeCatches(relevantCatches, DEFAULT_DAILY_LIMITS);
        setAnalysis(result);
      } catch {
        setAnalysis(null);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(doAnalysis, 500);
    return () => clearTimeout(timer);
  }, [boatCatches, fishName]);

  // Find risk level for this fish type
  const riskItem = analysis?.analysis?.atRisk?.find(
    (r) => r.fishType === fishName
  );
  const pct = riskItem?.percentDaily || 0;
  const riskLevel = riskItem?.riskLevel || 'low';

  // Only show warning if medium or higher
  if (!riskItem || riskLevel === 'low' || loading) {
    if (loading) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', marginBottom: 12,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 10, fontSize: 11,
          color: 'rgba(255,255,255,0.2)',
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: 12, height: 12, border: '2px solid rgba(0,212,170,0.2)', borderTop: '2px solid #00D4AA', borderRadius: '50%' }}
          />
          AI мониторинг квот...
        </div>
      );
    }
    return null;
  }

  const isCritical = riskLevel === 'critical';
  const isHigh = riskLevel === 'high';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        style={{
          padding: '10px 14px', marginBottom: 12,
          borderRadius: 12,
          background: isCritical
            ? 'rgba(255,0,51,0.1)'
            : 'rgba(255,149,0,0.08)',
          border: isCritical
            ? '1px solid rgba(255,0,51,0.3)'
            : '1px solid rgba(255,149,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.span
            animate={isCritical ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ fontSize: 16 }}
          >
            {isCritical ? '🚨' : '⚠️'}
          </motion.span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: isCritical ? '#FF5050' : '#FF9500',
            }}>
              {isCritical
                ? `КВОТА ПРЕВЫШЕНА! ${fishName}: ${pct}%`
                : `Внимание! ${fishName}: использовано ${pct}% дневной квоты`}
            </div>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.4)',
              marginTop: 2,
            }}>
              {riskItem?.dailyUsage || 0} / {riskItem?.dailyLimit} кг ·{' '}
              {riskItem?.hoursUntilExceeded !== null && riskItem?.hoursUntilExceeded !== undefined
                ? `~${riskItem.hoursUntilExceeded} ч до предела`
                : isCritical
                  ? 'Требуется остановить промысел'
                  : ''}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 4, marginTop: 8,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 4, overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ duration: 0.5 }}
            style={{
              height: '100%', borderRadius: 4,
              background: isCritical ? '#FF0033' : '#FF9500',
              boxShadow: isCritical ? '0 0 8px rgba(255,0,51,0.5)' : 'none',
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
