import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PRICES = {
  'Осётр': 2800, 'Белуга': 8500, 'Сазан': 450, 'Судак': 1200,
  'Вобла': 180, 'Лещ': 320, 'Сом': 680, 'Щука': 950,
  'Карп': 380, 'Окунь': 520, 'Толстолобик': 290, 'Жерех': 740,
};

const BADGES = {
  fresh:     { label: '⚡ Свежий улов',       bg: 'rgba(0,212,170,0.1)',  color: '#00D4AA', border: 'rgba(0,212,170,0.25)' },
  certified: { label: '✓ Квота подтверждена', bg: 'rgba(0,120,255,0.1)',  color: '#4DA6FF', border: 'rgba(0,120,255,0.25)' },
  eco:       { label: '🌿 Эко-улов',          bg: 'rgba(80,200,80,0.1)',  color: '#50C850', border: 'rgba(80,200,80,0.25)' },
  premium:   { label: '★ Премиум',            bg: 'rgba(255,200,0,0.1)',  color: '#FFC800', border: 'rgba(255,200,0,0.25)' },
  bulk:      { label: '📦 Оптом',             bg: 'rgba(255,149,0,0.1)',  color: '#FF9500', border: 'rgba(255,149,0,0.25)' },
};

const FISH_EMOJI = {
  'Осётр': '🐟', 'Белуга': '🐳', 'Сазан': '🐠', 'Судак': '🐡',
  'Вобла': '🐟', 'Лещ': '🐠', 'Сом': '🐋', 'Щука': '🐟',
  'Карп': '🐠', 'Окунь': '🐡', 'Толстолобик': '🐟', 'Жерех': '🐠',
};

const ALL_LISTINGS = [
  { id: 1,  fish: 'Осётр',       weight: 42,  boat: 'МЧ-2847', fisher: 'Ержан Касымов',    region: 'Актау',       badges: ['fresh','certified','premium'], rating: 4.9 },
  { id: 2,  fish: 'Белуга',      weight: 18,  boat: 'МЧ-1134', fisher: 'Болат Мухамедов',  region: 'Мунайлы',    badges: ['certified','premium'],        rating: 5.0 },
  { id: 3,  fish: 'Сазан',       weight: 95,  boat: 'МЧ-3301', fisher: 'Серик Дюсенов',    region: 'Форт-Шевч.', badges: ['bulk','certified'],           rating: 4.7 },
  { id: 4,  fish: 'Осётр',       weight: 61,  boat: 'МЧ-0892', fisher: 'Асхат Нурланов',   region: 'Актау',       badges: ['fresh','eco','certified'],    rating: 4.8 },
  { id: 5,  fish: 'Судак',       weight: 33,  boat: 'МЧ-4417', fisher: 'Дамир Тлеубеков',  region: 'Жанаозен',   badges: ['fresh'],                      rating: 4.6 },
  { id: 6,  fish: 'Сом',         weight: 120, boat: 'МЧ-5512', fisher: 'Руслан Ахметов',   region: 'Мунайлы',    badges: ['bulk','certified'],           rating: 4.5 },
  { id: 7,  fish: 'Вобла',       weight: 200, boat: 'МЧ-2201', fisher: 'Нурлан Сейткали',  region: 'Актау',       badges: ['bulk'],                       rating: 4.3 },
  { id: 8,  fish: 'Щука',        weight: 28,  boat: 'МЧ-6634', fisher: 'Марат Жунусов',    region: 'Каламкас',   badges: ['fresh','eco'],                rating: 4.8 },
  { id: 9,  fish: 'Лещ',         weight: 75,  boat: 'МЧ-1890', fisher: 'Айдар Бекенов',    region: 'Форт-Шевч.', badges: ['certified','bulk'],           rating: 4.4 },
  { id: 10, fish: 'Карп',        weight: 55,  boat: 'МЧ-3378', fisher: 'Сейткали Омаров',  region: 'Актау',       badges: ['fresh','certified'],          rating: 4.7 },
  { id: 11, fish: 'Белуга',      weight: 9,   boat: 'МЧ-7721', fisher: 'Ербол Жаксыбеков', region: 'Жанаозен',   badges: ['premium','eco','certified'],  rating: 5.0 },
  { id: 12, fish: 'Толстолобик', weight: 140, boat: 'МЧ-4405', fisher: 'Кайрат Абенов',    region: 'Мунайлы',    badges: ['bulk','certified'],           rating: 4.2 },
  { id: 13, fish: 'Судак',       weight: 47,  boat: 'МЧ-9913', fisher: 'Тимур Сагинтаев',  region: 'Каламкас',   badges: ['fresh','premium'],            rating: 4.9 },
  { id: 14, fish: 'Окунь',       weight: 31,  boat: 'МЧ-2256', fisher: 'Алмас Кенжебеков', region: 'Актау',       badges: ['fresh','eco'],                rating: 4.6 },
  { id: 15, fish: 'Жерех',       weight: 22,  boat: 'МЧ-8801', fisher: 'Бауыржан Елеусов', region: 'Форт-Шевч.', badges: ['certified'],                  rating: 4.5 },
  { id: 16, fish: 'Сазан',       weight: 180, boat: 'МЧ-6123', fisher: 'Досжан Калиев',    region: 'Мунайлы',    badges: ['bulk'],                       rating: 4.1 },
  { id: 17, fish: 'Осётр',       weight: 15,  boat: 'МЧ-3344', fisher: 'Жандос Мусин',     region: 'Актау',       badges: ['fresh','premium','certified'], rating: 4.9 },
  { id: 18, fish: 'Сом',         weight: 85,  boat: 'МЧ-5567', fisher: 'Нурдаулет Ахат',   region: 'Жанаозен',   badges: ['certified','bulk'],           rating: 4.4 },
];

