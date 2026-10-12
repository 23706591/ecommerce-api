const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Tạo đơn hàng
router.post('/', authenticate, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cần items là mảng [{pid, qty}]' });
  }
  const pids = items.map((i) => i.pid);
  const valid = items.every(
    (i) => Number.isInteger(i.pid) && Number.isInteger(i.qty) && i.qty > 0
  );
  if (!valid) return res.status(400).json({ error: 'pid và qty phải là số nguyên, qty > 0' });
  if (new Set(pids).size !== pids.length) {
    return res.status(400).json({ error: 'Mỗi pid chỉ xuất hiện một lần' });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const details = [];
      for (const it of items) {
        const product = await tx.product.findUnique({ where: { pid: it.pid } });
        if (!product) throw new HttpError(404, `Không có sản phẩm pid=${it.pid}`);

        // Trừ kho chỉ khi còn đủ hàng (an toàn khi nhiều người đặt cùng lúc)
        const updated = await tx.product.updateMany({
          where: { pid: it.pid, quantity: { gte: it.qty } },
          data: { quantity: { decrement: it.qty } },
        });
        if (updated.count === 0) {
          throw new HttpError(409, `Không đủ hàng cho pid=${it.pid}`);
        }
        details.push({ pid: it.pid, qty: it.qty, unit_price: product.price });
      }
      return tx.order.create({
        data: { uid: req.user.uid, details: { create: details } },
        include: { details: true },
      });
    });
    res.status(201).json(order);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Danh sách đơn: người thường thấy đơn của mình, ADMIN thấy tất cả
router.get('/', authenticate, async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { uid: req.user.uid };
  const orders = await prisma.order.findMany({
    where,
    include: { details: true },
    orderBy: { oid: 'desc' },
  });
  res.json(orders);
});

// Chi tiết một đơn
router.get('/:oid', authenticate, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { oid: Number(req.params.oid) },
    include: { details: true, shipments: true },
  });
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
  if (req.user.role !== 'ADMIN' && order.uid !== req.user.uid) {
    return res.status(403).json({ error: 'Không có quyền xem đơn này' });
  }
  res.json(order);
});

module.exports = router;