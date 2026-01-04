import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import { FaBook, FaChevronRight, FaRandom, FaList, FaBookmark } from 'react-icons/fa';

const Category = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  // 获取分类详情和子分类
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        // 获取分类详情
        const categoryData = await categoryAPI.getById(id);
        setCategory(categoryData);

        // 获取子分类
        const childrenData = await categoryAPI.getChildren(id);
        setChildren(childrenData);
      } catch (err) {
        setError('获取分类数据失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [id]);

  // 切换展开/折叠状态
  const toggleExpand = (childId) => {
    setExpanded(prev => ({
      ...prev,
      [childId]: !prev[childId]
    }));
  };

  // 渲染分类列表
  const renderCategoryList = (items, level = 0) => {
    if (items.length === 0) return null;

    return (
      <ul className={`category-list level-${level}`}>
        {items.map(item => (
          <li key={item._id} className="category-item">
            <div className="category-header">
              <div
                className="category-info"
                onClick={() => item.type !== 'knowledge_point' && toggleExpand(item._id)}
              >
                <span className="category-icon">
                  {item.type === 'chapter' ? <FaBook /> : <FaBookmark />}
                </span>
                <span className="category-name">{item.name}</span>
                {item.type !== 'knowledge_point' && (
                  <span className={`expand-icon ${expanded[item._id] ? 'expanded' : ''}`}>
                    <FaChevronRight />
                  </span>
                )}
              </div>

              {/* 学习按钮 */}
              <div className="category-actions">
                {item.type === 'knowledge_point' && (
                  <>
                    <Link
                      to={`/study/sequential/${item._id}`}
                      className="btn btn-sm btn-primary"
                      title="顺序刷题"
                    >
                      <FaList />
                    </Link>
                    <Link
                      to={`/study/random/${item._id}`}
                      className="btn btn-sm btn-success"
                      title="随机刷题"
                    >
                      <FaRandom />
                    </Link>
                    <Link
                      to={`/card/${item._id}`}
                      className="btn btn-sm btn-warning"
                      title="背题模式"
                    >
                      <FaBookmark />
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* 递归渲染子分类 */}
            {item.type !== 'knowledge_point' && expanded[item._id] && (
              <div className="category-children">
                {renderCategoryList(item.children || [], level + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="category-container fade-in">
      {loading ? (
        <div className="loading">加载中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : category ? (
        <>
          {/* 页面标题 */}
          <div className="mb-lg">
            <h1>{category.name}</h1>
            {category.description && <p className="text-secondary">{category.description}</p>}
          </div>

          {/* 分类树 */}
          <div className="category-tree card mb-lg">
            {children.length > 0 ? (
              renderCategoryList(children)
            ) : (
              <div className="empty-state">
                <p>暂无子分类</p>
              </div>
            )}
          </div>

          {/* 快捷学习入口 */}
          <div className="quick-start card">
            <h2 className="card-title">快捷学习</h2>
            <div className="quick-actions">
              <Link
                to={`/study/sequential/${id}`}
                className="btn btn-primary"
              >
                <FaList /> 顺序刷题
              </Link>
              <Link
                to={`/study/random/${id}`}
                className="btn btn-success"
              >
                <FaRandom /> 随机刷题
              </Link>
              <Link
                to={`/card/${id}`}
                className="btn btn-warning"
              >
                <FaBookmark /> 背题模式
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="error">分类不存在</div>
      )}
    </div>
  );
};

export default Category;
