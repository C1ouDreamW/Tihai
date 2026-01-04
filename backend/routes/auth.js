const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { query, get, insert, update } = require('../config/db-utils');

// 生成JWT令牌
const generateToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 检查用户是否已存在
    const userExists = await get(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 哈希密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建新用户
    const { id } = await insert(
      'INSERT INTO users (username, email, password, isAdmin, isGuest) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, 0, 0]
    );

    res.status(201).json({
      _id: id,
      username,
      email,
      isAdmin: 0,
      token: generateToken(id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 检查用户是否存在
    const user = await get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 检查密码是否匹配
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 更新最后登录时间
    await update(
      'UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/guest
// @desc    Create guest user
// @access  Public
router.post('/guest', async (req, res) => {
  try {
    // 生成唯一的guestId
    const guestId = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const tempPassword = `temp_${Date.now()}`;

    // 哈希密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // 创建游客用户
    const { id } = await insert(
      'INSERT INTO users (username, email, password, isGuest, isAdmin) VALUES (?, ?, ?, ?, ?)',
      [guestId, `${guestId}@example.com`, hashedPassword, 1, 0]
    );

    res.status(201).json({
      _id: id,
      username: guestId,
      email: `${guestId}@example.com`,
      isGuest: 1,
      guestId,
      token: generateToken(id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
