import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { FaUserPlus, FaEdit, FaTrash, FaSave, FaWindowClose, FaUsers } from 'react-icons/fa';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    isAdmin: false
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // 检查用户是否为管理员
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user?.isAdmin) {
    navigate('/');
    return null;
  }

  // 获取所有用户
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userAPI.getAllUsers();
        setUsers(data);
      } catch (err) {
        setError('获取用户列表失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 处理编辑用户
  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  // 处理保存编辑
  const handleSaveEdit = async () => {
    try {
      const updatedUser = await userAPI.updateUser(editingUser._id, editingUser);
      setUsers(users.map(user => user._id === updatedUser._id ? updatedUser : user));
      setEditingUser(null);
    } catch (err) {
      setError('更新用户失败');
      console.error(err);
    }
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  // 处理删除用户
  const handleDelete = async (userId) => {
    if (window.confirm('确定要删除这个用户吗？')) {
      try {
        await userAPI.deleteUser(userId);
        setUsers(users.filter(user => user._id !== userId));
      } catch (err) {
        setError('删除用户失败');
        console.error(err);
      }
    }
  };

  // 处理添加用户
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const addedUser = await userAPI.createUser(newUser);
      setUsers([...users, addedUser]);
      setNewUser({
        username: '',
        email: '',
        password: '',
        isAdmin: false
      });
      setShowAddForm(false);
    } catch (err) {
      setError('添加用户失败');
      console.error(err);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (editingUser) {
      setEditingUser(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else {
      setNewUser(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  return (
    <div className="user-management-container">
      <h1>用户管理</h1>

      {loading ? (
        <div className="loading">加载用户列表中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {/* 添加用户按钮 */}
          <div className="user-management-header">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <FaUserPlus /> 添加用户
            </button>
          </div>

          {/* 添加用户表单 */}
          {showAddForm && (
            <div className="user-form-card">
              <h2>添加新用户</h2>
              <form onSubmit={handleAddUser} className="user-form">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">用户名</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    value={newUser.username}
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
                    value={newUser.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">密码</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    value={newUser.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    name="isAdmin"
                    className="form-checkbox"
                    checked={newUser.isAdmin}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="isAdmin" className="form-label">管理员权限</label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-success">
                    <FaSave /> 保存
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewUser({
                        username: '',
                        email: '',
                        password: '',
                        isAdmin: false
                      });
                    }}
                  >
                    <FaWindowClose /> 取消
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 用户列表 */}
          <div className="user-list">
            <h2>用户列表</h2>
            <div className="user-table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>用户名</th>
                    <th>邮箱</th>
                    <th>管理员权限</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      {editingUser?._id === user._id ? (
                        <>
                          <td>{user._id}</td>
                          <td>
                            <input
                              type="text"
                              name="username"
                              className="form-control"
                              value={editingUser.username}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td>
                            <input
                              type="email"
                              name="email"
                              className="form-control"
                              value={editingUser.email}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              name="isAdmin"
                              checked={editingUser.isAdmin}
                              onChange={handleInputChange}
                            />
                          </td>
                          <td>{new Date(user.createdAt).toLocaleString()}</td>
                          <td>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={handleSaveEdit}
                            >
                              <FaSave />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={handleCancelEdit}
                            >
                              <FaWindowClose />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{user._id}</td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>{user.isAdmin ? '是' : '否'}</td>
                          <td>{new Date(user.createdAt).toLocaleString()}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleEdit(user)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(user._id)}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;
