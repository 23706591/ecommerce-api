const express = require('express');
const prisma = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const STATUSES = ['PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

// Tạo shipment cho một đơn (ADMIN)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { oid, status } = req.body;
  if (!Number.isInteger(oid)) return res.status(400).json({ error: 'Cần oid là số nguyên' });
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status phải là một trong ${STATUSES.join(', ')}` });
  }
  try {
    const shipment = await prisma.shipment.create({
      data: { oid, status: status || 'PENDING' },
    });
    res.status(201).json(shipment);
  } catch (err) {
    if (err.code === 'P2003') return res.status(404).json({ error: 'Không có đơn hàng này' });
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Cập nhật trạng thái (ADMIN)
router.put('/:shipid', authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `status phải là một trong ${STATUSES.join(', ')}` });
  }
  try {
    const shipment = await prisma.shipment.update({
      where: { shipid: Number(req.params.shipid) },
      data: { status },
    });
    res.json(shipment);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy shipment' });
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Xem shipment của một đơn (chủ đơn hoặc ADMIN)
router.get('/order/:oid', authenticate, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { oid: Number(req.params.oid) } });
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
  if (req.user.role !== 'ADMIN' && order.uid !== req.user.uid) {
    return res.status(403).json({ error: 'Không có quyền xem đơn này' });
  }
  const shipments = await prisma.shipment.findMany({ where: { oid: order.oid } });
  res.json(shipments);
});

module.exports = router;