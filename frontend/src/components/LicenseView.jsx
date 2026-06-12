import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PARTNERS = [
  { name: 'eGov Kazakhstan', abbr: 'eGov', desc: 'Государственный портал РК', color: '#0078FF', bg: '#003A7A' },
  { name: 'Комитет рыбного хозяйства', abbr: 'КРХ', desc: 'Министерство экологии РК', color: '#00D4AA', bg: '#004A3A' },
  { name: 'Акимат Мангистауской обл.', abbr: 'АМО', desc: 'Региональный партнёр', color: '#FF9500', bg: '#4A2A00' },
];

const FEATURES = [
  { icon: '🔐', title: 'Цифровая подпись', desc: 'Каждый паспорт улова защищён уникальным кодом' },
  { icon: '📍', title: 'GPS верификация', desc: 'Координаты улова фиксируются автоматически' },
  { icon: '⛓️', title: 'Цепочка поставки', desc: 'История от рыбака до прилавка неизменна' },
  { icon: '📊', title: 'Квоты онлайн', desc: 'Данные синхронизированы с госреестром' },
];

const LICENSE_STEPS = [
  { step: 1, icon: '📋', title: 'Регистрация в системе', desc: 'Создайте аккаунт через Google Sign-In и выберите роль "Рыбак"', status: 'done', detail: 'Требуется: ФИО, номер телефона, ИИН' },
  { step: 2, icon: '🚤', title: 'Данные лодки и зоны', desc: 'Укажите номер судна и зону промысла в профиле', status: 'done', detail: 'Номер лодки: МЧ-XXXX, зона: Каспийское море' },
  { step: 3, icon: '📸', title: 'Первые 3 улова', desc: 'Зафиксируйте 3 улова с фото и GPS — это подтверждает активность', status: 'active', detail: 'Выполнено: 0 из 3 уловов' },
  { step: 4, icon: '🔍', title: 'Проверка инспектором', desc: 'Инспектор верифицирует ваши данные онлайн — до 3 рабочих дней', status: 'pending', detail: 'Ожидает выполнения шага 3' },
  { step: 5, icon: '🛡️', title: 'Выдача цифровой лицензии', desc: 'Получите QR-лицензию, привязанную к аккаунту', status: 'pending', detail: 'Лицензия действует 1 год, продление онлайн' },
];

const ACHIEVEMENTS = [
  { id: 'first_catch', icon: '🎣', title: 'Первый улов', desc: 'Зафиксирован первый улов', points: 50, done: true },
  { id: 'gps_3', icon: '📍', title: 'GPS-следопыт', desc: '3 улова с GPS-координатами', points: 100, done: false, progress: 1, total: 3 },
  { id: 'passport_qr', icon: '🪪', title: 'Цифровой паспорт', desc: 'Создан первый QR-паспорт', points: 75, done: false, progress: 0, total: 1 },
  { id: 'quota_ok', icon: '⚖️', title: 'В рамках квоты', desc: '5 уловов без превышения квоты', points: 150, done: false, progress: 1, total: 5 },
  { id: 'verified', icon: '✅', title: 'Верифицирован', desc: 'Инспектор подтвердил данные', points: 200, done: false, progress: 0, total: 1 },
  { id: 'licensed', icon: '🏆', title: 'Лицензиат', desc: 'Получена цифровая лицензия', points: 500, done: false, progress: 0, total: 1 },
];

const TOTAL_POINTS = ACHIEVEMENTS.reduce((a, b) => a + b.points, 0);
const EARNED_POINTS = ACHIEVEMENTS.filter(a => a.done).reduce((a, b) => a + b.points, 0);
const TABS = ['Лицензия', 'Как получить', 'Достижения'];

