const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/catches — все уловы (для рынка и инспектора)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM catches ORDER BY caught_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/catches — синхронизация пачки уловов с телефона
router.post('/sync', async (req, res) => {
  const { catches } = req.body; // массив уловов из IndexedDB
  if (!Array.isArray(catches) || catches.length === 0) {
    return res.status(400).json({ error: 'catches array required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inserted = [];
    for (const c of catches) {
      const r = await client.query(
        `INSERT INTO catches (fish_type, fish_icon, weight_kg, boat_number, latitude, longitude, caught_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [c.fish, c.icon || '🐟', c.weight, c.boat, c.lat, c.lng, c.time ? new Date() : new Date()]
      );
      inserted.push(r.rows[0]);

      // Обновить квоту
      await client.query(
        `UPDATE quotas SET used_kg = used_kg + $1 WHERE fish_type = $2`,
        [c.weight, c.fish]
      );
    }

    await client.query('COMMIT');
    res.json({ synced: inserted.length, catches: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