const FILTERS = ['Все', 'Осётр', 'Белуга', 'Судак', 'Сазан', 'Сом', 'Вобла'];
const SORT_OPTIONS = [
  { key: 'fresh',  label: 'Свежие' },
  { key: 'price_asc', label: 'Дешевле' },
  { key: 'price_desc', label: 'Дороже' },
  { key: 'weight', label: 'Вес ↓' },
];

export default function MarketView() {
  const [filter, setFilter] = useState('Все');
  const [sort, setSort] = useState('fresh');
  const [bought, setBought] = useState(new Set());
  const [expanded, setExpanded] = useState(null);

  let listings = filter === 'Все' ? ALL_LISTINGS : ALL_LISTINGS.filter(l => l.fish === filter);

  if (sort === 'price_asc')  listings = [...listings].sort((a, b) => (a.weight * PRICES[a.fish]) - (b.weight * PRICES[b.fish]));
  if (sort === 'price_desc') listings = [...listings].sort((a, b) => (b.weight * PRICES[b.fish]) - (a.weight * PRICES[a.fish]));
  if (sort === 'weight')     listings = [...listings].sort((a, b) => b.weight - a.weight);
  if (sort === 'fresh')      listings = [...listings].sort((a, b) => b.badges.includes('fresh') - a.badges.includes('fresh'));

  const handleBuy = (id) => {
    setBought(prev => new Set([...prev, id]));
  };

  return (
    <div style={{ background: '#050D1A', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628, #0D2040)',
        borderBottom: '1px solid rgba(0,212,170,0.15)',
        padding: '18px 16px 14px',
      }}>
        <div style={{ fontSize: 10, color: 'rgba(0,212,170,0.6)', letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>
          CaspiNet · Мангистау
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Рыбный рынок</div>
          <div style={{ fontSize: 11, color: 'rgba(0,212,170,0.7)', fontWeight: 600 }}>
            {listings.length} предложений
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
          {[
            { label: 'Онлайн рыбаков', value: '24' },
            { label: 'Сделок сегодня', value: '138' },
            { label: 'Тонн в продаже', value: '4.2 т' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.12)',
              borderRadius: 10, padding: '8px 10px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#00D4AA' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        {/* Fish filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 10, scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <motion.button key={f} whileTap={{ scale: 0.92 }} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', cursor: 'pointer',
              fontSize: 12, fontWeight: filter === f ? 700 : 400,
              background: filter === f ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filter === f ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: filter === f ? '#00D4AA' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s',
            }}>{f}</motion.button>
          ))}
        </div>

        {/* Sort row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {SORT_OPTIONS.map(s => (
            <motion.button key={s.key} whileTap={{ scale: 0.92 }} onClick={() => setSort(s.key)} style={{
              padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: sort === s.key ? 700 : 400,
              background: sort === s.key ? 'rgba(0,120,255,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${sort === s.key ? 'rgba(0,120,255,0.35)' : 'rgba(255,255,255,0.06)'}`,
              color: sort === s.key ? '#4DA6FF' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.2s',
            }}>{s.label}</motion.button>
          ))}
        </div>

        {/* Listings */}
        <AnimatePresence>
          {listings.map((c, i) => {
            const pricePerKg = PRICES[c.fish] || 300;
            const total = c.weight * pricePerKg;
            const isBought = bought.has(c.id);
            const isExpanded = expanded === c.id;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  background: isBought
                    ? 'rgba(0,212,170,0.04)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isBought ? 'rgba(0,212,170,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 16, marginBottom: 10, overflow: 'hidden',
                  transition: 'all 0.25s',
                }}
              >
                {/* Main row */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                  style={{ display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                    background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  }}>
                    {FISH_EMOJI[c.fish] || '🐟'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{c.fish}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          {c.boat} · {c.fisher}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#00D4AA' }}>
                          {total.toLocaleString()} ₸
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                          {pricePerKg.toLocaleString()} ₸/кг
                        </div>
                      </div>
                    </div>

                    {/* Weight + region */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: '#fff',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, padding: '3px 9px'
                      }}>{c.weight} кг</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>📍 {c.region}</span>
                      <div style={{ display: 'flex', gap: 1 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize: 9, color: s <= Math.round(c.rating) ? '#FFC800' : 'rgba(255,255,255,0.1)' }}>★</span>
                        ))}
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 3 }}>{c.rating}</span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                      {c.badges.map(b => (
                        <span key={b} style={{
                          fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 600,
                          background: BADGES[b].bg, color: BADGES[b].color,
                          border: `1px solid ${BADGES[b].border}`,
                        }}>{BADGES[b].label}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        padding: '14px 16px',
                        background: 'rgba(0,0,0,0.2)',
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                          {[
                            { label: 'Рыбак', value: c.fisher },
                            { label: 'Лодка', value: c.boat },
                            { label: 'Регион', value: c.region },
                            { label: 'Цена за кг', value: `${pricePerKg.toLocaleString()} ₸` },
                            { label: 'Вес партии', value: `${c.weight} кг` },
                            { label: 'Итого', value: `${total.toLocaleString()} ₸` },
                          ].map(row => (
                            <div key={row.label} style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: 10, padding: '9px 12px'
                            }}>
                              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>{row.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{row.value}</div>
                            </div>
                          ))}
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleBuy(c.id)}
                          disabled={isBought}
                          style={{
                            width: '100%', padding: '13px',
                            background: isBought
                              ? 'rgba(0,212,170,0.08)'
                              : 'linear-gradient(135deg, #00D4AA, #0078FF)',
                            border: isBought ? '1px solid rgba(0,212,170,0.2)' : 'none',
                            borderRadius: 12, color: isBought ? '#00D4AA' : '#fff',
                            fontSize: 14, fontWeight: 700, cursor: isBought ? 'default' : 'pointer',
                            letterSpacing: 0.5,
                          }}
                        >
                          {isBought ? '✓ Заявка отправлена' : `Купить за ${total.toLocaleString()} ₸`}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}