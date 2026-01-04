const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { query, get, insert, update, remove } = require('../config/db-utils');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, parent } = req.query;
    let sql = 'SELECT * FROM categories WHERE 1=1';
    let params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (parent) {
      sql += ' AND parent = ?';
      params.push(parent);
    } else if (parent === 'null' || parent === 'undefined') {
      sql += ' AND parent IS NULL';
    }

    sql += ' ORDER BY createdAt ASC';
    const categories = await query(sql, params);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  const { name, type, parent, description } = req.body;

  try {
    // 检查分类是否已存在
    let existsSql = 'SELECT * FROM categories WHERE name = ?';
    let existsParams = [name];

    if (parent) {
      existsSql += ' AND parent = ?';
      existsParams.push(parent);
    } else {
      existsSql += ' AND parent IS NULL';
    }

    const categoryExists = await get(existsSql, existsParams);
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // 创建新分类
    const { id } = await insert(
      'INSERT INTO categories (name, type, parent, description) VALUES (?, ?, ?, ?)',
      [name, type, parent || null, description]
    );

    // 获取创建的分类
    const category = await get('SELECT * FROM categories WHERE id = ?', [id]);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  const { name, type, parent, description } = req.body;

  try {
    // 检查分类是否存在
    let category = await get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // 构建更新SQL
    let updateSql = 'UPDATE categories SET ';
    let updateParams = [];
    let updates = [];

    if (name) {
      updates.push('name = ?');
      updateParams.push(name);
    }
    if (type) {
      updates.push('type = ?');
      updateParams.push(type);
    }
    if (parent !== undefined) {
      updates.push('parent = ?');
      updateParams.push(parent || null);
    }
    if (description) {
      updates.push('description = ?');
      updateParams.push(description);
    }

    if (updates.length === 0) {
      return res.json(category);
    }

    updateSql += updates.join(', ') + ' WHERE id = ?';
    updateParams.push(req.params.id);

    // 执行更新
    await update(updateSql, updateParams);

    // 获取更新后的分类
    category = await get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    // 检查分类是否存在
    const category = await get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // 删除分类
    await remove('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/categories/:id/children
// @desc    Get child categories
// @access  Public
router.get('/:id/children', async (req, res) => {
  try {
    const categories = await query(
      'SELECT * FROM categories WHERE parent = ? ORDER BY createdAt ASC',
      [req.params.id]
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
