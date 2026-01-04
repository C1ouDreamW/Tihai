import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 调用登录API
      const data = await authAPI.login({ email, password });

      // 保存用户信息和token到localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));

      // 跳转到首页
      navigate('/');
    } catch (err) {
      setError(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  // 处理游客登录
  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // 调用游客登录API
      const data = await authAPI.guestLogin();

      // 保存用户信息和token到localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));

      // 跳转到首页
      navigate('/');
    } catch (err) {
      setError(err.message || '游客登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>期末复习刷题平台</h1>
        <h2>登录</h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">邮箱</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">密码</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="login-divider">
          <span>或</span>
        </div>

        <button
          className="btn btn-secondary w-100"
          onClick={handleGuestLogin}
          disabled={loading}
        >
          {loading ? '登录中...' : '游客模式登录'}
        </button>

        <div className="login-register">
          <p>还没有账号？ <Link to="/register">立即注册</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