export default function LicenseView() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedStep, setExpandedStep] = useState(null);
  const progressPct = Math.round((EARNED_POINTS / TOTAL_POINTS) * 100);

  return (
    <div style={{ padding: '20px', background: '#050D1A', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 100 }}>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #00D4AA, #0078FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 4px 16px rgba(0,212,170,0.3)' }}>🛡️</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>Лицензия & Доверие</div>
          <div style={{ color: '#00D4AA', fontSize: 11, marginTop: 2 }}>CaspiNet · Verified Digital Platform</div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={{
            flex: 1, padding: '9px 4px', borderRadius: 10, border: 'none',
            background: activeTab === i ? 'rgba(0,212,170,0.15)' : 'transparent',
            color: activeTab === i ? '#00D4AA' : 'rgba(255,255,255,0.4)',
            fontSize: 11, fontWeight: activeTab === i ? 700 : 400, cursor: 'pointer',
            borderBottom: activeTab === i ? '2px solid #00D4AA' : '2px solid transparent'
          }}>{tab}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {activeTab === 0 && (
          <motion.div key="lic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ borderRadius: 20, padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, rgba(0,212,170,0.07), rgba(0,120,255,0.07))', border: '1px solid rgba(0,212,170,0.2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 100, opacity: 0.03, userSelect: 'none' }}>🛡️</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Официальная лицензия</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>CaspiNet Digital Platform</div>
                  <div style={{ color: '#00D4AA', fontSize: 12, marginTop: 3, fontFamily: 'monospace' }}>№ MO-2025-FISH-0142</div>
                </div>
                <div style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.35)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
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
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Партнёры & Интеграции</div>
            {PARTNERS.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: p.bg, border: `1px solid ${p.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color, fontWeight: 800, fontSize: 11 }}>{p.abbr}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>{p.desc}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${p.color}18`, border: `1px solid ${p.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color, fontSize: 11 }}>✓</div>
              </motion.div>
            ))}

            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, marginTop: 20 }}>Безопасность & Верификация</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {FEATURES.map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 14px' }}>
                  <div style={{ fontSize: 20, marginBottom: 10 }}>{f.icon}</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, lineHeight: 1.5 }}>{f.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 1 && (
          <motion.div key="guide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>Прогресс получения лицензии</span>
                <span style={{ color: '#00D4AA', fontWeight: 700, fontSize: 13 }}>2/5</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #00D4AA, #0078FF)', borderRadius: 3 }} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>Выполните все шаги для получения цифровой лицензии</div>
            </div>

            {LICENSE_STEPS.map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                onClick={() => setExpandedStep(expandedStep === s.step ? null : s.step)}
                style={{
                  marginBottom: 10, borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                  border: s.status === 'done' ? '1px solid rgba(0,212,170,0.3)' : s.status === 'active' ? '1px solid rgba(255,149,0,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  background: s.status === 'done' ? 'rgba(0,212,170,0.06)' : s.status === 'active' ? 'rgba(255,149,0,0.06)' : 'rgba(255,255,255,0.025)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: s.status === 'done' ? 'rgba(0,212,170,0.2)' : s.status === 'active' ? 'rgba(255,149,0,0.2)' : 'rgba(255,255,255,0.06)',
                    border: s.status === 'done' ? '2px solid #00D4AA' : s.status === 'active' ? '2px solid #FF9500' : '2px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                  }}>{s.status === 'done' ? '✅' : s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{s.title}</span>
                      {s.status === 'active' && <span style={{ background: 'rgba(255,149,0,0.2)', color: '#FF9500', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>СЕЙЧАС</span>}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 }}>{s.desc}</div>
                  </div>
                  <div style={{ color: s.status === 'done' ? '#00D4AA' : s.status === 'active' ? '#FF9500' : 'rgba(255,255,255,0.2)', fontSize: 16, transform: expandedStep === s.step ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                </div>
                <AnimatePresence>
                  {expandedStep === s.step && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>ℹ️ {s.detail}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            <div style={{ marginTop: 16, padding: 16, background: 'rgba(0,120,255,0.08)', border: '1px solid rgba(0,120,255,0.2)', borderRadius: 14 }}>
              <div style={{ color: '#0078FF', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>📌 Важно знать</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.6 }}>Лицензия выдаётся бесплатно в цифровом формате. Срок действия — 1 год с возможностью онлайн-продления. При нарушении квот лицензия приостанавливается автоматически.</div>
            </div>
          </motion.div>
        )}

        {activeTab === 2 && (
          <motion.div key="ach" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.08), rgba(0,120,255,0.08))', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 18, padding: 18, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Рейтинг рыбака</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginTop: 2 }}>🥈 Опытный рыбак</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#00D4AA', fontWeight: 800, fontSize: 22 }}>{EARNED_POINTS}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>из {TOTAL_POINTS} XP</div>
                </div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginTop: 12 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #00D4AA, #0078FF)', borderRadius: 4, boxShadow: '0 0 10px rgba(0,212,170,0.5)' }} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>Наберите 925 XP → получите лицензию автоматически</div>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Уровни</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
              {[
                { icon: '🥉', title: 'Новичок', xp: '0', done: true, active: false },
                { icon: '🥈', title: 'Опытный', xp: '50', done: false, active: true },
                { icon: '🥇', title: 'Мастер', xp: '300', done: false, active: false },
                { icon: '🏆', title: 'Лицензиат', xp: '925', done: false, active: false },
              ].map((lvl) => (
                <div key={lvl.title} style={{ flexShrink: 0, padding: '12px 14px', borderRadius: 14, textAlign: 'center', minWidth: 80, background: lvl.active ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.025)', border: lvl.active ? '1px solid rgba(0,212,170,0.4)' : '1px solid rgba(255,255,255,0.06)', opacity: lvl.done || lvl.active ? 1 : 0.5 }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{lvl.icon}</div>
                  <div style={{ color: lvl.active ? '#00D4AA' : '#fff', fontWeight: 600, fontSize: 10 }}>{lvl.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 2 }}>{lvl.xp} XP</div>
                </div>
              ))}
            </div>

            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Достижения</div>
            {ACHIEVEMENTS.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: a.done ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.025)', border: a.done ? '1px solid rgba(0,212,170,0.25)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 8, opacity: a.done ? 1 : 0.75 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: a.done ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, filter: a.done ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: a.done ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 13 }}>{a.title}</span>
                    <span style={{ color: a.done ? '#00D4AA' : 'rgba(255,255,255,0.2)', fontWeight: 700, fontSize: 12 }}>+{a.points} XP</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>{a.desc}</div>
                  {!a.done && a.progress !== undefined && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${(a.progress / a.total) * 100}%`, height: '100%', background: '#FF9500', borderRadius: 2 }} />
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 3 }}>{a.progress} / {a.total}</div>
                    </div>
                  )}
                </div>
                {a.done && <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,212,170,0.2)', border: '1px solid rgba(0,212,170,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D4AA', fontSize: 12, flexShrink: 0 }}>✓</div>}
              </motion.div>
            ))}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}