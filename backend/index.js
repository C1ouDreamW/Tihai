const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const path = require('path');

// 初始化Express应用
const app = express();

// 使用SQLite数据库
const { db, initializeDB } = require('./config/db');
// 将数据库连接挂载到全局，方便路由使用
global.db = db;

// 初始化数据库表结构
initializeDB();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 创建uploads目录
const fs = require('fs');
if (!fs.existsSync(config.UPLOAD_PATH)) {
  fs.mkdirSync(config.UPLOAD_PATH);
}

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/records', require('./routes/records'));
app.use('/api/progress', require('./routes/progress'));

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', sqliteDB: true });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: '后端运行正常~' });
});

// 启动服务器
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  console.log('Using SQLite database');
});
