const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/quotas — текущие квоты для дашборда
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT *, ROUND(used_kg / total_kg * 100, 1) AS percent FROM quotas ORDER BY fish_type'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
