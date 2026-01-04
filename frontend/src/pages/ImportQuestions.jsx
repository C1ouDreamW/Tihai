import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionAPI } from '../services/api';
import { FaUpload, FaFileExcel, FaFileCode, FaCheck, FaTimes } from 'react-icons/fa';

const ImportQuestions = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importedCount, setImportedCount] = useState(0);

  // 检查用户是否为管理员
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user?.isAdmin) {
    navigate('/');
    return null;
  }

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 检查文件类型
      const allowedTypes = ['application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!allowedTypes.includes(file.type)) {
        setError('只支持 JSON 和 Excel 文件');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('请选择要导入的文件');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', selectedFile);

      // 调用导入API
      const response = await questionAPI.importQuestions(formData);
      
      setSuccess(response.message);
      setImportedCount(response.questions.length);
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
    } catch (err) {
      setError(err.response?.data?.message || '导入失败，请检查文件格式');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-container">
      <h1>导入题库</h1>
      
      <div className="import-card">
        <h2>上传题库文件</h2>
        
        {error && (
          <div className="alert alert-danger">
            <FaTimes /> {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <FaCheck /> {success}
            {importedCount > 0 && (
              <p className="imported-count">成功导入 {importedCount} 道题目</p>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="import-form">
          <div className="form-group">
            <label htmlFor="fileInput" className="form-label">
              选择文件
            </label>
            <div className="file-upload-area">
              <input
                type="file"
                id="fileInput"
                className="file-input"
                accept=".json,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
              />
              <div className="file-upload-content">
                <FaUpload size={48} className="upload-icon" />
                <p>点击或拖拽文件到此处</p>
                <p className="file-types">支持 JSON 和 Excel 文件</p>
                {selectedFile && (
                  <div className="selected-file">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <h3>文件格式说明</h3>
            <div className="format-examples">
              <div className="format-item">
                <h4><FaFileCode /> JSON 格式</h4>
                <pre>
{`{
  "questions": [
    {
      "content": "题目内容",
      "type": "single_choice",
      "options": [
        {"text": "选项A", "isCorrect": false},
        {"text": "选项B", "isCorrect": true}
      ],
      "correctAnswer": ["B"],
      "explanation": "解析",
      "categories": [],
      "difficulty": "medium"
    }
  ]
}`}
                </pre>
              </div>
              
              <div className="format-item">
                <h4><FaFileExcel /> Excel 格式</h4>
                <ul>
                  <li>列名：content, type, optionA, optionB, optionC, optionD, correctAnswer, explanation, categories, difficulty</li>
                  <li>type 值：single_choice, multiple_choice, true_false</li>
                  <li>correctAnswer：单个选项（如A）或多个选项（如A,B）</li>
                  <li>categories：多个分类用逗号分隔</li>
                  <li>difficulty 值：easy, medium, hard</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedFile}
            >
              {loading ? '导入中...' : '开始导入'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              返回首页
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportQuestions;