import Dexie from 'dexie';

const db = new Dexie('SmartCatchDB');

db.version(1).stores({
  catches: '++id, fish, boat, synced, caught_at',
});

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

export default db;
