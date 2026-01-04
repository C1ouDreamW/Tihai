const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { query, get, update } = require('../config/db-utils');

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await get('SELECT id, username, email, isAdmin, isGuest, createdAt, lastLogin FROM users WHERE id = ?', [req.user.id]);
    if (user) {
      // 转换为前端期望的格式
      const userWithoutPassword = {
        ...user,
        _id: user.id,
        isAdmin: Boolean(user.isAdmin),
        isGuest: Boolean(user.isGuest)
      };
      delete userWithoutPassword.id;
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/users/me
// @desc    Update user profile
// @access  Private
router.put('/me', protect, async (req, res) => {
  const { username, email } = req.body;

  try {
    // 检查用户是否存在
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 构建更新SQL
    let updateSql = 'UPDATE users SET ';
    let updateParams = [];
    let updates = [];

    if (username) {
      updates.push('username = ?');
      updateParams.push(username);
    }
    if (email) {
      updates.push('email = ?');
      updateParams.push(email);
    }

    if (updates.length === 0) {
      // 转换为前端期望的格式
      const userWithoutPassword = {
        ...user,
        _id: user.id,
        isAdmin: Boolean(user.isAdmin),
        isGuest: Boolean(user.isGuest)
      };
      delete userWithoutPassword.id;
      delete userWithoutPassword.password;
      return res.json(userWithoutPassword);
    }

    updateSql += updates.join(', ') + ' WHERE id = ?';
    updateParams.push(req.user.id);

    // 执行更新
    await update(updateSql, updateParams);

    // 获取更新后的用户
    const updatedUser = await get('SELECT id, username, email, isAdmin, isGuest, createdAt, lastLogin FROM users WHERE id = ?', [req.user.id]);

    // 转换为前端期望的格式
    const userWithoutPassword = {
      ...updatedUser,
      _id: updatedUser.id,
      isAdmin: Boolean(updatedUser.isAdmin),
      isGuest: Boolean(updatedUser.isGuest)
    };
    delete userWithoutPassword.id;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    let users = await query('SELECT id, username, email, isAdmin, isGuest, createdAt, lastLogin FROM users');
    // 转换为前端期望的格式
    users = users.map(user => ({
      ...user,
      _id: user.id,
      isAdmin: Boolean(user.isAdmin),
      isGuest: Boolean(user.isGuest)
    })).map(user => {
      delete user.id;
      return user;
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
