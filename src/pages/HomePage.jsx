import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsCarousel from '../components/NewsCarousel';

const HomePage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch news data
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/news');
        const newsData = Array.isArray(response.data) ? response.data : [];
        setNews(newsData);
      } catch (error) {
        console.error('Error fetching news:', error);
        setError(error.message);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary-light border-t-transparent animate-spin-clockwise"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-accent-purple border-b-transparent animate-spin-counterclockwise"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-8 bg-red-50 rounded-xl p-6 border-l-4 border-primary-light shadow-sm">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-light mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-medium text-primary-dark">加载失败: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      {/* Header with accent lines */}
      <div className="relative mb-10 flex items-center">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-primary-light rounded-full"></div>
        <h1 className="text-3xl font-bold ml-6 text-accent-midnight flex items-center">
          最新新闻
          <span className="ml-3 text-sm font-normal text-gray-400">每日更新</span>
        </h1>
        <div className="ml-4 h-px flex-grow bg-gradient-to-r from-primary-light/50 to-transparent"></div>
      </div>

      {/* News Carousel */}
      <NewsCarousel 
        news={news} 
        autoplaySpeed={6000} 
        showProgress={true}
        showControls={true}
      />
    </div>
  );
};

export default HomePage;