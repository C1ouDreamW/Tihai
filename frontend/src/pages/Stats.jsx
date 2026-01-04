import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordAPI } from '../services/api';
import { FaChartBar, FaCheck, FaTimes, FaUser, FaCalendar, FaBookOpen } from 'react-icons/fa';

const Stats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAnswers: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    markedAnswers: 0,
    masteredAnswers: 0,
    accuracy: 0
  });
  const [typeStats, setTypeStats] = useState([]);
  const [difficultyStats, setDifficultyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await recordAPI.getStats();
        setStats(data);
        setTypeStats(data.typeStats || []);
        setDifficultyStats(data.difficultyStats || []);
      } catch (err) {
        setError('获取统计数据失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 渲染统计卡片
  const renderStatCard = (icon, title, value, color) => {
    return (
      <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div className="stat-info">
          <h3 className="stat-title">{title}</h3>
          <p className="stat-value">{value}</p>
        </div>
      </div>
    );
  };

  // 渲染统计图表
  const renderChart = (title, data, key) => {
    if (data.length === 0) {
      return (
        <div className="chart-card">
          <h2 className="chart-title">{title}</h2>
          <div className="empty-state">
            <p>暂无数据</p>
          </div>
        </div>
      );
    }

    return (
      <div className="chart-card">
        <h2 className="chart-title">{title}</h2>
        <div className="chart-container">
          {data.map((item, index) => {
            const percentage = Math.round(item.accuracy);
            const label = key === 'type' ?
              (item.type === 'single_choice' ? '单选题' :
                item.type === 'multiple_choice' ? '多选题' : '判断题') :
              (item.difficulty === 'easy' ? '简单' :
                item.difficulty === 'medium' ? '中等' : '困难');

            return (
              <div key={index} className="chart-item">
                <div className="chart-label">{label}</div>
                <div className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: percentage > 70 ? '#28a745' :
                        percentage > 40 ? '#ffc107' : '#dc3545'
                    }}
                  ></div>
                </div>
                <div className="chart-percentage">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="stats-container fade-in">
      {/* 页面标题 */}
      <h1 className="mb-lg">学习统计</h1>

      {loading ? (
        <div className="loading">加载统计数据中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {/* 总体统计卡片 */}
          <div className="stats-grid">
            {renderStatCard(
              <FaCheck />,
              '总答题数',
              stats.totalAnswers,
              '#4a90e2'
            )}
            {renderStatCard(
              <FaCheck />,
              '正确答案',
              stats.correctAnswers,
              '#28a745'
            )}
            {renderStatCard(
              <FaTimes />,
              '错误答案',
              stats.wrongAnswers,
              '#dc3545'
            )}
            {renderStatCard(
              <FaChartBar />,
              '正确率',
              `${stats.accuracy}%`,
              '#ffc107'
            )}
          </div>

          {/* 详细统计图表 */}
          <div className="charts-section">
            {renderChart('按题型统计', typeStats, 'type')}
            {renderChart('按难度统计', difficultyStats, 'difficulty')}
          </div>

          {/* 学习建议 */}
          <div className="suggestions-card card">
            <h2 className="card-title">学习建议</h2>
            <div className="suggestions-list">
              {stats.accuracy < 60 ? (
                <div className="suggestion-item">
                  <FaExclamationCircle /> 建议加强基础知识学习，多做练习题
                </div>
              ) : stats.accuracy < 80 ? (
                <div className="suggestion-item">
                  <FaCheck /> 学习效果良好，建议针对性加强薄弱环节
                </div>
              ) : (
                <div className="suggestion-item">
                  <FaCheck /> 学习效果优秀，建议挑战更高难度的题目
                </div>
              )}

              {typeStats.length > 0 && typeStats.filter(stat => stat.accuracy < 60).map(stat => {
                const type = stat.type === 'single_choice' ? '单选题' :
                  stat.type === 'multiple_choice' ? '多选题' : '判断题';
                return (
                  <div key={stat.type} className="suggestion-item">
                    <FaExclamationCircle /> 建议加强{type}的练习
                  </div>
                );
              })}

              {difficultyStats.length > 0 && difficultyStats.filter(stat => stat.accuracy < 60).map(stat => {
                const difficulty = stat.difficulty === 'easy' ? '简单' :
                  stat.difficulty === 'medium' ? '中等' : '困难';
                return (
                  <div key={stat.difficulty} className="suggestion-item">
                    <FaExclamationCircle /> 建议加强{difficulty}题目的练习
                  </div>
                );
              })}
            </div>

            {/* 继续学习按钮 */}
            <div className="suggestion-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/')}
              >
                继续学习
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Stats;
