import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionAPI, recordAPI, progressAPI } from '../services/api';
import { FaArrowLeft, FaArrowRight, FaCheck, FaTimes, FaExclamationCircle } from 'react-icons/fa';

const Study = () => {
  const { mode, categoryId } = useParams();
  const navigate = useNavigate();

  // 状态管理
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studyStats, setStudyStats] = useState({
    total: 0,
    correct: 0,
    wrong: 0
  });

  // 题目数量设置
  const [questionCount, setQuestionCount] = useState(10);
  const [showSettings, setShowSettings] = useState(true);

  // 页面引用
  const answersRef = useRef([]);

  // 获取题目
  useEffect(() => {
    if (!showSettings) {
      const fetchQuestions = async () => {
        try {
          setLoading(true);
          let data;

          if (mode === 'random') {
            // 随机刷题模式
            data = await questionAPI.getRandom({
              category: categoryId,
              count: questionCount
            });
          } else {
            // 顺序刷题模式
            data = await questionAPI.getAll({
              category: categoryId,
              limit: questionCount
            });
            data = data.questions;
          }

          setQuestions(data);
          setCurrentIndex(0);
          setSelectedAnswers([]);
          setShowResult(false);
          setIsCorrect(null);
          setStudyStats({
            total: data.length,
            correct: 0,
            wrong: 0
          });
        } catch (err) {
          setError('获取题目失败');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchQuestions();
    }
  }, [mode, categoryId, questionCount, showSettings]);

  // 提交答案
  const handleSubmit = () => {
    if (selectedAnswers.length === 0) {
      alert('请选择答案');
      return;
    }

    const currentQuestion = questions[currentIndex];

    // 检查答案是否正确
    let correct = false;
    if (currentQuestion.type === 'single_choice') {
      // 单选题：只允许选一个，与正确答案比较
      correct = selectedAnswers[0] === currentQuestion.correctAnswer[0];
    } else if (currentQuestion.type === 'multiple_choice') {
      // 多选题：比较选项集合是否相同
      const selectedSet = new Set(selectedAnswers);
      const correctSet = new Set(currentQuestion.correctAnswer);
      correct = selectedSet.size === correctSet.size && [...selectedSet].every(item => correctSet.has(item));
    } else if (currentQuestion.type === 'true_false') {
      // 判断题：与正确答案比较
      correct = selectedAnswers[0] === currentQuestion.correctAnswer[0];
    }

    setIsCorrect(correct);
    setShowResult(true);

    // 更新学习统计
    setStudyStats(prev => ({
      ...prev,
      correct: correct ? prev.correct + 1 : prev.correct,
      wrong: correct ? prev.wrong : prev.wrong + 1
    }));

    // 保存答题记录
    const saveAnswerRecord = async () => {
      try {
        await recordAPI.create({
          question: currentQuestion._id,
          selectedAnswer: selectedAnswers,
          isCorrect: correct
        });

        // 更新学习进度
        await progressAPI.update(categoryId, {
          answeredQuestions: currentIndex + 1,
          correctAnswers: correct ? studyStats.correct + 1 : studyStats.correct
        });
      } catch (err) {
        console.error('保存答题记录失败:', err);
      }
    };

    saveAnswerRecord();
  };

  // 选择答案
  const handleAnswerSelect = (answer) => {
    if (showResult) return;

    let newSelectedAnswers = [...selectedAnswers];

    if (questions[currentIndex].type === 'single_choice' || questions[currentIndex].type === 'true_false') {
      // 单选题和判断题：只能选一个
      newSelectedAnswers = [answer];
    } else if (questions[currentIndex].type === 'multiple_choice') {
      // 多选题：可以选多个
      if (newSelectedAnswers.includes(answer)) {
        // 取消选择
        newSelectedAnswers = newSelectedAnswers.filter(item => item !== answer);
      } else {
        // 添加选择
        newSelectedAnswers.push(answer);
      }
    }

    setSelectedAnswers(newSelectedAnswers);
  };

  // 下一题
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswers([]);
      setShowResult(false);
      setIsCorrect(null);
    } else {
      // 完成所有题目
      alert(`刷题完成！正确率：${Math.round((studyStats.correct / studyStats.total) * 100)}%`);
      navigate('/stats');
    }
  };

  // 上一题
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswers([]);
      setShowResult(false);
      setIsCorrect(null);
    }
  };

  // 开始刷题
  const startStudy = () => {
    if (questionCount < 1 || questionCount > 50) {
      alert('题目数量应在1-50之间');
      return;
    }
    setShowSettings(false);
  };

  // 渲染题目内容
  const renderQuestion = () => {
    if (questions.length === 0) return null;

    const question = questions[currentIndex];

    return (
      <div className="question-card">
        {/* 题目头部 */}
        <div className="question-header">
          <div className="question-info">
            <span className="question-type">
              {question.type === 'single_choice' && '单选题'}
              {question.type === 'multiple_choice' && '多选题'}
              {question.type === 'true_false' && '判断题'}
            </span>
            <span className="question-difficulty">
              {question.difficulty === 'easy' && '简单'}
              {question.difficulty === 'medium' && '中等'}
              {question.difficulty === 'hard' && '困难'}
            </span>
          </div>
          <div className="question-progress">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>

        {/* 题目内容 */}
        <div className="question-content">
          <h3>{question.content}</h3>
        </div>

        {/* 选项 */}
        <div className="question-options">
          {question.options.map((option, index) => {
            const optionKey = String.fromCharCode(65 + index); // A, B, C, D...
            const isSelected = selectedAnswers.includes(optionKey);
            const isCorrect = showResult && question.correctAnswer.includes(optionKey);
            const isWrong = showResult && isSelected && !isCorrect;

            return (
              <div
                key={optionKey}
                className={`option-item ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => handleAnswerSelect(optionKey)}
                ref={el => answersRef.current[index] = el}
              >
                <div className="option-letter">{optionKey}</div>
                <div className="option-text">{option.text}</div>
                {showResult && (
                  <div className="option-result">
                    {isCorrect && <FaCheck />}
                    {isWrong && <FaTimes />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 解析 */}
        {showResult && (
          <div className={`explanation ${isCorrect ? 'correct' : 'wrong'}`}>
            <div className="explanation-header">
              <FaExclamationCircle />
              <h4>{isCorrect ? '回答正确！' : '回答错误！'}</h4>
            </div>
            <div className="explanation-content">
              <p><strong>正确答案：</strong>{question.correctAnswer.join(', ')}</p>
              {question.explanation && (
                <p><strong>解析：</strong>{question.explanation}</p>
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="question-actions">
          <button
            className="btn btn-secondary"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <FaArrowLeft /> 上一题
          </button>

          {showResult ? (
            <button
              className="btn btn-primary"
              onClick={handleNext}
            >
              {currentIndex < questions.length - 1 ? '下一题' : '完成'}
              <FaArrowRight />
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={selectedAnswers.length === 0}
            >
              提交答案
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="study-container fade-in">
      {/* 返回按钮 */}
      <button
        className="btn-back"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft /> 返回
      </button>

      {/* 页面标题 */}
      <h1 className="mb-lg">
        {mode === 'sequential' && '顺序刷题'}
        {mode === 'random' && '随机刷题'}
      </h1>

      {/* 刷题设置 */}
      {showSettings ? (
        <div className="settings-card card">
          <h2 className="card-title">刷题设置</h2>
          <div className="form-group">
            <label htmlFor="questionCount" className="form-label">
              题目数量（1-50）
            </label>
            <input
              type="number"
              id="questionCount"
              className="form-control"
              min="1"
              max="50"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            />
          </div>
          <div className="settings-actions">
            <button
              className="btn btn-primary"
              onClick={startStudy}
            >
              开始刷题
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="loading">加载题目中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {/* 学习统计 */}
          <div className="study-stats">
            <div className="stat-item card">
              <span className="stat-label">总题数</span>
              <span className="stat-value">{studyStats.total}</span>
            </div>
            <div className="stat-item card">
              <span className="stat-label">正确</span>
              <span className="stat-value correct">{studyStats.correct}</span>
            </div>
            <div className="stat-item card">
              <span className="stat-label">错误</span>
              <span className="stat-value wrong">{studyStats.wrong}</span>
            </div>
            <div className="stat-item card">
              <span className="stat-label">正确率</span>
              <span className="stat-value">
                {studyStats.total > 0 ? Math.round((studyStats.correct / studyStats.total) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* 题目区域 */}
          {renderQuestion()}
        </>
      )}
    </div>
  );
};

export default Study;
