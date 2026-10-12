const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Đăng ký
router.post('/register', async (req, res) => {
  const { username, fullname, password } = req.body;
  if (!username || !fullname || !password) {
    return res.status(400).json({ error: 'Cần username, fullname, password' });
  }
  try {
    const role = await prisma.role.findUnique({ where: { rolename: 'USER' } });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, fullname, password: hashed, roleid: role.roleid, mid: 1 },
      select: { uid: true, username: true, fullname: true },
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'username đã tồn tại' });
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { username: username || '' },
    include: { role: true },
  });
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ error: 'Sai username hoặc password' });
  }
  const token = jwt.sign(
    { uid: user.uid, username: user.username, role: user.role.rolename },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
  res.json({ token });
});

// Thông tin người dùng hiện tại (route được bảo vệ)
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { uid: req.user.uid },
    select: { uid: true, username: true, fullname: true, role: true, membership: true },
  });
  res.json(user);
});

module.exports = router;