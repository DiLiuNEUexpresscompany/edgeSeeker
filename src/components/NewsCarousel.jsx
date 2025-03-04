import React, { useState, useRef } from 'react';
// 导入 Swiper 核心组件和模块
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';

// 导入 Swiper 样式
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const NewsHeroCarousel = ({ 
  news = [], 
  autoplaySpeed = 6000
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const swiperRef = useRef(null);
  
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
  
  // 空状态
  if (!Array.isArray(news) || news.length === 0) {
    return (
      <div className="bg-accent-midnight/5 rounded-xl p-8 text-center border border-accent-midnight/10 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-accent-midnight/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p className="text-lg font-medium text-accent-midnight">暂无新闻</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl shadow-lg overflow-hidden w-full max-w-screen-xl mx-auto">
      {/* 自定义按钮样式 */}
      <style jsx>{`
        .swiper-button-prev, .swiper-button-next {
          width: 48px;
          height: 48px;
          background-color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          border-radius: 50%;
          box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.2);
          color: #1e293b;
          transition: all 0.3s ease;
        }
        
        .swiper-button-prev:hover, .swiper-button-next:hover {
          transform: scale(1.1);
          color: #db2777;
          background-color: rgba(255, 255, 255, 1);
        }
        
        .swiper-button-prev:after, .swiper-button-next:after {
          font-size: 22px;
          font-weight: bold;
        }
        
        .swiper-pagination {
          bottom: 16px !important;
        }
        
        .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.8);
          opacity: 1;
          transition: all 0.3s ease;
        }
        
        .swiper-pagination-bullet-active {
          width: 32px;
          border-radius: 4px;
          background: #db2777;
        }
      `}</style>
      
      <div 
        onMouseEnter={() => {
          setIsHovered(true);
          if (swiperRef.current && swiperRef.current.autoplay) {
            swiperRef.current.autoplay.stop();
          }
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          if (swiperRef.current && swiperRef.current.autoplay) {
            swiperRef.current.autoplay.start();
          }
        }}
        className="w-full"
      >
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{
            delay: autoplaySpeed,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          pagination={{
            clickable: true,
            type: 'bullets',
            bulletActiveClass: 'swiper-pagination-bullet-active',
            bulletClass: 'swiper-pagination-bullet'
          }}
          navigation={true}
          className="w-full hero-swiper"
        >
          {news.map((item, index) => (
            <SwiperSlide key={index} className="w-full">
              <div className="relative w-full md:aspect-[21/9] min-h-[480px]">
                {/* 图片背景 */}
                {item.image && (
                  <div className="absolute inset-0 w-full h-full">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
                  </div>
                )}
                
                {/* 内容区 */}
                <div className="relative z-10 flex flex-col justify-center h-full w-full max-w-screen-lg mx-auto px-6 md:px-12 py-12 md:py-20">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-sm font-semibold py-1 px-4 rounded-full text-white ${getCategoryColor(item.category_name)}`}>
                        {item.category_name}
                      </span>
                      <span className="text-gray-300 text-sm">
                        {item.published_at}
                      </span>
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white leading-tight">
                      {item.title}
                    </h1>
                    
                    <p className="text-gray-200 text-lg mb-8 max-w-xl leading-relaxed">
                      {item.summary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-medium">作者: {item.author}</span>
                      <a 
                        href={`/news/${item.id}`} 
                        className="inline-flex items-center gap-2 bg-primary-DEFAULT hover:bg-primary-dark text-white font-medium px-5 py-3 rounded-lg transition-all group"
                      >
                        <span>阅读更多</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* 添加自定义进度条 */}
      {isHovered ? null : (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200/30 z-10 swiper-progress-bar">
          <style jsx>{`
            .swiper-progress-bar::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              height: 100%;
              width: 100%;
              background-color: #db2777;
              transform-origin: left center;
              animation: progress ${autoplaySpeed}ms linear infinite;
            }
            @keyframes progress {
              0% {
                transform: scaleX(0);
              }
              100% {
                transform: scaleX(1);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default NewsHeroCarousel;