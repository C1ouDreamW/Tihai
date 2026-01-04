const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { query, get, insert, update, remove } = require('../config/db-utils');

// @route   GET /api/records
// @desc    Get user answer records
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { question, isCorrect, isWrong, isMarked, isMastered, page = 1, limit = 10 } = req.query;
    let sql = `SELECT ar.*, q.content as question_content, q.type as question_type, q.difficulty as question_difficulty 
              FROM answerRecords ar 
              LEFT JOIN questions q ON ar.questionId = q.id 
              WHERE ar.userId = ?`;
    let countSql = `SELECT COUNT(*) as total FROM answerRecords WHERE userId = ?`;
    let params = [req.user.id];
    let countParams = [req.user.id];

    if (question) {
      sql += ' AND ar.questionId = ?';
      countSql += ' AND questionId = ?';
      params.push(question);
      countParams.push(question);
    }
    if (isCorrect !== undefined) {
      sql += ' AND ar.isCorrect = ?';
      countSql += ' AND isCorrect = ?';
      params.push(isCorrect === 'true' ? 1 : 0);
      countParams.push(isCorrect === 'true' ? 1 : 0);
    }

    // 按创建时间倒序排序
    sql += ' ORDER BY ar.createdAt DESC';

    // 分页处理
    const offset = (Number(page) - 1) * Number(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    // 获取总记录数
    const countResult = await get(countSql, countParams);
    const total = countResult.total;

    // 获取分页数据
    let records = await query(sql, params);

    // 解析JSON字段
    records = records.map(record => ({
      ...record,
      isCorrect: Boolean(record.isCorrect),
      isWrong: !Boolean(record.isCorrect),
      isMarked: Boolean(record.isMarked || false),
      isMastered: Boolean(record.isMastered || false),
      // 构造question对象
      question: {
        id: record.questionId,
        content: record.question_content,
        type: record.question_type,
        difficulty: record.question_difficulty
      }
    }));

    res.json({
      records,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/records
// @desc    Create answer record
// @access  Private
router.post('/', protect, async (req, res) => {
  const { question, selectedAnswer, isCorrect, answerTime } = req.body;

  try {
    // 检查题目是否存在
    const questionExists = await get('SELECT * FROM questions WHERE id = ?', [question]);
    if (!questionExists) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // 创建答题记录
    const { id } = await insert(
      'INSERT INTO answerRecords (userId, questionId, answer, isCorrect, answerTime) VALUES (?, ?, ?, ?, ?)',
      [
        req.user.id,
        question,
        JSON.stringify(selectedAnswer),
        isCorrect ? 1 : 0,
        answerTime
      ]
    );

    // 获取创建的记录
    const record = await get('SELECT * FROM answerRecords WHERE id = ?', [id]);

    // 解析JSON字段
    const formattedRecord = {
      ...record,
      _id: record.id,
      isCorrect: Boolean(record.isCorrect),
      isWrong: !Boolean(record.isCorrect),
      answer: JSON.parse(record.answer)
    };

    res.status(201).json(formattedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/records/:id
// @desc    Update answer record
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { isMarked, isMastered } = req.body;

  try {
    // 检查记录是否存在
    const record = await get('SELECT * FROM answerRecords WHERE id = ?', [req.params.id]);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // 检查记录是否属于当前用户
    if (record.userId !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // 构建更新SQL
    let updateSql = 'UPDATE answerRecords SET ';
    let updateParams = [];
    let updates = [];

    if (isMarked !== undefined) {
      updates.push('isMarked = ?');
      updateParams.push(isMarked ? 1 : 0);
    }
    if (isMastered !== undefined) {
      updates.push('isMastered = ?');
      updateParams.push(isMastered ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.json({
        ...record,
        _id: record.id,
        isCorrect: Boolean(record.isCorrect),
        isWrong: !Boolean(record.isCorrect),
        isMarked: Boolean(record.isMarked || false),
        isMastered: Boolean(record.isMastered || false),
        answer: JSON.parse(record.answer)
      });
    }

    updateSql += updates.join(', ') + ' WHERE id = ?';
    updateParams.push(req.params.id);

    // 执行更新
    await update(updateSql, updateParams);

    // 获取更新后的记录
    const updatedRecord = await get('SELECT * FROM answerRecords WHERE id = ?', [req.params.id]);

    // 解析JSON字段
    const formattedRecord = {
      ...updatedRecord,
      _id: updatedRecord.id,
      isCorrect: Boolean(updatedRecord.isCorrect),
      isWrong: !Boolean(updatedRecord.isCorrect),
      isMarked: Boolean(updatedRecord.isMarked || false),
      isMastered: Boolean(updatedRecord.isMastered || false),
      answer: JSON.parse(updatedRecord.answer)
    };

    res.json(formattedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/records/:id
// @desc    Delete answer record
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // 检查记录是否存在
    const record = await get('SELECT * FROM answerRecords WHERE id = ?', [req.params.id]);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // 检查记录是否属于当前用户
    if (record.userId !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // 删除记录
    await remove('DELETE FROM answerRecords WHERE id = ?', [req.params.id]);
    res.json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/records/stats
// @desc    Get user answer statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // 基础统计信息
    const baseStats = await get(
      `SELECT COUNT(*) as totalAnswers, 
              SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) as correctAnswers, 
              SUM(CASE WHEN isCorrect = 0 THEN 1 ELSE 0 END) as wrongAnswers, 
              SUM(CASE WHEN isMarked = 1 THEN 1 ELSE 0 END) as markedAnswers, 
              SUM(CASE WHEN isMastered = 1 THEN 1 ELSE 0 END) as masteredAnswers 
       FROM answerRecords WHERE userId = ?`,
      [req.user.id]
    );

    // 正确率
    const accuracy = baseStats.totalAnswers > 0
      ? parseFloat((baseStats.correctAnswers / baseStats.totalAnswers * 100).toFixed(2))
      : 0;

    // 按题型统计
    const typeStats = await query(
      `SELECT q.type, 
              COUNT(*) as total, 
              SUM(CASE WHEN ar.isCorrect = 1 THEN 1 ELSE 0 END) as correct 
       FROM answerRecords ar 
       JOIN questions q ON ar.questionId = q.id 
       WHERE ar.userId = ? 
       GROUP BY q.type`,
      [req.user.id]
    );

    // 计算准确率
    const typeStatsArray = typeStats.map(stat => ({
      ...stat,
      accuracy: parseFloat((stat.correct / stat.total * 100).toFixed(2))
    }));

    // 按难度统计
    const difficultyStats = await query(
      `SELECT q.difficulty, 
              COUNT(*) as total, 
              SUM(CASE WHEN ar.isCorrect = 1 THEN 1 ELSE 0 END) as correct 
       FROM answerRecords ar 
       JOIN questions q ON ar.questionId = q.id 
       WHERE ar.userId = ? 
       GROUP BY q.difficulty`,
      [req.user.id]
    );

    // 计算准确率
    const difficultyStatsArray = difficultyStats.map(stat => ({
      ...stat,
      accuracy: parseFloat((stat.correct / stat.total * 100).toFixed(2))
    }));

    res.json({
      totalAnswers: baseStats.totalAnswers,
      correctAnswers: baseStats.correctAnswers,
      wrongAnswers: baseStats.wrongAnswers,
      markedAnswers: baseStats.markedAnswers,
      masteredAnswers: baseStats.masteredAnswers,
      accuracy,
      typeStats: typeStatsArray,
      difficultyStats: difficultyStatsArray
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
