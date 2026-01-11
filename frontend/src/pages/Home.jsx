import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import { FaBook, FaRandom, FaList, FaChartLine } from 'react-icons/fa';

const Home = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取学科分类
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await categoryAPI.getAll({ type: 'subject' });
        // 确保subjects是数组
        setSubjects(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('获取学科分类失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // 学习模式卡片
  const studyModes = [
    {
      id: 'sequential',
      title: '顺序刷题',
      description: '按照章节顺序系统学习，循序渐进',
      icon: <FaList />,
      color: '#4a90e2'
    },
    {
      id: 'random',
      title: '随机刷题',
      description: '随机抽取题目，模拟考试环境',
      icon: <FaRandom />,
      color: '#28a745'
    },
    {
      id: 'card',
      title: '背题模式',
      description: '卡片式学习，专注记忆知识点',
      icon: <FaBook />,
      color: '#ffc107'
    }
  ];

  return (
    <div className="home-container fade-in">
      {/* 页面标题 */}
      <section className="hero-section">
        <h1>欢迎使用期末复习刷题平台</h1>
        <p>选择你要学习的学科，开始高效复习之旅</p>
      </section>

      {/* 学习统计卡片 */}
      <section className="stats-section">
        <div className="card">
          <h2 className="card-title">学习统计</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon"><FaChartLine /></div>
              <div className="stat-content">
                <div className="stat-value">0</div>
                <div className="stat-label">总答题数</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><FaChartLine /></div>
              <div className="stat-content">
                <div className="stat-value">0%</div>
                <div className="stat-label">正确率</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><FaChartLine /></div>
              <div className="stat-content">
                <div className="stat-value">0</div>
                <div className="stat-label">已掌握知识点</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><FaChartLine /></div>
              <div className="stat-content">
                <div className="stat-value">0</div>
                <div className="stat-label">错题数</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 学习模式选择 */}
      <section className="modes-section">
        <h2 className="section-title">学习模式</h2>
        <div className="study-modes">
          {studyModes.map((mode) => (
            <div key={mode.id} className="mode-card study-mode-card">
              <div className="mode-icon" style={{ backgroundColor: mode.color }}>
                {mode.icon}
              </div>
              <h3>{mode.title}</h3>
              <p>{mode.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 学科分类 */}
      <section className="subjects-section">
        <h2 className="section-title">选择学科</h2>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : subjects.length === 0 ? (
          <div className="empty-state">
            <p>暂无学科数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {subjects.map((subject) => (
              <Link
                key={subject.id || subject._id}
                to={`/category/${subject.id || subject._id}`}
                className="subject-card card"
              >
                <div className="subject-icon">
                  <FaBook />
                </div>
                <h3>{subject.name}</h3>
                <p>{subject.description || '点击进入学习'}</p>
                <div className="subject-action">
                  <span>开始学习</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
