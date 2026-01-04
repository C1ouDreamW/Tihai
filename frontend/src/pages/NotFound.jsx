import React from 'react';

import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">
          <FaExclamationTriangle />
        </div>
        <h1>404 - 页面未找到</h1>
        <p>抱歉，您访问的页面不存在或已被删除</p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            <FaHome /> 返回首页
          </Link>
        </div>
      </div>
      
      {/* 样式 */}
      <style jsx>{`
        .not-found-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
          background-color: #f5f7fa;
        }

        .not-found-content {
          text-align: center;
          padding: 40px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 100%;
        }

        .not-found-icon {
          font-size: 4rem;
          color: #ffc107;
          margin-bottom: 24px;
        }

        .not-found-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 16px;
        }

        .not-found-content p {
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .not-found-actions {
          display: flex;
          justify-content: center;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .not-found-content {
            padding: 24px;
            margin: 20px;
          }

          .not-found-icon {
            font-size: 3rem;
          }

          .not-found-content h1 {
            font-size: 2rem;
          }

          .not-found-content p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
