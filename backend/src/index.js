require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const catchesRouter = require('./routes/catches');
const quotasRouter = require('./routes/quotas');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());

app.use('/api/catches', catchesRouter);
app.use('/api/quotas', quotasRouter);
app.use('/api/orders', ordersRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🐟 Smart Catch API running on port ${PORT}`));
});
