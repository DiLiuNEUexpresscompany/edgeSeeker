import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const NewsDetailPage = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        const response = await axios.get(`/api/news/${id}`);
        setNews(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching news detail:', error);
        setLoading(false);
      }
    };
    
    fetchNewsDetail();
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }
  
  if (!news) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-500">新闻未找到</h2>
        <p className="mt-4">请返回首页查看其他新闻</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {news.image && (
        <img 
          src={news.image} 
          alt={news.title} 
          className="w-full h-64 object-cover"
        />
      )}
      
      <div className="p-6">
        <div className="flex items-center mb-4">
          <span className="text-sm font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
            {news.category_name}
          </span>
          <span className="ml-2 text-gray-500 text-sm">
            {dayjs(news.published_at).format('YYYY-MM-DD HH:mm')}
          </span>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-gray-800">{news.title}</h1>
        
        <div className="flex items-center mb-6">
          <img 
            src={news.author_avatar || "https://via.placeholder.com/40"} 
            alt={news.author} 
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <p className="font-medium text-gray-800">{news.author}</p>
            <p className="text-sm text-gray-500">ID: {news.author_id || '新闻编辑'}</p>
          </div>
        </div>
        
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-bold mb-4">标签</h3>
          <div className="flex flex-wrap gap-2">
            {news.tags && news.tags.map(tag => (
              <span 
                key={tag} 
                className="px-3 py-1 bg-gray-200 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;