import { motion } from 'framer-motion';

const PARTNERS = [
  {
    name: 'eGov Kazakhstan',
    abbr: 'eGov',
    desc: 'Государственный портал РК',
    color: '#0078FF',
    bg: '#003A7A',
  },
  {
    name: 'Комитет рыбного хозяйства',
    abbr: 'КРХ',
    desc: 'Министерство экологии РК',
    color: '#00D4AA',
    bg: '#004A3A',
  },
  {
    name: 'Акимат Мангистауской обл.',
    abbr: 'АМО',
    desc: 'Региональный партнёр',
    color: '#FF9500',
    bg: '#4A2A00',
  },
];

const FEATURES = [
  { icon: '🔐', title: 'Цифровая подпись', desc: 'Каждый паспорт улова защищён уникальным кодом' },
  { icon: '📍', title: 'GPS верификация', desc: 'Координаты улова фиксируются автоматически' },
  { icon: '⛓️', title: 'Цепочка поставки', desc: 'История от рыбака до прилавка неизменна' },
  { icon: '📊', title: 'Квоты онлайн', desc: 'Данные синхронизированы с госреестром' },
];

export default function LicenseView() {
  return (
    <div style={{
      padding: '20px', background: '#050D1A', minHeight: '100vh',
      color: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 100
    }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, #00D4AA, #0078FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          boxShadow: '0 4px 16px rgba(0,212,170,0.3)'
        }}>🛡️</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>
            Лицензия & Доверие
          </div>
          <div style={{ color: '#00D4AA', fontSize: 11, marginTop: 2 }}>
            CaspiNet · Verified Digital Platform
          </div>
        </div>
      </motion.div>

      {/* License Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          borderRadius: 20, padding: 20, marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.07) 0%, rgba(0,120,255,0.07) 100%)',
          border: '1px solid rgba(0,212,170,0.2)',
          position: 'relative', overflow: 'hidden'
        }}>

        {/* Watermark */}
        <div style={{
          position: 'absolute', right: -10, top: -10,
          fontSize: 100, opacity: 0.03, userSelect: 'none', pointerEvents: 'none'
        }}>🛡️</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{
              color: 'rgba(255,255,255,0.4)', fontSize: 9,
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6
            }}>Официальная лицензия</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>CaspiNet Digital Platform</div>
            <div style={{ color: '#00D4AA', fontSize: 12, marginTop: 3, fontFamily: 'monospace' }}>
              № MO-2025-FISH-0142
            </div>
          </div>
          <div style={{
            background: 'rgba(0,212,170,0.12)',
            border: '1px solid rgba(0,212,170,0.35)',
            borderRadius: 8, padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4AA' }} />
            <span style={{ color: '#00D4AA', fontSize: 11, fontWeight: 600 }}>Активна</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />

        {[
          { label: 'Выдана органом', value: 'Комитет рыбного хозяйства РК' },
          { label: 'Регион действия', value: 'Мангистауская область' },
          { label: 'Действует до', value: '31 декабря 2026 г.' },
          { label: 'Категория', value: 'Цифровой учёт & трейсабилити' },
        ].map((item) => (
          <div key={item.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{item.label}</span>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>
              {item.value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Partners */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div style={{
          color: 'rgba(255,255,255,0.3)', fontSize: 10,
          letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12
        }}>Партнёры & Интеграции</div>

        {PARTNERS.map((p, i) => (
          <motion.div key={p.name}
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.08 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 8
            }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: p.bg, border: `1px solid ${p.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: p.color, fontWeight: 800, fontSize: 11, letterSpacing: 0.5
            }}>{p.abbr}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{p.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>{p.desc}</div>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: `${p.color}18`, border: `1px solid ${p.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: p.color, fontSize: 11, fontWeight: 700
            }}>✓</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
        style={{ marginTop: 20 }}>
        <div style={{
          color: 'rgba(255,255,255,0.3)', fontSize: 10,
          letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12
        }}>Безопасность & Верификация</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '16px 14px'
              }}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{f.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, lineHeight: 1.5 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        style={{
          marginTop: 24, padding: '16px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 14, textAlign: 'center'
        }}>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, lineHeight: 1.6 }}>
          CaspiNet зарегистрирован в реестре цифровых платформ РК.{'\n'}
          Данные защищены в соответствии с законодательством Казахстана.
        </div>
      </motion.div>

    </div>
  );
}