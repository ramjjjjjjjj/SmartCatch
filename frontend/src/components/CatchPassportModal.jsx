import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPassport, approvePassport, rejectPassport } from '../services/passportService';
import { useAuth } from '../pages/AuthContext.jsx';
import PassportQRCode from './PassportQRCode';

const CARD = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0,212,170,0.12)',
  borderRadius: 14,
  padding: '14px 16px',
};

/**
 * CatchPassportModal — Full-screen digital passport display.
 * Shows all traceability data: passport ID, fish, weight,
 * GPS coordinates, legal status, quota info, and trace chain.
 * Can be opened as a modal or displayed inline.
 */
export default function CatchPassportModal({ passportId, onClose, inline = false }) {
  const { user, role } = useAuth();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (!passportId) return;
    loadPassport();
  }, [passportId]);

  async function loadPassport() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPassport(passportId);
      if (data) {
        setPassport(data);
      } else {
        setError('Паспорт не найден');
      }
    } catch (e) {
      setError('Ошибка загрузки: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!passport) return;
    setApproving(true);
    try {
      await approvePassport(passport.passportId, user, '');
      await loadPassport();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!passport) return;
    const reason = prompt('Укажите причину отклонения:');
    if (reason === null) return;
    setApproving(true);
    try {
      await rejectPassport(passport.passportId, user, reason);
      await loadPassport();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    } finally {
      setApproving(false);
    }
  }

  const isInspector = role === 'inspector';
  const canApprove = isInspector && passport?.inspectorApproved === 'pending_inspector';
  const isApproved = passport?.inspectorApproved === 'inspector_approved';

  const content = (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Loading */}
      {loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 0', gap: 12,
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{
              width: 24, height: 24,
              border: '2px solid rgba(0,212,170,0.2)',
              borderTop: '2px solid #00D4AA',
              borderRadius: '50%',
            }}
          />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Загрузка паспорта...
          </span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{
          textAlign: 'center', padding: '40px 0',
          color: '#FF5050', fontSize: 13,
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>❌</div>
          {error}
        </div>
      )}

      {/* Passport content */}
      {passport && !loading && (
        <div>
          {/* Header with QR */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            marginBottom: 20,
          }}>
            <div style={{ flexShrink: 0 }}>
              <PassportQRCode passportId={passport.passportId} size={80} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
              }}>
                Цифровой паспорт улова
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                {passport.passportId}
              </div>
              <div style={{
                fontSize: 11, color: passport.legalColor,
                marginTop: 4, fontWeight: 500,
              }}>
                {passport.legalLabel}
              </div>
            </div>
          </div>

          {/* Inspector approval badge */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', marginBottom: 12,
              borderRadius: 10,
              background: isApproved
                ? 'rgba(0,212,170,0.08)'
                : passport?.inspectorApproved === 'inspector_rejected'
                  ? 'rgba(255,80,80,0.08)'
                  : 'rgba(255,149,0,0.08)',
              border: `1px solid ${
                isApproved
                  ? 'rgba(0,212,170,0.2)'
                  : passport?.inspectorApproved === 'inspector_rejected'
                    ? 'rgba(255,80,80,0.2)'
                    : 'rgba(255,149,0,0.2)'
              }`,
            }}
          >
            <motion.span
              animate={!isApproved && passport?.inspectorApproved === 'pending_inspector'
                ? { opacity: [1, 0.5, 1] }
                : {}
              }
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ fontSize: 16 }}
            >
              {isApproved ? '✅' : passport?.inspectorApproved === 'inspector_rejected' ? '❌' : '⏳'}
            </motion.span>
            <span style={{
              flex: 1, fontSize: 12, fontWeight: 600,
              color: passport?.inspectorColor || 'rgba(255,255,255,0.5)',
            }}>
              {passport?.inspectorLabel || '—'}
            </span>
            {passport?.inspectorName && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                {passport.inspectorName}
              </span>
            )}
          </motion.div>

          {/* Photo */}
          {passport.photoBase64 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 12 }}
            >
              <img
                src={`data:${passport.photoMimeType || 'image/jpeg'};base64,${passport.photoBase64}`}
                alt="Фото улова"
                style={{
                  width: '100%', height: 180,
                  objectFit: 'cover', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </motion.div>
          )}

          {/* AI verification badge */}
          {passport.aiVerified && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', marginBottom: 12,
                background: 'rgba(0,212,170,0.06)',
                borderRadius: 8,
                fontSize: 11, color: '#00D4AA',
              }}
            >
              🤖 AI верификация: {passport.fish} ·
              уверенность {Math.round((passport.aiConfidence || 0) * 100)}%
            </motion.div>
          )}

          {/* Fish + Weight Hero */}
          <div style={{
            ...CARD, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'rgba(0,212,170,0.1)',
              border: '1px solid rgba(0,212,170,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>
              {passport.fishIcon || '🐟'}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                {passport.fish}
              </div>
              <div style={{ fontSize: 14, color: '#00D4AA', fontWeight: 600, marginTop: 2 }}>
                ⚖️ {passport.weight} кг
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { icon: '🚢', label: 'Лодка', value: passport.boat || '—' },
              { icon: '👤', label: 'Рыбак', value: passport.fisher || '—' },
              { icon: '📅', label: 'Дата', value: passport.caughtAt
                ? new Date(passport.caughtAt).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                  })
                : '—'
              },
              { icon: '📍', label: 'Координаты', value: passport.latitude && passport.longitude
                ? `${passport.latitude}°N, ${passport.longitude}°E`
                : 'Не зафиксированы'
              },
              { icon: '🕐', label: 'Паспорт выдан', value: passport.createdAt
                ? new Date(passport.createdAt).toLocaleString('ru-RU', {
                    hour: '2-digit', minute: '2-digit',
                  })
                : '—'
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                style={CARD}
              >
                <div style={{ fontSize: 11, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, wordBreak: 'break-word' }}>
                  {item.value}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Inspector notes */}
          {passport.inspectorNotes && (
            <div style={{
              ...CARD, marginBottom: 12,
              background: 'rgba(255,149,0,0.05)',
              border: '1px solid rgba(255,149,0,0.12)',
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                📝 Заметка инспектора
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                {passport.inspectorNotes}
              </div>
            </div>
          )}

          {/* Approve/Reject buttons for inspector */}
          {canApprove && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: 8, marginBottom: 16 }}
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleApprove}
                disabled={approving}
                style={{
                  flex: 1, padding: '12px',
                  background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  opacity: approving ? 0.6 : 1,
                }}
              >
                {approving ? '⏳...' : '✅ Одобрить'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleReject}
                disabled={approving}
                style={{
                  flex: 1, padding: '12px',
                  background: 'rgba(255,80,80,0.1)',
                  border: '1px solid rgba(255,80,80,0.25)',
                  borderRadius: 12, color: '#FF5050',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  opacity: approving ? 0.6 : 1,
                }}
              >
                ❌ Отклонить
              </motion.button>
            </motion.div>
          )}

          {/* Traceability Chain */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: 1,
              marginBottom: 14,
            }}>
              🔗 Цепочка происхождения
            </div>

            {(passport.traceChain || []).length === 0 ? (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '10px 0' }}>
                Нет событий в цепочке
              </div>
            ) : (
              (passport.traceChain || []).map((event, i) => {
                const isLast = i === (passport.traceChain || []).length - 1;
                return (
                  <motion.div
                    key={event.event + i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    style={{
                      display: 'flex', gap: 12,
                      padding: '10px 0',
                      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Timeline dot + line */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      width: 20, flexShrink: 0,
                    }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: isLast ? '#00D4AA' : 'rgba(0,212,170,0.3)',
                        boxShadow: isLast ? '0 0 8px rgba(0,212,170,0.4)' : 'none',
                      }} />
                      {!isLast && (
                        <div style={{
                          width: 1, flex: 1,
                          background: 'rgba(0,212,170,0.15)',
                          marginTop: 4,
                        }} />
                      )}
                    </div>

                    {/* Event content */}
                    <div style={{ flex: 1, paddingBottom: isLast ? 0 : 4 }}>
                      <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                        {event.label}
                      </div>
                      <div style={{
                        fontSize: 11, color: 'rgba(255,255,255,0.35)',
                        marginTop: 2,
                      }}>
                        {event.actor} · {event.timestamp
                          ? new Date(event.timestamp).toLocaleTimeString('ru-RU', {
                              hour: '2-digit', minute: '2-digit',
                            })
                          : ''
                        }
                      </div>
                      {event.details && (
                        <div style={{
                          fontSize: 11, color: 'rgba(255,255,255,0.4)',
                          marginTop: 2,
                        }}>
                          {event.details}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Verification badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              textAlign: 'center', padding: '12px',
              background: 'rgba(0,212,170,0.05)',
              border: '1px solid rgba(0,212,170,0.12)',
              borderRadius: 12,
              fontSize: 11, color: 'rgba(255,255,255,0.3)',
            }}
          >
            ✓ Данные верифицированы системой CaspiNet
            <br />
            Каспийский бассейн · Мангистауская область
          </motion.div>
        </div>
      )}
    </div>
  );

  // Inline mode — just return content
  if (inline) return content;

  // Modal mode — fullscreen overlay
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto',
            background: '#0D1F35',
            border: '1px solid rgba(0,212,170,0.15)',
            borderRadius: 24,
            padding: '24px 20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Close button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: '50%',
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontSize: 16,
              }}
            >
              ✕
            </motion.button>
          </div>

          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
