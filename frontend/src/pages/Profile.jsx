import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { FaUser, FaEnvelope, FaCalendar, FaBookOpen, FaSignOutAlt, FaCheck } from 'react-icons/fa';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: ''
  });

  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userAPI.getCurrentUser();
        setUser(data);
        setEditForm({
          username: data.username,
          email: data.email
        });
      } catch (err) {
        setError('获取用户信息失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // 处理表单输入变化
  const handleInputChange = (e) => {
    setEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await userAPI.updateProfile(editForm);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError('更新用户信息失败');
      console.error(err);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="profile-container">
      <h1>个人中心</h1>

      {loading ? (
        <div className="loading">加载用户信息中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : user ? (
        <>
          {/* 用户基本信息 */}
          <div className="profile-card">
            <h2 className="card-title">基本信息</h2>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">用户名</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    value={editForm.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">邮箱</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    value={editForm.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    保存
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    取消
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-item">
                  <div className="info-icon">
                    <FaUser />
                  </div>
                  <div className="info-content">
                    <span className="info-label">用户名</span>
                    <span className="info-value">{user.username}</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <FaEnvelope />
                  </div>
                  <div className="info-content">
                    <span className="info-label">邮箱</span>
                    <span className="info-value">{user.email}</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <FaCalendar />
                  </div>
                  <div className="info-content">
                    <span className="info-label">注册时间</span>
                    <span className="info-value">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <FaCalendar />
                  </div>
                  <div className="info-content">
                    <span className="info-label">最后登录</span>
                    <span className="info-value">
                      {new Date(user.lastLogin).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="profile-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    编辑信息
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 学习统计摘要 */}
          <div className="profile-card">
            <h2 className="card-title">学习统计</h2>
            <div className="stats-summary">
              <div className="stat-item">
                <div className="stat-icon">
                  <FaBookOpen />
                </div>
                <div className="stat-content">
                  <span className="stat-label">总答题数</span>
                  <span className="stat-value">0</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">
                  <FaCheck />
                </div>
                <div className="stat-content">
                  <span className="stat-label">正确率</span>
                  <span className="stat-value">0%</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">
                  <FaBookOpen />
                </div>
                <div className="stat-content">
                  <span className="stat-label">已掌握知识点</span>
                  <span className="stat-value">0</span>
                </div>
              </div>
            </div>

            <div className="view-stats">
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/stats')}
              >
                查看详细统计
              </button>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="profile-card">
            <h2 className="card-title">账户操作</h2>
            <div className="account-actions">
              <button
                className="btn btn-danger"
                onClick={handleLogout}
              >
                <FaSignOutAlt /> 退出登录
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="error">未找到用户信息</div>
      )}

      {/* 样式已移至 index.css */}
    </div>
  );
};

export default Profile;
