const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { query, get, insert, update, remove } = require('../config/db-utils');

// @route   GET /api/progress
// @desc    Get user progress
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { category } = req.query;
    let sql = `SELECT p.*, c.name as category_name, c.type as category_type 
              FROM progress p 
              LEFT JOIN categories c ON p.categoryId = c.id 
              WHERE p.userId = ?`;
    let params = [req.user.id];

    if (category) {
      sql += ' AND p.categoryId = ?';
      params.push(category);
    }

    // 按更新时间倒序排序
    sql += ' ORDER BY p.updatedAt DESC';

    let progress = await query(sql, params);

    // 转换为前端期望的格式
    progress = progress.map(p => ({
      ...p,
      _id: p.id,
      userId: p.userId,
      category: {
        id: p.categoryId,
        name: p.category_name,
        type: p.category_type
      },
      completedQuestions: p.completedQuestions,
      totalQuestions: p.totalQuestions
    }));

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/progress/:categoryId
// @desc    Get user progress by category
// @access  Private
router.get('/:categoryId', protect, async (req, res) => {
  try {
    const progress = await get(
      `SELECT p.*, c.name as category_name, c.type as category_type 
       FROM progress p 
       LEFT JOIN categories c ON p.categoryId = c.id 
       WHERE p.userId = ? AND p.categoryId = ?`,
      [req.user.id, req.params.categoryId]
    );

    if (!progress) {
      // 如果没有进度记录，返回初始进度
      return res.json({
        _id: null,
        userId: req.user.id,
        categoryId: req.params.categoryId,
        category: {
          id: req.params.categoryId,
          name: '',
          type: ''
        },
        completedQuestions: 0,
        totalQuestions: 0,
        lastStudiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 转换为前端期望的格式
    const enhancedProgress = {
      ...progress,
      _id: progress.id,
      category: {
        id: progress.categoryId,
        name: progress.category_name,
        type: progress.category_type
      }
    };

    res.json(enhancedProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/progress/:categoryId
// @desc    Update user progress
// @access  Private
router.put('/:categoryId', protect, async (req, res) => {
  const { totalQuestions, answeredQuestions, correctAnswers } = req.body;

  try {
    // 检查进度记录是否存在
    const existingProgress = await get(
      'SELECT * FROM progress WHERE userId = ? AND categoryId = ?',
      [req.user.id, req.params.categoryId]
    );

    if (existingProgress) {
      // 更新现有进度
      let updateSql = 'UPDATE progress SET updatedAt = CURRENT_TIMESTAMP';
      let updateParams = [];

      if (totalQuestions !== undefined) {
        updateSql += ', totalQuestions = ?';
        updateParams.push(totalQuestions);
      }
      if (answeredQuestions !== undefined) {
        updateSql += ', completedQuestions = ?';
        updateParams.push(answeredQuestions);
      }

      updateSql += ' WHERE id = ?';
      updateParams.push(existingProgress.id);

      await update(updateSql, updateParams);

      // 获取更新后的进度
      const progress = await get('SELECT * FROM progress WHERE id = ?', [existingProgress.id]);
      res.json({
        ...progress,
        _id: progress.id
      });
    } else {
      // 创建新进度记录
      const { id } = await insert(
        'INSERT INTO progress (userId, categoryId, completedQuestions, totalQuestions) VALUES (?, ?, ?, ?)',
        [
          req.user.id,
          req.params.categoryId,
          answeredQuestions || 0,
          totalQuestions || 0
        ]
      );

      // 获取创建的进度
      const progress = await get('SELECT * FROM progress WHERE id = ?', [id]);
      res.json({
        ...progress,
        _id: progress.id
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/progress/:categoryId
// @desc    Delete user progress
// @access  Private
router.delete('/:categoryId', protect, async (req, res) => {
  try {
    // 检查进度记录是否存在
    const progress = await get(
      'SELECT * FROM progress WHERE userId = ? AND categoryId = ?',
      [req.user.id, req.params.categoryId]
    );

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    // 删除进度记录
    await remove('DELETE FROM progress WHERE id = ?', [progress.id]);
    res.json({ message: 'Progress deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
