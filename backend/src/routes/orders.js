const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Ресторан делает заказ
router.post('/', async (req, res) => {
  const { catch_id, restaurant_name, restaurant_contact, quantity_kg, message } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO orders (catch_id, restaurant_name, restaurant_contact, quantity_kg, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [catch_id, restaurant_name, restaurant_contact, quantity_kg, message]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании заказа' });
  }
});

// Получить все заказы
router.get('/', async (req, res) => {
  const { catch_id } = req.query;
  try {
    let query = `SELECT o.*, c.fish_type, c.fisher_name FROM orders o
                 JOIN catches c ON o.catch_id = c.id`;
    const params = [];
    if (catch_id) {
      query += ' WHERE o.catch_id = $1';
      params.push(catch_id);
    }
    query += ' ORDER BY o.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении заказов' });
  }
});

module.exports = router;