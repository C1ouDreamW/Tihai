import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionAPI, recordAPI, progressAPI } from '../services/api';
import { FaArrowLeft, FaArrowRight, FaCheck, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const CardMode = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  
  // 状态管理
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mastery, setMastery] = useState({}); // 存储每个题目的掌握状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 题目数量设置
  const [questionCount, setQuestionCount] = useState(10);
  const [showSettings, setShowSettings] = useState(true);
  
  // 滑动相关状态
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const cardRef = useRef(null);

  // 获取题目
  useEffect(() => {
    if (!showSettings) {
      const fetchQuestions = async () => {
        try {
          setLoading(true);
          // 获取随机题目用于背题模式
          const data = await questionAPI.getRandom({
            category: categoryId,
            count: questionCount
          });
          
          setQuestions(data);
          setCurrentIndex(0);
          setShowAnswer(false);
          
          // 初始化掌握状态
          const initialMastery = {};
          data.forEach(q => {
            initialMastery[q._id] = null; // null: 未标记, true: 已掌握, false: 未掌握
          });
          setMastery(initialMastery);
        } catch (err) {
          setError('获取题目失败');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchQuestions();
    }
  }, [categoryId, questionCount, showSettings]);

  // 开始背题
  const startCardMode = () => {
    if (questionCount < 1 || questionCount > 50) {
      alert('题目数量应在1-50之间');
      return;
    }
    setShowSettings(false);
  };

  // 切换答案显示
  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  // 标记掌握状态
  const markMastery = (isMastered) => {
    if (questions.length === 0) return;
    
    const question = questions[currentIndex];
    const newMastery = {
      ...mastery,
      [question._id]: isMastered
    };
    setMastery(newMastery);
    
    // 保存掌握状态到答题记录
    const saveMasteryRecord = async () => {
      try {
        await recordAPI.create({
          question: question._id,
          selectedAnswer: [],
          isCorrect: null,
          isMastered
        });
      } catch (err) {
        console.error('保存掌握状态失败:', err);
      }
    };
    
    saveMasteryRecord();
    
    // 自动切换到下一题
    handleNext();
  };

  // 下一题
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // 完成所有题目
      const masteredCount = Object.values(mastery).filter(v => v === true).length;
      alert(`背题完成！已掌握 ${masteredCount} 题，未掌握 ${questions.length - masteredCount} 题`);
      navigate('/stats');
    }
  };

  // 上一题
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  // 滑动事件处理
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // 渲染背题卡片
  const renderCard = () => {
    if (questions.length === 0) return null;
    
    const question = questions[currentIndex];
    
    return (
      <div 
        className="card-container"
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 卡片头部 */}
        <div className="card-header">
          <div className="card-progress">
            {currentIndex + 1} / {questions.length}
          </div>
          <div className="card-type">
            {question.type === 'single_choice' && '单选题'}
            {question.type === 'multiple_choice' && '多选题'}
            {question.type === 'true_false' && '判断题'}
          </div>
        </div>
        
        {/* 题目内容 */}
        <div className="card-content">
          <h3>{question.content}</h3>
          
          {/* 选项 */}
          <div className="card-options">
            {question.options.map((option, index) => {
              const optionKey = String.fromCharCode(65 + index); // A, B, C, D...
              const isCorrect = question.correctAnswer.includes(optionKey);
              
              return (
                <div 
                  key={optionKey}
                  className={`option-item ${showAnswer && isCorrect ? 'correct' : ''}`}
                >
                  <div className="option-letter">{optionKey}</div>
                  <div className="option-text">{option.text}</div>
                  {showAnswer && isCorrect && (
                    <div className="option-result">
                      <FaCheck />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* 答案和解析 */}
          {showAnswer && (
            <div className="card-answer">
              <h4>正确答案：{question.correctAnswer.join(', ')}</h4>
              {question.explanation && (
                <div className="card-explanation">
                  <h4>解析：</h4>
                  <p>{question.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 卡片操作按钮 */}
        <div className="card-actions">
          {/* 显示答案按钮 */}
          <button 
            className="btn btn-primary w-100"
            onClick={toggleAnswer}
          >
            {showAnswer ? '隐藏答案' : '查看答案'}
          </button>
          
          {/* 掌握状态按钮 */}
          {showAnswer && (
            <div className="mastery-buttons">
              <button 
                className="btn btn-success"
                onClick={() => markMastery(true)}
              >
                <FaCheck /> 已掌握
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => markMastery(false)}
              >
                <FaTimes /> 未掌握
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="card-mode-container">
      {/* 返回按钮 */}
      <button 
        className="btn-back"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft /> 返回
      </button>
      
      {/* 页面标题 */}
      <h1>背题模式</h1>
      
      {/* 背题设置 */}
      {showSettings ? (
        <div className="settings-card">
          <h2>背题设置</h2>
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
              onClick={startCardMode}
            >
              开始背题
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="loading">加载题目中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {/* 背题卡片 */}
          {renderCard()}
          
          {/* 导航按钮 */}
          <div className="navigation-buttons">
            <button 
              className="nav-btn nav-btn-left"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <FaChevronLeft /> 上一题
            </button>
            <button 
              className="nav-btn nav-btn-right"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
            >
              下一题 <FaChevronRight />
            </button>
          </div>
          
          {/* 操作提示 */}
          <div className="swipe-hint">
            <p>提示：左右滑动卡片可切换题目</p>
          </div>
        </>
      )}

      {/* 样式 */}
      <style jsx>{`
        .card-mode-container {
          width: 100%;
          position: relative;
        }

        .btn-back {
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.3s ease;
        }

        .btn-back:hover {
          background-color: #5a6268;
        }

        .card-mode-container h1 {
          margin-bottom: 24px;
          padding-top: 16px;
        }

        /* 设置卡片 */
        .settings-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          padding: 30px;
          max-width: 500px;
          margin: 0 auto;
        }

        .settings-actions {
          display: flex;
          justify-content: center;
          margin-top: 24px;
        }

        /* 卡片容器 */
        .card-container {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
          padding: 30px;
          margin-bottom: 24px;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          position: relative;
          cursor: grab;
          transition: transform 0.3s ease;
        }

        .card-container:active {
          cursor: grabbing;
        }

        /* 卡片头部 */
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }

        .card-progress {
          font-size: 1.2rem;
          font-weight: 700;
          color: #4a90e2;
        }

        .card-type {
          padding: 6px 16px;
          background-color: #e9ecef;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #495057;
        }

        /* 卡片内容 */
        .card-content {
          flex: 1;
        }

        .card-content h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #2c3e50;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        /* 卡片选项 */
        .card-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          background-color: white;
        }

        .option-item.correct {
          border-color: #28a745;
          background-color: #d4edda;
        }

        .option-letter {
          width: 36px;
          height: 36px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          background-color: #e9ecef;
          color: #495057;
          font-weight: 600;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .option-item.correct .option-letter {
          background-color: #28a745;
          color: white;
        }

        .option-text {
          flex: 1;
          font-size: 1rem;
          color: #333;
        }

        .option-result {
          font-size: 1.2rem;
          color: #28a745;
        }

        /* 答案和解析 */
        .card-answer {
          margin-top: 24px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #4a90e2;
        }

        .card-answer h4 {
          margin-bottom: 12px;
          font-size: 1rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .card-explanation {
          margin-top: 16px;
        }

        .card-explanation p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #555;
        }

        /* 卡片操作按钮 */
        .card-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 24px;
        }

        .w-100 {
          width: 100%;
        }

        .mastery-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* 导航按钮 */
        .navigation-buttons {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #f8f9fa;
          color: #495057;
        }

        .nav-btn:hover:not(:disabled) {
          background-color: #e9ecef;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .nav-btn-left {
          flex: 1;
          justify-content: flex-start;
        }

        .nav-btn-right {
          flex: 1;
          justify-content: flex-end;
        }

        /* 滑动提示 */
        .swipe-hint {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 0.9rem;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .btn-back {
            position: static;
            margin-bottom: 16px;
          }

          .card-mode-container h1 {
            padding-top: 0;
          }

          .card-container {
            padding: 20px;
            min-height: 350px;
          }

          .card-content h3 {
            font-size: 1.1rem;
          }

          .mastery-buttons {
            grid-template-columns: 1fr;
          }

          .navigation-buttons {
            flex-direction: column;
          }

          .nav-btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default CardMode;
