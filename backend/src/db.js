const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS catches (
      id SERIAL PRIMARY KEY,
      fish_type VARCHAR(50) NOT NULL,
      fish_icon VARCHAR(10) DEFAULT '🐟',
      weight_kg NUMERIC(8,2) NOT NULL,
      boat_number VARCHAR(20) NOT NULL,
      latitude NUMERIC(10,6),
      longitude NUMERIC(10,6),
      caught_at TIMESTAMP DEFAULT NOW(),
      synced_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quotas (
      id SERIAL PRIMARY KEY,
      fish_type VARCHAR(50) UNIQUE NOT NULL,
      used_kg NUMERIC(10,2) DEFAULT 0,
      total_kg NUMERIC(10,2) NOT NULL,
      year INT DEFAULT EXTRACT(YEAR FROM NOW())
    );

    INSERT INTO quotas (fish_type, used_kg, total_kg) VALUES
      ('Осётр', 840, 1000),
      ('Сазан', 3200, 8000),
      ('Вобла', 12400, 20000)
    ON CONFLICT (fish_type) DO NOTHING;
  `);
  console.log('✅ Database initialized');
}

module.exports = { pool, initDB };
