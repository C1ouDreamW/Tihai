// 模拟数据库，用于开发和测试

// 模拟数据
const mockData = {
  users: [
    {
      _id: '1',
      username: 'testuser',
      email: 'test@example.com',
      password: '$2b$10$...', // 模拟加密密码
      isAdmin: false,
      isGuest: false,
      createdAt: new Date(),
      lastLogin: new Date()
    }
  ],
  categories: [
    {
      _id: '1',
      name: '高等数学',
      type: 'subject',
      parent: null,
      description: '大学高等数学课程',
      createdAt: new Date()
    },
    {
      _id: '2',
      name: '函数与极限',
      type: 'chapter',
      parent: '1',
      description: '高等数学第一章',
      createdAt: new Date()
    },
    {
      _id: '3',
      name: '函数的概念与性质',
      type: 'knowledge_point',
      parent: '2',
      description: '函数的概念与基本性质',
      createdAt: new Date()
    }
  ],
  questions: [
    {
      _id: '1',
      content: '下列哪个是奇函数？',
      type: 'single_choice',
      options: [
        { text: 'A. f(x) = x²', isCorrect: false },
        { text: 'B. f(x) = sinx', isCorrect: true },
        { text: 'C. f(x) = cosx', isCorrect: false },
        { text: 'D. f(x) = e^x', isCorrect: false }
      ],
      correctAnswer: ['B'],
      explanation: '奇函数满足f(-x) = -f(x)，sin(-x) = -sinx，故sinx是奇函数',
      categories: ['3'],
      difficulty: 'easy',
      createdAt: new Date()
    },
    {
      _id: '2',
      content: '极限lim(x→0) (sinx/x) = ?',
      type: 'single_choice',
      options: [
        { text: 'A. 0', isCorrect: false },
        { text: 'B. 1', isCorrect: true },
        { text: 'C. ∞', isCorrect: false },
        { text: 'D. 不存在', isCorrect: false }
      ],
      correctAnswer: ['B'],
      explanation: '这是一个重要极限，lim(x→0) (sinx/x) = 1',
      categories: ['3'],
      difficulty: 'medium',
      createdAt: new Date()
    }
  ],
  answerRecords: [],
  progress: []
};

// 模拟数据库操作
class MockDB {
  constructor() {
    this.data = JSON.parse(JSON.stringify(mockData));
    this.autoIncrementId = 100;
  }

  // 获取所有数据
  getAll(collection) {
    return this.data[collection] || [];
  }

  // 根据ID获取数据
  getById(collection, id) {
    return this.data[collection].find(item => item._id === id) || null;
  }

  // 根据条件查询
  find(collection, filter) {
    return this.data[collection].filter(item => {
      for (const [key, value] of Object.entries(filter)) {
        if (Array.isArray(value)) {
          if (!value.includes(item[key])) return false;
        } else {
          if (item[key] !== value) return false;
        }
      }
      return true;
    });
  }

  // 创建新数据
  create(collection, data) {
    const newItem = {
      ...data,
      _id: (this.autoIncrementId++).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data[collection].push(newItem);
    return newItem;
  }

  // 更新数据
  update(collection, id, data) {
    const index = this.data[collection].findIndex(item => item._id === id);
    if (index === -1) return null;
    
    this.data[collection][index] = {
      ...this.data[collection][index],
      ...data,
      updatedAt: new Date()
    };
    return this.data[collection][index];
  }

  // 删除数据
  delete(collection, id) {
    const index = this.data[collection].findIndex(item => item._id === id);
    if (index === -1) return false;
    
    this.data[collection].splice(index, 1);
    return true;
  }

  // 获取随机数据
  getRandom(collection, count = 10, filter = {}) {
    let filtered = this.data[collection];
    if (Object.keys(filter).length > 0) {
      filtered = this.find(collection, filter);
    }
    
    // 随机排序
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

module.exports = new MockDB();
