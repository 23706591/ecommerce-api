const express = require('express');
const prisma = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Xem danh sách (công khai)
router.get('/', async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: { pid: 'asc' } });
  res.json(products);
});

// Xem một sản phẩm (công khai)
router.get('/:pid', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { pid: Number(req.params.pid) } });
  if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
  res.json(product);
});

// Tạo (ADMIN)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { pname, price, quantity } = req.body;
  if (!pname || price == null || price < 0 || (quantity != null && quantity < 0)) {
    return res.status(400).json({ error: 'Cần pname, price >= 0, quantity >= 0' });
  }
  const product = await prisma.product.create({
    data: { pname, price, quantity: quantity ?? 0 },
  });
  res.status(201).json(product);
});

// Sửa (ADMIN)
router.put('/:pid', authenticate, requireAdmin, async (req, res) => {
  const { pname, price, quantity } = req.body;
  try {
    const product = await prisma.product.update({
      where: { pid: Number(req.params.pid) },
      data: { pname, price, quantity },
    });
    res.json(product);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }
});

// Xóa (ADMIN)
router.delete('/:pid', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.product.delete({ where: { pid: Number(req.params.pid) } });
    res.json({ message: 'Đã xóa', pid: Number(req.params.pid) });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    if (err.code === 'P2003') return res.status(409).json({ error: 'Sản phẩm đã có trong đơn hàng, không thể xóa' });
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;