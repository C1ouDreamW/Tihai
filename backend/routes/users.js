const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { query, get, update, insert, remove } = require('../config/db-utils');
const bcrypt = require('bcrypt');

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

// @route   POST /api/users
// @desc    Create a new user (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  const { username, email, password, isAdmin } = req.body;

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
      [username, email, hashedPassword, isAdmin ? 1 : 0, 0]
    );

    res.status(201).json({
      _id: id,
      username,
      email,
      isAdmin: isAdmin ? 1 : 0,
      isGuest: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  const { username, email, password, isAdmin } = req.body;
  const userId = req.params.id;

  try {
    // 检查用户是否存在
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
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
    if (password) {
      // 哈希新密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updates.push('password = ?');
      updateParams.push(hashedPassword);
    }
    if (isAdmin !== undefined) {
      updates.push('isAdmin = ?');
      updateParams.push(isAdmin ? 1 : 0);
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
    updateParams.push(userId);

    // 执行更新
    await update(updateSql, updateParams);

    // 获取更新后的用户
    const updatedUser = await get('SELECT id, username, email, isAdmin, isGuest, createdAt, lastLogin FROM users WHERE id = ?', [userId]);

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

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  const userId = req.params.id;

  try {
    // 检查用户是否存在
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 执行删除
    await remove('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
