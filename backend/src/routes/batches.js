const express = require('express');
const router = express.Router();
const db = require('../db');

// Fisher creates a batch
router.post('/create', async (req, res) => {
  const { fisher_id, fisher_name, species, weight, location_lat, location_lng } = req.body;
  const batch_code = 'SC-' + Date.now();
  try {
    await db.query(
      `INSERT INTO batches (batch_code, fisher_id, fisher_name, species, weight, location_lat, location_lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [batch_code, fisher_id, fisher_name, species, weight, location_lat, location_lng]
    );
    await db.query(
      `INSERT INTO batch_chain (batch_code, actor_role, actor_name, note)
       VALUES ($1,'fisher',$2,'Улов зафиксирован')`,
      [batch_code, fisher_name]
    );
    res.json({ batch_code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Anyone scans and signs a batch
router.post('/sign', async (req, res) => {
  const { batch_code, actor_role, actor_name, note } = req.body;
  try {
    await db.query(
      `INSERT INTO batch_chain (batch_code, actor_role, actor_name, note)
       VALUES ($1,$2,$3,$4)`,
      [batch_code, actor_role, actor_name, note]
    );
    await db.query(
      `UPDATE batches SET status=$1 WHERE batch_code=$2`,
      [actor_role, batch_code]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get full chain for a batch
router.get('/:batch_code', async (req, res) => {
  const { batch_code } = req.params;
  try {
    const batch = await db.query(`SELECT * FROM batches WHERE batch_code=$1`, [batch_code]);
    const chain = await db.query(`SELECT * FROM batch_chain WHERE batch_code=$1 ORDER BY timestamp ASC`, [batch_code]);
    res.json({ batch: batch.rows[0], chain: chain.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;