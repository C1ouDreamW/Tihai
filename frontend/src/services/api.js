import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 处理401错误（未授权）
    if (error.response && error.response.status === 401) {
      // 清除本地存储的token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 跳转到登录页面
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// 认证相关API
export const authAPI = {
  // 用户注册
  register: (data) => api.post('/auth/register', data),
  // 用户登录
  login: (data) => api.post('/auth/login', data),
  // 游客登录
  guestLogin: () => api.post('/auth/guest')
};

// 用户相关API
export const userAPI = {
  // 获取当前用户信息
  getCurrentUser: () => api.get('/users/me'),
  // 更新用户信息
  updateProfile: (data) => api.put('/users/me', data)
};

// 分类相关API
export const categoryAPI = {
  // 获取所有分类
  getAll: (params) => api.get('/categories', { params }),
  // 获取单个分类
  getById: (id) => api.get(`/categories/${id}`),
  // 获取子分类
  getChildren: (id) => api.get(`/categories/${id}/children`)
};

// 题目相关API
export const questionAPI = {
  // 获取题目列表
  getAll: (params) => api.get('/questions', { params }),
  // 获取随机题目
  getRandom: (params) => api.get('/questions/random', { params }),
  // 获取单个题目
  getById: (id) => api.get(`/questions/${id}`),
  // 导入题目
  importQuestions: (formData) => api.post('/questions/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// 答题记录相关API
export const recordAPI = {
  // 获取答题记录
  getAll: (params) => api.get('/records', { params }),
  // 创建答题记录
  create: (data) => api.post('/records', data),
  // 更新答题记录
  update: (id, data) => api.put(`/records/${id}`, data),
  // 获取统计信息
  getStats: () => api.get('/records/stats')
};

// 进度相关API
export const progressAPI = {
  // 获取所有进度
  getAll: () => api.get('/progress'),
  // 获取单个分类进度
  getByCategory: (categoryId) => api.get(`/progress/${categoryId}`),
  // 更新进度
  update: (categoryId, data) => api.put(`/progress/${categoryId}`, data)
};

export default api;
