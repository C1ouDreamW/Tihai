import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { FaHome, FaBook, FaChartBar, FaUser, FaSignOutAlt, FaBars, FaTimes, FaUpload, FaUsers } from 'react-icons/fa';
import './Layout.css';

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // 从localStorage获取用户信息
  const user = JSON.parse(localStorage.getItem('user'));

  // 退出登录函数
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // 导航链接
  const navLinks = [
    { path: '/', icon: <FaHome />, label: '首页' },
    { path: '/stats', icon: <FaChartBar />, label: '学习统计' },
    { path: '/profile', icon: <FaUser />, label: (user?.username && user.username !== '0' && user.username !== 0) ? user.username : '个人中心' }
  ];

  // 管理员导航链接
  const adminLinks = [
    { path: '/import', icon: <FaUpload />, label: '导入题库' },
    { path: '/users', icon: <FaUsers />, label: '用户管理' }
  ];

  return (
    <div className="app-container">
      {/* 导航栏 */}
      <header className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <h1>期末复习刷题平台</h1>
          </Link>

          {/* 移动端菜单按钮 */}
          <button
            className="navbar-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* 桌面端导航链接 */}
          <nav className="navbar-nav">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
              </Link>
            ))}

            {/* 管理员链接 */}
            {(user?.isAdmin === 1 || user?.isAdmin === true) && adminLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
              </Link>
            ))}

            {/* 退出登录按钮 */}
            {user && (
              <button
                className="nav-link logout-btn"
                onClick={handleLogout}
              >
                <span className="nav-icon"><FaSignOutAlt /></span>
                <span className="nav-label">退出登录</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* 移动端侧边菜单 */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
              </Link>
            ))}

            {/* 管理员链接 */}
            {(user?.isAdmin === 1 || user?.isAdmin === true) && adminLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
              </Link>
            ))}

            {user && (
              <button
                className="mobile-link logout-btn"
                onClick={handleLogout}
              >
                <span className="nav-icon"><FaSignOutAlt /></span>
                <span className="nav-label">退出登录</span>
              </button>
            )}
          </nav>
        </div>
      )}

      {/* 主要内容区域 */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2024 期末复习刷题平台. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
