const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const config = require('../config/config');
const { query, get, insert, update, remove } = require('../config/db-utils');

// 配置multer文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // 只允许Excel和JSON文件
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and JSON files are allowed'));
    }
  }
});

// @route   GET /api/questions
// @desc    Get all questions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, type, page = 1, limit = 10 } = req.query;
    let sql = 'SELECT * FROM questions WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM questions WHERE 1=1';
    let params = [];
    let countParams = [];

    if (difficulty) {
      sql += ' AND difficulty = ?';
      countSql += ' AND difficulty = ?';
      params.push(difficulty);
      countParams.push(difficulty);
    }
    if (type) {
      sql += ' AND type = ?';
      countSql += ' AND type = ?';
      params.push(type);
      countParams.push(type);
    }

    // 处理分类筛选（使用JSON_CONTAINS查询JSON数组）
    if (category) {
      sql += ' AND JSON_CONTAINS(categories, ?, \'$\')';
      countSql += ' AND JSON_CONTAINS(categories, ?, \'$\')';
      params.push(`"${category}"`);
      countParams.push(`"${category}"`);
    }

    // 按创建时间排序
    sql += ' ORDER BY createdAt ASC';

    // 分页处理
    const offset = (Number(page) - 1) * Number(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    // 获取总记录数
    const countResult = await get(countSql, countParams);
    const total = countResult.total;

    // 获取分页数据
    let questions = await query(sql, params);

    // 解析JSON字段
    questions = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options),
      correctAnswer: JSON.parse(q.correctAnswer),
      categories: JSON.parse(q.categories)
    }));

    res.json({
      questions,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/questions/random
// @desc    Get random questions
// @access  Public
router.get('/random', async (req, res) => {
  try {
    const { category, difficulty, type, count = 10 } = req.query;
    let sql = 'SELECT * FROM questions WHERE 1=1';
    let params = [];

    if (difficulty) {
      sql += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    // 处理分类筛选
    if (category) {
      sql += ' AND JSON_CONTAINS(categories, ?, \'$\')';
      params.push(`"${category}"`);
    }

    // 随机排序并限制数量
    sql += ' ORDER BY RANDOM() LIMIT ?';
    params.push(Number(count));

    let questions = await query(sql, params);

    // 解析JSON字段
    questions = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options),
      correctAnswer: JSON.parse(q.correctAnswer),
      categories: JSON.parse(q.categories)
    }));

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/questions/:id
// @desc    Get question by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    let question = await get('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // 解析JSON字段
    question = {
      ...question,
      options: JSON.parse(question.options),
      correctAnswer: JSON.parse(question.correctAnswer),
      categories: JSON.parse(question.categories)
    };

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/questions
// @desc    Create new question
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  const { content, type, options, correctAnswer, explanation, categories, difficulty, source } = req.body;

  try {
    // 创建新题目
    const { id } = await insert(
      'INSERT INTO questions (content, type, options, correctAnswer, explanation, categories, difficulty, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        content,
        type,
        JSON.stringify(options),
        JSON.stringify(correctAnswer),
        explanation,
        JSON.stringify(categories),
        difficulty,
        source
      ]
    );

    // 获取创建的题目
    let question = await get('SELECT * FROM questions WHERE id = ?', [id]);

    // 解析JSON字段
    question = {
      ...question,
      options: JSON.parse(question.options),
      correctAnswer: JSON.parse(question.correctAnswer),
      categories: JSON.parse(question.categories)
    };

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update question
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  const { content, type, options, correctAnswer, explanation, categories, difficulty, source } = req.body;

  try {
    // 检查题目是否存在
    let question = await get('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // 构建更新SQL
    let updateSql = 'UPDATE questions SET ';
    let updateParams = [];
    let updates = [];

    if (content !== undefined) {
      updates.push('content = ?');
      updateParams.push(content);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      updateParams.push(type);
    }
    if (options !== undefined) {
      updates.push('options = ?');
      updateParams.push(JSON.stringify(options));
    }
    if (correctAnswer !== undefined) {
      updates.push('correctAnswer = ?');
      updateParams.push(JSON.stringify(correctAnswer));
    }
    if (explanation !== undefined) {
      updates.push('explanation = ?');
      updateParams.push(explanation);
    }
    if (categories !== undefined) {
      updates.push('categories = ?');
      updateParams.push(JSON.stringify(categories));
    }
    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      updateParams.push(difficulty);
    }
    if (source !== undefined) {
      updates.push('source = ?');
      updateParams.push(source);
    }

    if (updates.length === 0) {
      // 解析JSON字段
      question = {
        ...question,
        options: JSON.parse(question.options),
        correctAnswer: JSON.parse(question.correctAnswer),
        categories: JSON.parse(question.categories)
      };
      return res.json(question);
    }

    updateSql += updates.join(', ') + ' WHERE id = ?';
    updateParams.push(req.params.id);

    // 执行更新
    await update(updateSql, updateParams);

    // 获取更新后的题目
    question = await get('SELECT * FROM questions WHERE id = ?', [req.params.id]);

    // 解析JSON字段
    question = {
      ...question,
      options: JSON.parse(question.options),
      correctAnswer: JSON.parse(question.correctAnswer),
      categories: JSON.parse(question.categories)
    };

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete question
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    // 检查题目是否存在
    const question = await get('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // 删除题目
    await remove('DELETE FROM questions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/questions/import
// @desc    Import questions from file
// @access  Private/Admin
router.post('/import', protect, admin, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let questions = [];
    const importedQuestions = [];

    // 根据文件类型处理
    if (file.mimetype === 'application/json') {
      // 处理JSON文件
      const jsonData = JSON.parse(fs.readFileSync(file.path, 'utf8'));
      questions = jsonData.questions || [];
    } else {
      // 处理Excel文件
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      // 转换Excel数据为题目格式
      questions = data.map(row => {
        // 处理不同题型的选项和正确答案
        let options = [];
        let correctAnswer = [];

        if (row.type === 'single_choice' || row.type === 'multiple_choice') {
          // 单选题和多选题选项
          if (row.optionA) options.push({ text: row.optionA, isCorrect: false });
          if (row.optionB) options.push({ text: row.optionB, isCorrect: false });
          if (row.optionC) options.push({ text: row.optionC, isCorrect: false });
          if (row.optionD) options.push({ text: row.optionD, isCorrect: false });
          if (row.optionE) options.push({ text: row.optionE, isCorrect: false });
        }

        // 设置正确答案
        if (row.correctAnswer) {
          const correctAnswers = row.correctAnswer.split(',').map(ans => ans.trim());
          correctAnswer = correctAnswers;

          // 更新选项的isCorrect属性
          options.forEach(option => {
            if (correctAnswers.includes(option.text.substring(0, 1))) {
              option.isCorrect = true;
            }
          });
        }

        return {
          content: row.content,
          type: row.type,
          options,
          correctAnswer,
          explanation: row.explanation || '',
          categories: row.categories || [],
          difficulty: row.difficulty || 'medium',
          source: row.source || ''
        };
      });
    }

    // 导入题目到SQLite数据库
    for (const question of questions) {
      const { id } = await insert(
        'INSERT INTO questions (content, type, options, correctAnswer, explanation, categories, difficulty, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          question.content,
          question.type,
          JSON.stringify(question.options),
          JSON.stringify(question.correctAnswer),
          question.explanation,
          JSON.stringify(question.categories),
          question.difficulty,
          question.source
        ]
      );

      // 获取导入的题目
      let importedQuestion = await get('SELECT * FROM questions WHERE id = ?', [id]);

      // 解析JSON字段
      importedQuestion = {
        ...importedQuestion,
        options: JSON.parse(importedQuestion.options),
        correctAnswer: JSON.parse(importedQuestion.correctAnswer),
        categories: JSON.parse(importedQuestion.categories)
      };

      importedQuestions.push(importedQuestion);
    }

    // 删除临时文件
    fs.unlinkSync(file.path);

    res.status(201).json({
      message: `${importedQuestions.length} questions imported successfully`,
      questions: importedQuestions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
