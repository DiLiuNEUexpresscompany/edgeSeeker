import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// 定义进场/出场动画的关键帧
const variants = {
  enter: {
    opacity: 0,
    x: 50,    // 从右侧滑入
  },
  center: {
    opacity: 1,
    x: 0,     // 最终居中
  },
  exit: {
    opacity: 0,
    x: -50,   // 向左侧滑出
  },
};

const HomePage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 轮播当前索引
  const [currentIndex, setCurrentIndex] = useState(0);

  // 从后端获取新闻数据
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        // 替换成你实际的后端地址
        const res = await axios.get('http://localhost:5000/api/news');
        setNews(res.data); // 假设后端返回一个新闻数组
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // 轮播定时器：如果有多条新闻，每隔3秒切换下一条
  useEffect(() => {
    if (news.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % news.length);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [news]);

  // 如果还在加载中，显示一个简单提示
  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  // 如果请求出错，显示错误信息
  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  // 当前要显示的新闻
  const currentNews = news[currentIndex] || {};

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* 装饰性的 swirl（可选） */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-10 text-red-400 z-0 pointer-events-none">
        <svg
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          className="w-full h-full"
        >
          <path d="M50,100 C150,20 250,20 350,100 C250,180 150,180 50,100 Z" strokeWidth="1" />
          <path d="M50,200 C150,120 250,120 350,200 C250,280 150,280 50,200 Z" strokeWidth="1" />
          <path d="M50,300 C150,220 250,220 350,300 C250,380 150,380 50,300 Z" strokeWidth="1" />
        </svg>
      </div>

      {/* 左下角文字内容：使用 AnimatePresence 包裹，实现进出场动画 */}
      <div className="absolute bottom-48 z-10">
        <AnimatePresence mode="wait">
          {/* 给每个索引一个唯一 key，切换时会触发退出/进入动画 */}
          <motion.div
            key={currentIndex}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6 }}  // 动画时长(秒)，可自行调整
            className="max-w-xl"
          >
            {/* 显示当前新闻标题 */}
            <h1 className="text-lg text-red-500 italic mb-0">
              {currentNews.summary || 'No summary'}
            </h1>
            <h1 className="text-6xl font-bold text-red-500 leading-none mb-4">
              {currentNews.title || 'No Title'}
            </h1>
            
            {/* 显示当前新闻摘要 */}
            <p className="text-gray-700 mb-6">
          {currentNews.content
            ? currentNews.content.length > 100
              ? currentNews.content.slice(0, 100) + '...'
              : currentNews.content
            : 'No content available.'
          }
        </p>
            
            <button className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors">
              Discover More
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 如果需要在背后放背景图，可以在这里加一个绝对定位的 <img> */}
      {/*
      <div className="absolute inset-0 z-[-1]">
        <img
          src="/api/placeholder/1200/800"
          alt="background"
          className="w-full h-full object-cover opacity-50"
        />
      </div>
      */}
    </div>
  );
};

export default HomePage;
