const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { get } = require('../config/db-utils');

const protect = async (req, res, next) => {
  let token;

  // 检查Authorization头
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 提取令牌
      token = req.headers.authorization.split(' ')[1];

      // 验证令牌
      const decoded = jwt.verify(token, config.JWT_SECRET);

      // 获取用户信息并排除密码
      let user = await get('SELECT id, username, email, isAdmin, isGuest, createdAt, lastLogin FROM users WHERE id = ?', [decoded.id]);
      if (user) {
        // 转换为前端期望的格式
        const userWithoutPassword = {
          ...user,
          _id: user.id,
          id: user.id,
          isAdmin: Boolean(user.isAdmin),
          isGuest: Boolean(user.isGuest)
        };
        req.user = userWithoutPassword;
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// 管理员权限验证
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
