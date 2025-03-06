import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  RefreshCw, 
  TrendingUp, 
  Bitcoin, 
  ChevronLeft, 
  ChevronRight,
  ArrowUp,
  Clock
} from 'lucide-react';

// 模拟美股数据
const mockStockData = [
  { symbol: "AAPL", name: "苹果", price: 182.45, change: 1.23, url: "https://finance.yahoo.com/quote/AAPL" },
  { symbol: "GOOGL", name: "谷歌", price: 125.67, change: -0.45, url: "https://finance.yahoo.com/quote/GOOGL" },
  { symbol: "MSFT", name: "微软", price: 335.22, change: 0.89, url: "https://finance.yahoo.com/quote/MSFT" }
];

// 模拟加密货币数据
const mockCryptoData = [
  { symbol: "BTC", name: "比特币", price: 51234.56, change: 1.23, url: "https://coinmarketcap.com/currencies/bitcoin/" },
  { symbol: "ETH", name: "以太坊", price: 2876.44, change: 0.45, url: "https://coinmarketcap.com/currencies/ethereum/" },
  { symbol: "BNB", name: "币安币", price: 312.22, change: -0.89, url: "https://coinmarketcap.com/currencies/bnb/" }
];

// 新闻项目组件
const NewsItem = React.memo(({ news, index, isLoading }) => {
  // 添加时间标签颜色逻辑
  const getTimeTagColor = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // 根据时间间隔返回不同颜色
    if (diffHours < 1) {
      return "bg-red-100 text-red-800"; // 1小时内 - 红色
    } else if (diffHours < 3) {
      return "bg-orange-100 text-orange-800"; // 3小时内 - 橙色
    } else if (diffHours < 12) {
      return "bg-blue-100 text-blue-800"; // 12小时内 - 蓝色
    } else {
      return "bg-gray-100 text-gray-800"; // 更久 - 灰色
    }
  };
  // 格式化日期，显示相对时间
  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // 显示相对时间
    if (diffMins < 1) {
      return "刚刚";
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      // 超过一周显示具体日期时间
      return date.toLocaleString('zh-CN', { 
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
    }
  };

  // 计算实际阅读时间（更准确的估计）
  const calculateDuration = (title, content = "") => {
    // 平均阅读速度：中文约为每分钟300字
    const wordsPerMinute = 300;
    
    // 计算内容总字数（标题+正文）
    const totalWords = (title || "").length + (content || "").length;
    
    // 如果有图片，加上观看图片的时间（约15秒）
    const imageTime = news.image ? 0.25 : 0;
    
    // 计算实际阅读时间（分钟），最少1分钟
    const readingTime = Math.max(1, Math.ceil(totalWords / wordsPerMinute + imageTime));
    
    return readingTime;
  };

  return (
    <motion.div
      layout
      initial={{ 
        opacity: 0, 
        y: -50,
        scale: 0.95
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: index * 0.1
        }
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        transition: { 
          duration: 0.3 
        }
      }}
      className={`
        relative pl-12 pr-4 py-4 
        transition-all duration-500 
        ${isLoading && index === 0 ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
      `}
    >
      {/* 时间点 */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          transition: { 
            type: "spring", 
            stiffness: 300, 
            damping: 15 
          }
        }}
        className={`
          absolute left-4.5 top-6 w-4 h-4 rounded-full 
          ${index === 0 ? 'bg-blue-500' : 'bg-blue-200'}
          transform -translate-x-1/2 -translate-y-1/2
        `}
      ></motion.div>

      {/* 新闻卡片 */}
      <motion.div 
        className="bg-white border rounded-lg p-3 shadow-sm"
        initial={{ opacity: 0, x: -20 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          transition: { 
            type: "spring", 
            stiffness: 200, 
            damping: 20 
          }
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">{news.website}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getTimeTagColor(news.date)}`}>
              {formatTimestamp(news.date)}
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock size={12} className="mr-1" />
            {calculateDuration(news.title)}分钟
          </div>
        </div>
        {news.image && (
          <motion.div 
            className="mb-3 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { 
                type: "spring", 
                stiffness: 200, 
                damping: 20 
              }
            }}
            onClick={() => window.open(news.url, '_blank')}
          >
            <img 
              src={news.image} 
              alt={news.title} 
              className="w-full h-48 object-cover"
            />
          </motion.div>
        )}
        <h3 
          className="font-semibold text-base mb-1 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => window.open(news.url, '_blank')}
        >
          {news.title}
        </h3>
        <p className="text-sm text-gray-600">{news.category}</p>
      </motion.div>
    </motion.div>
  );
});

