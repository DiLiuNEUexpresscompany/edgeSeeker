import React, { useState, useEffect, useRef } from 'react';

const NewsCarousel = ({ 
  news = [], 
  autoplaySpeed = 6000, 
  showProgress = true,
  showControls = true,
  renderItem = null
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // 使用useRef存储状态以避免闭包问题
  const isPausedRef = useRef(isPaused);
  const activeIndexRef = useRef(activeIndex);
  const progressRef = useRef(null);
  const autoplayRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // 更新ref值以反映最新状态
  useEffect(() => {
    isPausedRef.current = isPaused;
    activeIndexRef.current = activeIndex;
  }, [isPaused, activeIndex]);
  
  // 清理所有定时器的函数
  const clearAllTimers = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // 启动自动播放和进度条
  const startAutoplay = () => {
    if (news.length <= 1 || isPausedRef.current) return;
    
    // 确保先清除现有定时器
    clearAllTimers();
    
    const intervalTime = autoplaySpeed;
    const updateInterval = intervalTime / 100;
    
    // 保存当前进度值，用于计算剩余时间
    const currentProgress = progress;
    const remainingTime = ((100 - currentProgress) / 100) * intervalTime;
    
    // 进度条动画 - 从当前进度继续
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 100 / (intervalTime / updateInterval);
      });
    }, updateInterval);
    
    // 自动播放 - 根据剩余时间设置
    autoplayRef.current = setTimeout(() => {
      if (!isPausedRef.current) {
        const nextIndex = (activeIndexRef.current + 1) % news.length;
        handleSlideChange(nextIndex);
      }
    }, remainingTime || intervalTime); // 如果没有剩余时间，使用完整时间
  };

  // 自动播放初始化和清理
  useEffect(() => {
    if (news.length <= 1) return;
    
    startAutoplay();
    
    return () => clearAllTimers();
  }, [news.length]); // 仅在新闻数据变化时重新设置
  
  // 暂停状态变化时的处理
  useEffect(() => {
    if (news.length <= 1) return;
    
    if (isPaused) {
      // 暂停时保存当前进度
      clearAllTimers();
      // 不重置进度，保持当前进度
    } else {
      // 恢复时从当前进度继续
      startAutoplay();
    }
  }, [isPaused]);
  
  // 处理幻灯片切换
  const handleSlideChange = (newIndex) => {
    if (transitioning || newIndex === activeIndex || newIndex >= news.length) return;
    
    setTransitioning(true);
    clearAllTimers();
    
    // 重置进度条，但仅在切换幻灯片时
    setProgress(0);
    
    // 延迟切换幻灯片
    timeoutRef.current = setTimeout(() => {
      setActiveIndex(newIndex);
      setTransitioning(false);
      
      if (!isPausedRef.current) {
        startAutoplay();
      }
    }, 300);
  };

  // 下一张和上一张
  const nextSlide = () => handleSlideChange((activeIndex + 1) % news.length);
  const prevSlide = () => handleSlideChange((activeIndex - 1 + news.length) % news.length);

  // 获取分类徽章颜色
  const getCategoryColor = (category) => {
    const colors = {
      '美西方': 'bg-purple-600',
      '俄乌': 'bg-blue-600',
      '中东': 'bg-violet-600',
      '亚太': 'bg-pink-600',
      'default': 'bg-accent-purple'
    };
    return colors[category] || colors.default;
  };

  // 新闻项默认渲染函数
  const defaultRenderItem = (item) => (
    <div className="flex flex-col md:flex-row h-[360px]">
      {/* 图片部分 - 固定高度并裁切 */}
      {item.image && (
        <div className="w-full md:w-1/2 h-[240px] md:h-full relative overflow-hidden">
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-full h-full object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r md:from-black/40 md:to-transparent"></div>
        </div>
      )}
      
      {/* 内容部分 */}
      <div className={`p-6 md:p-8 flex flex-col ${item.image ? 'w-full md:w-1/2' : 'w-full'} overflow-y-auto max-h-[360px]`}>
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-xs font-semibold py-1 px-3 rounded-full text-white ${getCategoryColor(item.category_name)}`}>
            {item.category_name}
          </span>
          <span className="text-gray-400 text-sm">
            {item.published_at}
          </span>
        </div>
        
        <h2 className="text-2xl font-bold mb-4 leading-tight text-accent-midnight">
          {item.title}
        </h2>
        
        <p className="text-gray-600 mb-6 flex-grow line-clamp-3">
          {item.summary}
        </p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm text-gray-500">作者: {item.author}</span>
          <a href={`/news/${item.id}`} className="inline-flex items-center gap-1.5 text-primary-DEFAULT font-medium text-sm group">
            <span>阅读更多</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );

  // 空状态
  if (!Array.isArray(news) || news.length === 0) {
    return (
      <div className="bg-accent-midnight/5 rounded-xl p-8 text-center border border-accent-midnight/10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-accent-midnight/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p className="text-lg font-medium text-accent-midnight">暂无新闻</p>
      </div>
    );
  }

  // 添加防抖处理鼠标事件
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsPaused(true), 100);
  };
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsPaused(false), 100);
  };

  return (
    <div 
      className="relative overflow-hidden rounded-2xl shadow-md bg-white h-[360px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 进度条 */}
      {showProgress && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 z-10">
          <div 
            className={`h-full bg-primary-light ${isPaused ? 'transition-none' : 'transition-all duration-300 ease-linear'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* 新闻内容 */}
      <div 
        className={`transition-opacity duration-300 ease-in-out h-full ${transitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        {news[activeIndex] && (renderItem ? renderItem(news[activeIndex], activeIndex) : defaultRenderItem(news[activeIndex]))}
      </div>

      {/* 导航箭头 */}
      {showControls && news.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-accent-midnight hover:text-primary-light z-10 transition-all hover:scale-110"
            aria-label="上一张"
            disabled={transitioning}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={nextSlide}
            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-accent-midnight hover:text-primary-light z-10 transition-all hover:scale-110"
            aria-label="下一张"
            disabled={transitioning}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* 点导航 */}
      {news.length > 1 && (
        <div className="flex justify-center mt-6 mb-4 space-x-2 absolute bottom-0 left-0 right-0">
           {news.map((_, index) => (
            <button
                key={index}
                onClick={() => handleSlideChange(index)}
                style={{
                transition: "all 300ms ease-out",
                width: activeIndex === index ? '32px' : '8px',
                height: '8px',
                backgroundColor: activeIndex === index ? '#db2777' : '#d1d5db',
                borderRadius: '9999px'
                }}
                onMouseEnter={(e) => {
                if (activeIndex !== index) {
                    e.currentTarget.style.backgroundColor = '#9ca3af'; // Hover color (gray-400)
                }
                }}
                onMouseLeave={(e) => {
                if (activeIndex !== index) {
                    e.currentTarget.style.backgroundColor = '#d1d5db'; // Default color (gray-300)
                }
                }}
                aria-label={`跳转到第${index + 1}张`}
                disabled={transitioning}
            />
            ))}
        </div>
      )}
    </div>
  );
};

export default NewsCarousel;