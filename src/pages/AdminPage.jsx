import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    image: null,
    tags: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Authentication form state
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  
  const categories = [
    { id: 'western', name: '美西方' },
    { id: 'russia-ukraine', name: '俄乌' },
    { id: 'middle-east', name: '中东' },
    { id: 'asia-pacific', name: '亚太' },
    { id: 'others', name: '其他' }
  ];
  
  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      fetchNews();
    }
  }, []);
  
  const fetchNews = async () => {
    try {
      const response = await axios.get('/api/admin/news', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('获取新闻列表失败');
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/auth/login', credentials);
      localStorage.setItem('authToken', response.data.token);
      setIsAuthenticated(true);
      fetchNews();
    } catch (error) {
      setError('登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e) => {
    setFormData(prev => ({ ...prev, image: e.target.files[0] }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    const formDataToSend = new FormData();
    for (const key in formData) {
      if (key === 'tags') {
        formDataToSend.append(key, formData[key].split(',').map(tag => tag.trim()));
      } else if (key === 'image' && formData[key]) {
        formDataToSend.append(key, formData[key]);
      } else {
        formDataToSend.append(key, formData[key]);
      }
    }
    
    try {
      if (editingId) {
        await axios.put(`/api/admin/news/${editingId}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        setSuccess('新闻更新成功！');
      } else {
        await axios.post('/api/admin/news', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        setSuccess('新闻创建成功！');
      }
      
      // Reset form and refresh news list
      setFormData({
        title: '',
        summary: '',
        content: '',
        category: '',
        image: null,
        tags: ''
      });
      setEditingId(null);
      fetchNews();
    } catch (error) {
      setError('保存失败，请检查表单数据');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      summary: item.summary,
      content: item.content,
      category: item.category,
      tags: (item.tags || []).join(', '),
      image: null // Can't pre-populate the file input
    });
    setEditingId(item.id);
    // Scroll to form
    document.getElementById('newsForm').scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这条新闻吗？')) return;
    
    try {
      await axios.delete(`/api/admin/news/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setSuccess('新闻删除成功！');
      fetchNews();
    } catch (error) {
      setError('删除失败');
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">新闻管理登录</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 border rounded-lg"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:bg-purple-400"
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">新闻管理系统</h2>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          退出登录
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8" id="newsForm">
        <h3 className="text-xl font-bold mb-4">
          {editingId ? '编辑新闻' : '创建新闻'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="title">
                标题 *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="category">
                分类 *
              </label>
              <select
                id="category"
                name="category"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">选择分类</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="summary">
              摘要 *
            </label>
            <textarea
              id="summary"
              name="summary"
              rows="2"
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.summary}
              onChange={handleInputChange}
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="content">
              内容 *
            </label>
            <textarea
              id="content"
              name="content"
              rows="8"
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.content}
              onChange={handleInputChange}
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="image">
              图片
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="w-full px-3 py-2 border rounded-lg"
              onChange={handleImageChange}
            />
            {editingId && !formData.image && (
              <p className="text-sm text-gray-500 mt-1">留空则保持原图片不变</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="tags">
              标签 (用逗号分隔)
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="例如: 政治, 经济, 国际"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400"
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : (editingId ? '更新新闻' : '发布新闻')}
            </button>
            
            {editingId && (
              <button
                type="button"
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                onClick={() => {
                  setFormData({
                    title: '',
                    summary: '',
                    content: '',
                    category: '',
                    image: null,
                    tags: ''
                  });
                  setEditingId(null);
                }}
              >
                取消编辑
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">新闻列表</h3>
        
        {news.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">标题</th>
                  <th className="px-4 py-2 text-left">分类</th>
                  <th className="px-4 py-2 text-left">发布时间</th>
                  <th className="px-4 py-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {news.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{item.title}</td>
                    <td className="px-4 py-3">
                      {categories.find(c => c.id === item.category)?.name || item.category}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(item.published_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-4">暂无新闻</p>
        )}
      </div>
    </div>
  );
};

export default AdminPage;