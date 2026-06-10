import Dexie from 'dexie';

const db = new Dexie('SmartCatchDB');

db.version(3).stores({
  catches: '++id, fish, boat, synced, caught_at, passportId, aiVerified',
  passports: '++id, passportId, fish, boat, caught_at, createdAt, inspectorApproved',
});

// ─── Catches ────────────────────────────────────────────────────

// Сохранить улов локально
export async function saveCatchLocally(catchData) {
  return await db.catches.add({
    ...catchData,
    synced: false,
    caught_at: new Date().toISOString(),
  });
}

// Получить все несинхронизированные уловы
export async function getPendingCatches() {
  return await db.catches.where('synced').equals(0).toArray();
}

// Отметить как синхронизированные
export async function markSynced(ids) {
  await db.catches.where('id').anyOf(ids).modify({ synced: 1 });
}

// Все уловы для отображения
export async function getAllCatches() {
  return await db.catches.orderBy('caught_at').reverse().limit(50).toArray();
}

// Обновить passportId у улова
export async function updateCatchPassportId(catchId, passportId) {
  await db.catches.where('id').equals(catchId).modify({ passportId });
}

// ─── Passports ──────────────────────────────────────────────────

// Сохранить паспорт локально
export async function savePassportLocally(passport) {
  const existing = await db.passports
    .where('passportId')
    .equals(passport.passportId)
    .first();
  if (existing) {
    await db.passports.where('passportId').equals(passport.passportId).modify(passport);
    return existing.id;
  }
  return await db.passports.add(passport);
}

// Получить паспорт по ID
export async function getPassportLocally(passportId) {
  return await db.passports.where('passportId').equals(passportId).first();
}

// Все паспорты
export async function getAllPassports() {
  return await db.passports.orderBy('createdAt').reverse().limit(50).toArray();
}

export default db;
