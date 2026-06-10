import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeCatches, DEFAULT_DAILY_LIMITS } from '../services/fisheryAI.js';
import {
  getLimits,
  setLimit,
  onLimitsChange,
  onAlertsChange,
  acknowledgeAlert,
  notifyPolice,
  triggerThresholdAlert,
} from '../services/fishingLimits.js';
import { db } from '../pages/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

const RISK_COLORS = {
  low: '#00D4AA',
  medium: '#FF9500',
  high: '#FF5050',
  critical: '#FF0033',
};

const CARD = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0,212,170,0.12)',
  borderRadius: 16,
  padding: '16px 18px',
};

export default function FisheryLimitsDashboard() {
  const [limits, setLimits] = useState({ ...DEFAULT_DAILY_LIMITS });
  const [alerts, setAlerts] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [catches, setCatches] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [editingFish, setEditingFish] = useState(null);
  const [editDaily, setEditDaily] = useState('');
  const [editMonthly, setEditMonthly] = useState('');
  const [policeAlertId, setPoliceAlertId] = useState(null);
  const [policeAnimating, setPoliceAnimating] = useState(false);
  const [aiMode, setAiMode] = useState('auto'); // 'auto' | 'gemini' | 'local'

  // Load data
  useEffect(() => {
    const unsubLimits = onLimitsChange((l) => setLimits(l));
    const unsubAlerts = onAlertsChange((a) => setAlerts(a));

    // Fetch catches from both locations collection and API
    const loadCatches = async () => {
      const fromFirestore = [];
      try {
        const snap = await getDocs(collection(db, 'locations'));
        snap.forEach((d) => {
          const data = d.data();
          fromFirestore.push({
            fish: data.fish || '',
            weight: data.weight || 0,
            fish_type: data.fish || '',
            weight_kg: data.weight || 0,
            lat: data.lat,
            lng: data.lng,
            boat: data.boat,
            caught_at: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            createdAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        });
      } catch {}
      setCatches(fromFirestore);
    };
    loadCatches();

    return () => {
      unsubLimits();
      unsubAlerts();
    };
  }, []);

  // Run AI analysis
  const runAnalysis = useCallback(async () => {
    setLoadingAI(true);
    try {
      const result = await analyzeCatches(catches, limits);
      setAnalysis(result);
      setAiMode(import.meta.env.VITE_GEMINI_API_KEY ? 'gemini' : 'local');

      // Auto-trigger alerts for critical items
      if (result?.analysis?.atRisk) {
        for (const item of result.analysis.atRisk) {
          if (item.riskLevel === 'critical') {
            const existing = alerts.find(
              (a) => a.fishType === item.fishType && !a.acknowledged
            );
            if (!existing) {
              await triggerThresholdAlert(item);
            }
          }
        }
      }
    } catch (e) {
      console.error('AI analysis error:', e);
    } finally {
      setLoadingAI(false);
    }
  }, [catches, limits, alerts]);

  // Auto-analyze when catches change
  useEffect(() => {
    if (catches.length > 0) {
      const timer = setTimeout(() => runAnalysis(), 1000);
      return () => clearTimeout(timer);
    }
  }, [catches.length, runAnalysis]);

  // ─── Edit limit ──────────────────────────────────
  const handleEditLimit = (fishType) => {
    const lim = limits[fishType] || { daily: 0, monthly: 0 };
    setEditingFish(fishType);
    setEditDaily(String(lim.daily));
    setEditMonthly(String(lim.monthly));
  };

  const handleSaveLimit = async () => {
    if (!editingFish) return;
    await setLimit(editingFish, Number(editDaily) || 0, Number(editMonthly) || 0);
    setEditingFish(null);
  };

  // ─── Police dispatch ─────────────────────────────
  const handleCallPolice = async (alertItem) => {
    setPoliceAnimating(true);
    setPoliceAlertId(alertItem.id);

    // Simulate dispatch animation
    await new Promise((r) => setTimeout(r, 500));
    await notifyPolice(alertItem.id);
    await new Promise((r) => setTimeout(r, 800));
    setPoliceAnimating(false);
  };

  // ─── Helpers ─────────────────────────────────────
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalAlerts = alerts.filter(
    (a) => a.severity === 'critical' && !a.acknowledged
  );

  const analysisData = analysis?.analysis;
  const overallStatus = analysisData?.overallStatus || 'safe';

  return (
    <div>
      {/* ═══ Status Badge ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', marginBottom: 16,
          borderRadius: 14,
          background:
            overallStatus === 'critical'
              ? 'rgba(255,0,51,0.12)'
              : overallStatus === 'warning'
                ? 'rgba(255,149,0,0.1)'
                : 'rgba(0,212,170,0.08)',
          border:
            overallStatus === 'critical'
              ? '1px solid rgba(255,0,51,0.3)'
              : overallStatus === 'warning'
                ? '1px solid rgba(255,149,0,0.2)'
                : '1px solid rgba(0,212,170,0.2)',
        }}
      >
        <motion.div
          animate={overallStatus !== 'safe' ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background:
              overallStatus === 'critical'
                ? '#FF0033'
                : overallStatus === 'warning'
                  ? '#FF9500'
                  : '#00D4AA',
            boxShadow:
              overallStatus === 'critical'
                ? '0 0 12px rgba(255,0,51,0.6)'
                : 'none',
          }}
        />
        <span style={{
          flex: 1, fontSize: 13, fontWeight: 600,
          color: overallStatus === 'critical'
            ? '#FF5050'
            : overallStatus === 'warning'
              ? '#FF9500'
              : '#00D4AA',
        }}>
          {overallStatus === 'critical'
            ? '⚠️ КРИТИЧЕСКИЙ УРОВЕНЬ — превышение квот!'
            : overallStatus === 'warning'
              ? '⚠️ Внимание — квоты на пределе'
              : '✅ Система стабильна, квоты в норме'}
        </span>

        {overallStatus !== 'safe' && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ fontSize: 18 }}
          >
            🚨
          </motion.div>
        )}
      </motion.div>

      {/* ═══ AI Analysis Summary ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ ...CARD, marginBottom: 16 }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
            🤖 AI Анализ промысла
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
            {aiMode === 'gemini' ? 'Gemini AI' : 'Local AI'}
          </div>
        </div>

        {loadingAI ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 16, height: 16, border: '2px solid rgba(0,212,170,0.3)', borderTop: '2px solid #00D4AA', borderRadius: '50%' }}
            />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>AI анализирует данные...</span>
          </div>
        ) : analysisData ? (
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10, lineHeight: 1.5 }}>
              {analysisData.recommendation}
            </div>

            {/* Anomalies */}
            {analysisData.anomalies?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                {analysisData.anomalies.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px', marginBottom: 6,
                      background:
                        a.severity === 'high'
                          ? 'rgba(255,0,51,0.08)'
                          : 'rgba(255,149,0,0.08)',
                      borderRadius: 10,
                      border:
                        a.severity === 'high'
                          ? '1px solid rgba(255,0,51,0.15)'
                          : '1px solid rgba(255,149,0,0.15)',
                      fontSize: 12, color: a.severity === 'high' ? '#FF5050' : '#FF9500',
                    }}
                  >
                    {a.description}
                  </div>
                ))}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={runAnalysis}
              style={{
                padding: '8px 16px', fontSize: 11,
                background: 'rgba(0,212,170,0.1)',
                border: '1px solid rgba(0,212,170,0.2)',
                borderRadius: 10, color: '#00D4AA', cursor: 'pointer',
              }}
            >
              🔄 Перезапустить анализ
            </motion.button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: '8px 0' }}>
            Нет данных для анализа
          </div>
        )}
      </motion.div>

      {/* ═══ Limits per Fish Type ═══ */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        📊 Лимиты вылова
      </div>

      {Object.entries(limits).map(([fishType, lim], i) => {
        const risk = analysisData?.atRisk?.find((r) => r.fishType === fishType);
        const pctDaily = risk?.percentDaily || 0;
        const pctMonthly = risk?.percentMonthly || 0;
        const riskColor = RISK_COLORS[risk?.riskLevel || 'low'];

        return (
          <motion.div
            key={fishType}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{ ...CARD, marginBottom: 10 }}
          >
            {editingFish === fishType ? (
              /* Edit mode */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, flex: 1 }}>{fishType}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 4 }}>Дневной лимит (кг)</label>
                    <input
                      type="number"
                      value={editDaily}
                      onChange={(e) => setEditDaily(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, fontSize: 13, color: '#fff',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 4 }}>Месячный лимит (кг)</label>
                    <input
                      type="number"
                      value={editMonthly}
                      onChange={(e) => setEditMonthly(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, fontSize: 13, color: '#fff',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveLimit}
                    style={{
                      padding: '8px 18px',
                      background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
                      border: 'none', borderRadius: 10, color: '#fff',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Сохранить
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingFish(null)}
                    style={{
                      padding: '8px 18px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, color: 'rgba(255,255,255,0.5)',
                      fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Отмена
                  </motion.button>
                </div>
              </div>
            ) : (
              /* Display mode */
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{fishType}</span>
                    {risk && (
                      <span style={{
                        fontSize: 9, padding: '2px 8px', borderRadius: 10,
                        background: `${riskColor}20`,
                        color: riskColor,
                        border: `1px solid ${riskColor}30`,
                      }}>
                        {risk.riskLevel === 'critical' ? 'ПРЕВЫШЕНИЕ' : risk.riskLevel === 'high' ? `${risk.percentDaily}%` : `${risk.percentDaily}%`}
                      </span>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleEditLimit(fishType)}
                    style={{
                      background: 'none', border: 'none',
                      color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
                      fontSize: 13, padding: 4,
                    }}
                  >
                    ✏️
                  </motion.button>
                </div>

                {/* Daily limit bar */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 11, marginBottom: 4,
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Дневной лимит</span>
                    <span style={{ color: riskColor, fontWeight: 600 }}>
                      {risk?.dailyUsage || 0} / {lim.daily} кг {pctDaily > 0 ? `· ${pctDaily}%` : ''}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pctDaily, 100)}%` }}
                      transition={{ duration: 0.6 }}
                      style={{
                        height: '100%', borderRadius: 4,
                        background: riskColor,
                        boxShadow: riskColor === '#FF0033' ? '0 0 8px rgba(255,0,51,0.5)' : 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Monthly limit bar */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 11, marginBottom: 4,
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Месячный лимит</span>
                    <span style={{ color: RISK_COLORS[risk?.riskLevel === 'low' ? 'low' : risk?.riskLevel || 'low'], fontWeight: 600 }}>
                      {risk?.monthlyUsage || 0} / {lim.monthly} кг {pctMonthly > 0 ? `· ${pctMonthly}%` : ''}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pctMonthly, 100)}%` }}
                      transition={{ duration: 0.6 }}
                      style={{
                        height: '100%', borderRadius: 4,
                        background: RISK_COLORS[risk?.riskLevel === 'low' ? 'low' : risk?.riskLevel || 'low'],
                      }}
                    />
                  </div>
                </div>

                {/* AI Prediction */}
                {risk?.hoursUntilExceeded !== null && risk?.hoursUntilExceeded !== undefined && (
                  <div style={{
                    fontSize: 11, color: riskColor,
                    padding: '6px 10px', marginTop: 4,
                    background: `${riskColor}10`,
                    borderRadius: 8,
                  }}>
                    🤖 AI прогноз: превышение дневного лимита через ~{risk.hoursUntilExceeded}{' '}
                    {risk.hoursUntilExceeded === 1 ? 'час' : risk.hoursUntilExceeded < 5 ? 'часа' : 'часов'}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* ═══ Alerts Section ═══ */}
      {alerts.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: 1,
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🚨 Активные тревоги
            {unacknowledgedAlerts.length > 0 && (
              <span style={{
                background: '#FF5050', color: '#fff', fontSize: 10,
                padding: '1px 7px', borderRadius: 10, fontWeight: 600,
              }}>
                {unacknowledgedAlerts.length}
              </span>
            )}
          </div>

          <AnimatePresence>
            {alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  ...CARD, marginBottom: 8,
                  border:
                    alert.severity === 'critical' && !alert.acknowledged
                      ? '1px solid rgba(255,0,51,0.3)'
                      : alert.acknowledged
                        ? '1px solid rgba(255,255,255,0.06)'
                        : '1px solid rgba(255,149,0,0.2)',
                  background:
                    alert.severity === 'critical' && !alert.acknowledged
                      ? 'rgba(255,0,51,0.06)'
                      : alert.acknowledged
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(255,149,0,0.05)',
                }}
              >
                {alert.severity === 'critical' && !alert.acknowledged && (
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ fontSize: 24, textAlign: 'center', marginBottom: 8 }}
                  >
                    🚨
                  </motion.div>
                )}

                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  marginBottom: 8,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: alert.severity === 'critical' ? '#FF5050' : '#FF9500',
                    }}>
                      {alert.fishType} — {alert.percent}% лимита
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                      {alert.message?.slice(0, 100)}...
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex', gap: 8, flexWrap: 'wrap',
                  marginTop: 8,
                }}>
                  {/* Call Police button */}
                  {alert.severity === 'critical' && !alert.acknowledged && (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleCallPolice(alert)}
                      disabled={policeAnimating}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px',
                        background:
                          alert.policeNotified
                            ? 'rgba(0,212,170,0.1)'
                            : 'linear-gradient(135deg, #FF0033, #FF5050)',
                        border: alert.policeNotified
                          ? '1px solid rgba(0,212,170,0.2)'
                          : 'none',
                        borderRadius: 10,
                        color: alert.policeNotified ? '#00D4AA' : '#fff',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {policeAnimating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.6 }}
                          style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%' }}
                        />
                      ) : alert.policeNotified ? (
                        '✅ Полиция уведомлена'
                      ) : (
                        '🚔 Вызвать полицию'
                      )}
                    </motion.button>
                  )}

                  {/* Acknowledge button */}
                  {!alert.acknowledged && (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => acknowledgeAlert(alert.id)}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      ✓ Принято
                    </motion.button>
                  )}

                  {alert.policeNotified && (
                    <span style={{
                      fontSize: 10, color: 'rgba(0,212,170,0.5)',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      🕐 {alert.policeNotifiedAt?.toDate
                        ? alert.policeNotifiedAt.toDate().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                        : 'уведомлено'}
                    </span>
                  )}
                </div>

                {/* Police Dispatch Animation */}
                <AnimatePresence>
                  {policeAnimating && policeAlertId === alert.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        marginTop: 10, padding: '10px 14px',
                        background: 'rgba(0,212,170,0.08)',
                        borderRadius: 10,
                        border: '1px solid rgba(0,212,170,0.2)',
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 12, color: '#00D4AA',
                      }}
                    >
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 0.4 }}
                      >
                        🚔
                      </motion.div>
                      <span>Полиция оповещена! Экипаж направляется в регион Мангистау для остановки превышения квоты по {alert.fishType}.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ═══ Empty state ═══ */}
      {alerts.length === 0 && analysisData?.atRisk?.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '20px',
          color: 'rgba(255,255,255,0.2)', fontSize: 13,
        }}>
          ✅ Все квоты в норме. Система AI мониторинга активна.
        </div>
      )}
    </div>
  );
}
