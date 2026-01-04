const mongoose = require('mongoose');

// 分类类型定义
const categoryType = {
  type: String,
  required: true,
  enum: ['subject', 'chapter', 'knowledge_point']
};
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: categoryType,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 导出模型和分类类型定义
module.exports = {
  Category: mongoose.model('Category', CategorySchema),
  categoryType
};