const MultiPageNewsStreamComponent = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [newsStream, setNewsStream] = useState([]);
  const [stocks] = useState(mockStockData);
  const [cryptos] = useState(mockCryptoData);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef(null);

  // 根据时间排序新闻（从近到远）
  const sortNewsByTime = (news) => {
    return [...news].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      // 降序排列，最新的在前面
      return dateB - dateA;
    });
  };

  // 获取CNN新闻数据
  const fetchCNNNews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:5000/api/admin/news/cnn');
      
      if (!response.ok) {
        throw new Error('Failed to fetch news data');
      }
      
      const data = await response.json();
      // 确保每条新闻都有URL，并按时间排序
      const newsWithUrl = data.map(news => ({
        ...news,
        url: news.url || '#' // 如果没有URL，使用#作为占位符
      }));
      
      // 按时间排序后设置到state
      setNewsStream(sortNewsByTime(newsWithUrl));
    } catch (error) {
      console.error('Error fetching CNN news:', error);
      // 为了演示目的，添加一些模拟数据（包含不同的时间）
      const currentTime = new Date();
      const mockNews = [
        {
          title: "全球科技企业加速AI投资，竞争日益激烈",
          website: "CNN",
          date: new Date(currentTime.getTime()).toISOString(), // 当前时间
          category: "科技",
          image: "https://via.placeholder.com/600x400",
          url: "https://www.cnn.com/tech"
        },
        {
          title: "金融市场波动加剧，投资者谨慎观望",
          website: "CNN",
          date: new Date(currentTime.getTime() - 30 * 60 * 1000).toISOString(), // 30分钟前
          category: "金融",
          image: "https://via.placeholder.com/600x400",
          url: "https://www.cnn.com/money"
        },
        {
          title: "气候变化峰会召开，各国承诺减排",
          website: "CNN",
          date: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
          category: "环境",
          image: "https://via.placeholder.com/600x400",
          url: "https://www.cnn.com/climate"
        },
        {
          title: "新冠疫情最新情况：全球疫苗接种率上升",
          website: "CNN",
          date: new Date(currentTime.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5小时前
          category: "健康",
          image: "https://via.placeholder.com/600x400",
          url: "https://www.cnn.com/health"
        }
      ];
      
      // 即使是模拟数据也进行时间排序
      setNewsStream(sortNewsByTime(mockNews));
    } finally {
      setIsLoading(false);
    }
  };

  // 监听滚动事件，显示/隐藏返回顶部按钮
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 200);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 初始加载和定时刷新新闻
  useEffect(() => {
    // 初始加载
    fetchCNNNews();
    
    // 设置定时刷新（每10秒）
    const interval = setInterval(() => {
      fetchCNNNews();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // 页面配置
  const pages = [
    {
      title: "CNN实时新闻",
      icon: Globe,
      content: newsStream
    },
    {
      title: "美股行情",
      icon: TrendingUp,
      content: stocks
    },
    {
      title: "加密货币",
      icon: Bitcoin,
      content: cryptos
    }
  ];

  // 切换页面
  const handlePageChange = (direction) => {
    const newPage = (currentPage + direction + pages.length) % pages.length;
    setCurrentPage(newPage);
    // 切换页面时，滚动到顶部
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  // 手动刷新
  const handleRefresh = () => {
    if (currentPage === 0) {
      fetchCNNNews();
    }
  };

  // 滚动到顶部
  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // 渲染不同页面的内容
  const renderPageContent = () => {
    const currentPageData = pages[currentPage];

    if (currentPage === 0) {
      // 新闻页面
      return (
        <motion.div 
          className="relative"
          initial={false}
          layout
        >
          <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-blue-100"></div>
          {isLoading && (
            <motion.div 
              className="absolute top-0 left-0 right-0 h-1 bg-blue-500"
              initial={{ scaleX: 0 }}
              animate={{ 
                scaleX: 1,
                transition: { 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }
              }}
            />
          )}
          <AnimatePresence>
            {currentPageData.content && currentPageData.content.length > 0 ? (
              currentPageData.content.map((news, index) => (
                <NewsItem 
                  key={news.url || index}
                  news={news} 
                  index={index} 
                  isLoading={isLoading}
                />
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {isLoading ? "加载中..." : "暂无新闻数据"}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    } else {
      // 股票和加密货币页面
      return currentPageData.content.map((item) => (
        <motion.div 
          key={item.symbol} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }
          }}
          className="p-3 rounded-lg bg-white border flex justify-between items-center mb-3 cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={() => window.open(item.url, '_blank')}
        >
          <div>
            <div className="font-bold">{item.name} ({item.symbol})</div>
            <div className="text-sm text-gray-500">
              价格: ${item.price.toLocaleString()}
            </div>
          </div>
          <div className={`font-semibold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {item.change >= 0 ? '+' : ''}{item.change}%
          </div>
        </motion.div>
      ));
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-[700px] w-full max-w-xl mx-auto bg-white rounded-xl shadow-lg border relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }
      }}
    >
      {/* 标题区域 */}
      <motion.div 
        className="p-4 border-b flex justify-between items-center bg-white rounded-t-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring", 
            stiffness: 300, 
            damping: 20 
          }
        }}
      >
        <div className="flex items-center space-x-2">
          {React.createElement(pages[currentPage].icon, { className: "text-blue-500" })}
          <h2 className="text-xl font-bold">{pages[currentPage].title}</h2>
        </div>
        <RefreshCw 
          className="text-gray-500 cursor-pointer hover:text-blue-500" 
          onClick={handleRefresh}
        />
      </motion.div>

      {/* 页面切换控制 */}
      <motion.div 
        className="flex justify-between items-center p-2 border-b bg-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring", 
            stiffness: 300, 
            damping: 20 
          }
        }}
      >
        <ChevronLeft 
          className="cursor-pointer text-gray-500 hover:text-blue-500" 
          onClick={() => handlePageChange(-1)}
        />
        <div className="flex space-x-2">
          {pages.map((_, index) => (
            <motion.div 
              key={index}
              initial={{ scale: 0 }}
              animate={{ 
                scale: currentPage === index ? 1.2 : 1,
                transition: { 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20 
                }
              }}
              className={`h-2 w-2 rounded-full ${currentPage === index ? 'bg-blue-500' : 'bg-gray-300'}`}
              onClick={() => setCurrentPage(index)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
        <ChevronRight 
          className="cursor-pointer text-gray-500 hover:text-blue-500" 
          onClick={() => handlePageChange(1)}
        />
      </motion.div>

      {/* 内容区域 - 使用自定义样式的原生滚动条 */}
      <motion.div 
        className="flex-1 overflow-y-auto relative p-4 pr-6 custom-scrollbar"
        initial={false}
        ref={contentRef}
      >
        <style jsx global>{`
          /* 自定义滚动条样式 */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(229, 231, 235, 0.5);
            border-radius: 10px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.5);
            border-radius: 10px;
            transition: all 0.2s ease;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.8);
          }
          
          /* 添加Firefox的滚动条样式 */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(59, 130, 246, 0.5) rgba(229, 231, 235, 0.5);
          }
        `}</style>
        {renderPageContent()}
      </motion.div>
      
      {/* 返回顶部按钮 */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            className="absolute bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-600 z-10"
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0, 
              y: 10,
              transition: { 
                duration: 0.2 
              }
            }}
            onClick={scrollToTop}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp size={20} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MultiPageNewsStreamComponent;