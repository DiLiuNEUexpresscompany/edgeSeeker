import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import MultiPageNewsStreamComponent from '../components/NewsStream';

// 定义进场/出场动画关键帧
const variants = {
  enter: {
    opacity: 0,
    x: 50,    // 从右侧进入
  },
  center: {
    opacity: 1,
    x: 0,     // 居中显示
  },
  exit: {
    opacity: 0,
    x: -50,   // 向左侧退出
  },
};

const HomePage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 从后端获取新闻数据
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        // 请替换为你实际的 API 地址
        const res = await axios.get('http://localhost:5000/api/news');
        setNews(res.data); // 假设返回的是新闻数组
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // 轮播定时器：如果新闻超过一条，每隔8秒切换下一条
  useEffect(() => {
    if (news.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % news.length);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [news]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  const currentNews = news[currentIndex] || {};

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full overflow-hidden">
      {/* 左侧区域 */}
      <div className="md:w-1/2 flex items-center justify-start p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6 }}
            className="max-w-xl space-y-4"
          >
            <h1 className="text-lg md:text-xl text-red-500 italic">
              {currentNews.summary || 'No summary'}
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold text-red-500 leading-tight">
              {currentNews.title || 'No Title'}
            </h2>
            <p className="text-gray-700">
              {currentNews.content
                ? currentNews.content.length > 100
                  ? currentNews.content.slice(0, 100) + '...'
                  : currentNews.content
                : 'No content available.'}
            </p>
            <button className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors">
              Discover More
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 右侧区域 */}
      <div className="md:w-1/2 flex items-start justify-center p-6">
        <MultiPageNewsStreamComponent />
      </div>
    </div>
  );
};

export default HomePage;
