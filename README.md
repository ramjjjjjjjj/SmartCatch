# 🐟 Smart Catch — Умный Улов

PWA-приложение для цифровизации рыбной отрасли Мангистауской области.

## Стек
- **Frontend**: React + Vite + Dexie.js (IndexedDB) + Leaflet + vite-plugin-pwa
- **Backend**: Node.js + Express + PostgreSQL
- **Deploy**: Vercel (фронт) + Railway/Render (бэкенд)

## Быстрый старт

### 1. Клонировать и установить зависимости

```bash
git clone <your-repo>

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Настроить переменные окружения

Backend — создать файл `backend/.env`:
```
DATABASE_URL=postgresql://user:pass@host:5432/smartcatch
PORT=3001
```

Frontend — создать файл `frontend/.env`:
```
VITE_API_URL=http://localhost:3001
```

### 3. Запустить локально

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

## Deploy

### Backend → Railway
1. Зайти на railway.app → New Project → Deploy from GitHub
2. Выбрать папку `/backend`
3. Добавить переменную `DATABASE_URL` (Railway сам создаёт PostgreSQL)
4. Скопировать URL вида `https://smart-catch-backend.up.railway.app`

### Frontend → Vercel
1. Зайти на vercel.com → New Project → Import GitHub repo
2. Root Directory: `frontend`
3. Добавить переменную `VITE_API_URL=https://smart-catch-backend.up.railway.app`
4. Deploy

## Структура

```
smart-catch/
├── backend/
│   ├── src/
│   │   ├── db.js          # PostgreSQL подключение
│   │   ├── routes/
│   │   │   ├── catches.js # API уловов
│   │   │   └── quotas.js  # API квот
│   │   └── index.js       # Express сервер
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── db/
    │   │   └── dexie.js   # Локальная IndexedDB
    │   ├── components/
    │   │   ├── FisherView.jsx
    │   │   ├── MarketView.jsx
    │   │   └── InspectorView.jsx
    │   ├── pages/
    │   │   └── App.jsx
    │   └── main.jsx
    ├── public/
    │   └── manifest.json  # PWA манифест
    ├── vite.config.js
    └── package.json
```
