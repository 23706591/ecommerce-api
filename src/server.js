require('dotenv').config();
const express = require('express');
const prisma = require('./db');

const app = express();
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

const shipmentRoutes = require('./routes/shipments');
app.use('/api/shipments', shipmentRoutes);

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'up' });
  } catch (err) {
    res.status(503).json({ status: 'unavailable', database: 'down' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API chạy tại http://localhost:${PORT}`));