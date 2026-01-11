#!/usr/bin/env node

// 临时脚本：添加管理员账户
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'backend', 'data', 'exam-prep.db');

// 管理员账户信息
const adminUser = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123' // 请根据需要修改密码
};

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  }
  console.log('成功连接到数据库');
  
  // 生成密码哈希
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      console.error('生成盐值失败:', err.message);
      db.close();
      process.exit(1);
    }
    
    bcrypt.hash(adminUser.password, salt, (err, hashedPassword) => {
      if (err) {
        console.error('密码加密失败:', err.message);
        db.close();
        process.exit(1);
      }
      
      // 插入管理员账户
      const sql = `INSERT INTO users (username, email, password, isAdmin, isGuest) 
                   VALUES (?, ?, ?, 1, 0)`;
      
      db.run(sql, [adminUser.username, adminUser.email, hashedPassword], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE')) {
            console.error('管理员账户已存在，请检查用户名和邮箱');
          } else {
            console.error('添加管理员账户失败:', err.message);
          }
          db.close();
          process.exit(1);
        }
        
        console.log(`成功添加管理员账户，ID: ${this.lastID}`);
        console.log('管理员账户信息:');
        console.log(`用户名: ${adminUser.username}`);
        console.log(`邮箱: ${adminUser.email}`);
        console.log(`密码: ${adminUser.password}`);
        console.log('请保存好这些信息，登录后建议立即修改密码');
        
        db.close();
      });
    });
  });
});
