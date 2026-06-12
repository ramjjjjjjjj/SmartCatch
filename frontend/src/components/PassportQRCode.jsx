import { useState, useEffect } from 'react';
import { useAuth } from '../pages/AuthContext.jsx';
import QRCode from 'react-qr-code';

const STORAGE_KEY = 'caspinet_batches';

const loadBatches = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
};

const saveBatch = (batch) => {
  const all = loadBatches();
  all[batch.batch_code] = batch;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

const updateBatchChain = (batch_code, chainStep, newStatus) => {
  const all = loadBatches();
  if (!all[batch_code]) return;
  all[batch_code].chain = [...(all[batch_code].chain || []), chainStep];
  all[batch_code].status = newStatus;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

export default function PassportQRCode() {
  const { user, role } = useAuth();
  const [form, setForm] = useState({ species: '', weight: '' });
  const [batchCode, setBatchCode] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanCode, setScanCode] = useState('');
  const [chainData, setChainData] = useState(null);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Load fisher history from localStorage on mount
  useEffect(() => {
    if (role === 'fisher') {
      const all = loadBatches();
      const mine = Object.values(all).filter(b => b.fisher_name === user?.displayName);
      setHistory(mine.reverse());
    }
  }, [role, user]);

  const createBatch = () => {
    if (!form.species || !form.weight) return setError('Заполните все поля');
    setError('');
    setIsGenerating(true);
    const code = `SC-${Date.now()}`;
    const batch = {
      batch_code: code,
      species: form.species,
      weight: form.weight,
      fisher_name: user.displayName,
      caught_at: new Date().toISOString(),
      status: 'caught',
      chain: [
        { actor_role: 'fisher', actor_name: user.displayName, note: 'Улов зафиксирован', timestamp: new Date().toISOString() }
      ],
    };
    setTimeout(() => {
      saveBatch(batch);
      setBatchCode(code);
      setCurrentBatch(batch);
      setHistory(prev => [batch, ...prev]);
      setForm({ species: '', weight: '' });
      setIsGenerating(false);
    }, 2000);
  };

  const lookupBatch = () => {
    if (!scanCode.trim()) return;
    setError('');
    const all = loadBatches();
    const found = all[scanCode.trim()];
    if (!found) return setError('Паспорт не найден');
    setChainData({ batch: found, chain: found.chain || [] });
  };

  const signBatch = (batch_code, note) => {
    const step = { actor_role: role, actor_name: user.displayName, note, timestamp: new Date().toISOString() };
    updateBatchChain(batch_code, step, role);
    setChainData(prev => ({
      ...prev,
      batch: { ...prev.batch, status: role },
      chain: [...prev.chain, step],
    }));
  };

  const ROLE_LABELS = {
    fisher: 'Рыбак', driver: 'Водитель', company: 'Компания',
    restaurant: 'Ресторан', inspector: 'Инспектор',
  };

  const ROLE_ICONS = {
    fisher: '🎣', driver: '🚚', company: '🏭', restaurant: '🍽️', inspector: '📋',
  };

  const STATUS_MAP = {
    caught: { label: 'ВЫЛОВЛЕН', color: '#00D4AA' },
    driver: { label: 'В ТРАНСПОРТЕ', color: '#A78BFA' },
    company: { label: 'НА СКЛАДЕ', color: '#60A5FA' },
    restaurant: { label: 'У РЕСТОРАНА', color: '#FF9500' },
    inspector: { label: 'ПРОВЕРЕН', color: '#0078FF' },
  };

  const formatDate = (iso) => new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const accentColor = role === 'inspector' ? '#0078FF' : role === 'restaurant' ? '#FF9500' : '#00D4AA';
  const accentRgb = role === 'inspector' ? '0,120,255' : role === 'restaurant' ? '255,149,0' : '0,212,170';

  const alreadySigned = chainData && chainData.chain.some(s => s.actor_role === role);

  return (
    <div style={{
      padding: '0', background: '#050D1A', minHeight: '100vh',
      color: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 100
    }}>

      {/* FISHER VIEW */}
      {role === 'fisher' && (
        <>
          <div style={{
            background: 'linear-gradient(135deg, #0A1628 0%, #0D2040 100%)',
            borderBottom: '1px solid rgba(0,212,170,0.2)',
            padding: '20px 20px 16px',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(0,212,170,0.7)', letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>
              Республика Казахстан · CaspiNet
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: 0.3 }}>
              Паспорт улова
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Form */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,212,170,0.04), rgba(0,120,255,0.04))',
              border: '1px solid rgba(0,212,170,0.18)',
              borderRadius: 16, padding: 20, marginBottom: 20,
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'linear-gradient(225deg, rgba(0,212,170,0.1), transparent 70%)' }} />
              <div style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(0,212,170,0.55)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 18 }}>
                ▸ Регистрация улова
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7, fontWeight: 600 }}>Вид рыбы</div>
                <input placeholder="Например: сазан, судак, лещ" value={form.species}
                  onChange={e => setForm({ ...form, species: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7, fontWeight: 600 }}>Масса (кг)</div>
                <input placeholder="0.0" type="number" value={form.weight}
                  onChange={e => setForm({ ...form, weight: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              {error && <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '8px 12px', color: '#FF5050', fontSize: 12, marginBottom: 14 }}>⚠ {error}</div>}
              <button onClick={createBatch} disabled={isGenerating} style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, rgba(0,212,170,0.13), rgba(0,120,255,0.09))',
                border: '1px solid rgba(0,212,170,0.38)', borderRadius: 10,
                color: '#00D4AA', fontSize: 13, fontWeight: 700, cursor: isGenerating ? 'not-allowed' : 'pointer',
                letterSpacing: 1.5, textTransform: 'uppercase', opacity: isGenerating ? 0.6 : 1
              }}>
                {isGenerating ? 'Генерация...' : 'Выдать паспорт улова'}
              </button>
            </div>

            {/* Loading */}
            {isGenerating && (
              <div style={{
                background: 'linear-gradient(160deg, #0B1F38 0%, #071525 100%)',
                border: '1px solid rgba(0,212,170,0.3)',
                borderRadius: 20, overflow: 'hidden', marginBottom: 24,
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '40px 20px', gap: 20, position: 'relative',
              }}>
                <div style={{ background: 'linear-gradient(90deg, #00D4AA, #0078FF)', height: 3, width: '100%', position: 'absolute', top: 0, left: 0 }} />
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  border: '3px solid rgba(0,212,170,0.15)',
                  borderTop: '3px solid #00D4AA',
                  animation: 'spin 0.9s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 6 }}>Формирование паспорта</div>
                  <div style={{ fontSize: 11, color: 'rgba(0,212,170,0.6)', textAlign: 'center', letterSpacing: 1.5, textTransform: 'uppercase' }}>Blockchain · Запись данных...</div>
                </div>
              </div>
            )}

            {/* QR Document */}
            {batchCode && currentBatch && (
              <div style={{
                background: 'linear-gradient(160deg, #0B1F38 0%, #071525 100%)',
                border: '1px solid rgba(0,212,170,0.3)',
                borderRadius: 20, overflow: 'hidden', marginBottom: 24,
                boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,212,170,0.05)',
              }}>
                <div style={{ background: 'linear-gradient(90deg, #00D4AA, #0078FF)', height: 3 }} />
                <div style={{ padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(0,212,170,0.5)', textTransform: 'uppercase', fontWeight: 700 }}>CaspiNet · Мангистау</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginTop: 3, letterSpacing: 0.3 }}>ПАСПОРТ УЛОВА</div>
                    </div>
                    <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 6, padding: '4px 10px', fontSize: 9, fontWeight: 700, color: '#00D4AA', letterSpacing: 1.5 }}>
                      ДЕЙСТВИТЕЛЕН
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {[
                      { label: 'Вид рыбы', value: currentBatch.species },
                      { label: 'Масса', value: `${currentBatch.weight} кг` },
                      { label: 'Рыбак', value: currentBatch.fisher_name },
                      { label: 'Дата', value: formatDate(currentBatch.caught_at) },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5, fontWeight: 700 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* License row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: 16 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Лицензия рыбака</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4AA' }} />
                      <span style={{ color: '#00D4AA', fontSize: 12, fontWeight: 600 }}>№ MO-2025-FISH-0142 · Активна</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '22px 20px' }}>
                    <div style={{ background: '#ffffff', padding: 14, borderRadius: 10, boxShadow: '0 0 30px rgba(0,212,170,0.2)' }}>
                      <QRCode value={batchCode} size={148} />
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#00D4AA', letterSpacing: 2.5, marginTop: 14 }}>
                      {batchCode}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 6, letterSpacing: 2, textTransform: 'uppercase' }}>
                      Предъявить следующему звену
                    </div>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', letterSpacing: 1, textTransform: 'uppercase' }}>Мангистауская обл. · РК</div>
                    <div style={{ fontSize: 8, color: 'rgba(0,212,170,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Blockchain verified</div>
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            <div style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>
              ▸ Реестр документов
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 20px', color: 'rgba(255,255,255,0.12)', fontSize: 13 }}>
                Документов не зарегистрировано
              </div>
            ) : history.map((b) => {
              const s = STATUS_MAP[b.status] || STATUS_MAP.caught;
              return (
                <div key={b.batch_code} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{b.species} · {b.weight} кг</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 3, fontFamily: 'monospace', letterSpacing: 0.5 }}>{b.batch_code}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 2 }}>{formatDate(b.caught_at)}</div>
                  </div>
                  <div style={{ fontSize: 8, padding: '5px 10px', borderRadius: 6, background: `${s.color}10`, color: s.color, border: `1px solid ${s.color}30`, fontWeight: 700, letterSpacing: 1.5 }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* OTHER ROLES VIEW */}
      {role !== 'fisher' && (
        <>
          <div style={{
            background: 'linear-gradient(135deg, #0A1628, #0D2040)',
            borderBottom: `1px solid rgba(${accentRgb},0.2)`,
            padding: '20px 20px 16px',
          }}>
            <div style={{ fontSize: 10, color: `rgba(${accentRgb},0.7)`, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>
              Республика Казахстан · CaspiNet
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
              {role === 'inspector' ? 'Аудит паспортов' : role === 'restaurant' ? 'Проверка паспорта' : role === 'driver' ? 'Транспортировка' : 'Приёмка склада'}
            </div>
          </div>

          <div style={{ padding: 20 }}>
            {/* Lookup form */}
            <div style={{ background: `rgba(${accentRgb},0.04)`, border: `1px solid rgba(${accentRgb},0.18)`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: `rgba(${accentRgb},0.6)`, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
                ▸ Идентификатор документа
              </div>
              <input placeholder="SC-XXXXXXXXXXXXXXX" value={scanCode}
                onChange={e => setScanCode(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', marginBottom: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: '#fff', fontSize: 14, boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: 1, outline: 'none' }} />
              {error && <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '8px 12px', color: '#FF5050', fontSize: 12, marginBottom: 12 }}>⚠ {error}</div>}
              <button onClick={lookupBatch} style={{
                width: '100%', padding: '14px',
                background: `rgba(${accentRgb},0.1)`,
                border: `1px solid rgba(${accentRgb},0.32)`,
                borderRadius: 10, color: accentColor,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 1.5, textTransform: 'uppercase'
              }}>
                Запросить документ
              </button>
            </div>

            {/* Result card */}
            {chainData && chainData.batch && (
              <div style={{ background: 'linear-gradient(160deg, #0B1F38, #071525)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
                <div style={{ background: `linear-gradient(90deg, ${accentColor}, #00D4AA)`, height: 3 }} />
                <div style={{ padding: 22 }}>

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 2.5, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Паспорт улова</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 3 }}>{chainData.batch.species}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>Масса</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#00D4AA' }}>{chainData.batch.weight} кг</div>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {[
                      { label: 'Рыбак', value: chainData.batch.fisher_name },
                      { label: 'Дата вылова', value: formatDate(chainData.batch.caught_at) },
                      { label: 'Код партии', value: chainData.batch.batch_code },
                      { label: 'Статус', value: STATUS_MAP[chainData.batch.status]?.label || 'ВЫЛОВЛЕН' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5, fontWeight: 700 }}>{label}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: label === 'Код партии' ? 'monospace' : 'inherit' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chain */}
                  <div style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>▸ Цепочка поставки</div>
                  {chainData.chain.map((step, i) => {
                    const isLast = i === chainData.chain.length - 1;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                        {/* Vertical line */}
                        {!isLast && (
                          <div style={{ position: 'absolute', left: 16, top: 46, width: 2, height: 'calc(100% - 10px)', background: 'rgba(0,212,170,0.1)', borderRadius: 2 }} />
                        )}
                        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                          {ROLE_ICONS[step.actor_role] || '👤'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{step.actor_name}</div>
                              <div style={{ fontSize: 9, color: accentColor, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2, fontWeight: 600 }}>{ROLE_LABELS[step.actor_role]}</div>
                            </div>
                            <div style={{ fontSize: 8, padding: '3px 8px', borderRadius: 5, background: 'rgba(0,212,170,0.07)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)', fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>
                              ✓ Подтверждено
                            </div>
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 4 }}>{formatDate(step.timestamp)} · {step.note}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Sign button */}
                  {!alreadySigned ? (
                    <button onClick={() => {
                      const notes = { restaurant: 'Принято рестораном', inspector: 'Проверено инспектором', driver: 'Принято в транспорт', company: 'Принято на склад' };
                      signBatch(chainData.batch.batch_code, notes[role] || 'Подтверждено');
                    }} style={{
                      width: '100%', padding: '14px', marginTop: 20,
                      background: `rgba(${accentRgb},0.1)`,
                      border: `1px solid rgba(${accentRgb},0.32)`,
                      borderRadius: 10, color: accentColor,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 1.5, textTransform: 'uppercase'
                    }}>
                      {role === 'inspector' ? '✓ Подтвердить проверку' : role === 'restaurant' ? '✓ Подтвердить приёмку' : role === 'driver' ? '✓ Принять в транспорт' : '✓ Принять на склад'}
                    </button>
                  ) : (
                    <div style={{ marginTop: 20, padding: '14px', background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, textAlign: 'center', color: '#00D4AA', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
                      ✓ Вы уже подписали этот документ
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}