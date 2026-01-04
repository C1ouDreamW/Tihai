const mongoose = require('mongoose');

const AnswerRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  selectedAnswer: {
    type: [String],
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  isWrong: {
    type: Boolean,
    default: false
  },
  isMarked: {
    type: Boolean,
    default: false
  },
  isMastered: {
    type: Boolean,
    default: false
  },
  answerTime: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AnswerRecord', AnswerRecordSchema);
