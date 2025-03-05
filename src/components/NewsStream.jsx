import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, RefreshCw, TrendingUp, Bitcoin, ChevronLeft, ChevronRight } from 'lucide-react';

// 模拟新闻数据生成函数
const generateMockNewsStream = () => {
  return [
    {
      id: 1,
      title: "实时突发：国际关系",
      source: "BBC",
      timestamp: "01:04:53",
      duration: 11,
      content: "最新消息正在持续更新中...",
      category: "国际",
      image: "/api/placeholder/400/200"
    }
  ];
};

// 模拟美股数据
const mockStockData = [
  { symbol: "AAPL", name: "苹果", price: 182.45, change: 1.23 },
  { symbol: "GOOGL", name: "谷歌", price: 125.67, change: -0.45 },
  { symbol: "MSFT", name: "微软", price: 335.22, change: 0.89 }
];

// 模拟加密货币数据
const mockCryptoData = [
  { symbol: "BTC", name: "比特币", price: 51234.56, change: 1.23 },
  { symbol: "ETH", name: "以太坊", price: 2876.44, change: 0.45 },
  { symbol: "BNB", name: "币安币", price: 312.22, change: -0.89 }
];

// 新闻项目组件
const NewsItem = React.memo(({ news, index, isLoading }) => {
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
            <span className="text-sm font-medium text-gray-700">{news.source}</span>
            <span className="text-xs text-gray-500">{news.timestamp}</span>
          </div>
          <span className="text-xs text-gray-500">{news.duration}分钟</span>
        </div>
        {news.image && (
          <motion.div 
            className="mb-3 rounded-lg overflow-hidden"
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
          >
            <img 
              src={news.image} 
              alt={news.title} 
              className="w-full h-48 object-cover"
            />
          </motion.div>
        )}
        <h3 className="font-semibold text-base mb-1">{news.title}</h3>
        <p className="text-sm text-gray-600">{news.content}</p>
      </motion.div>
    </motion.div>
  );
});

const MultiPageNewsStreamComponent = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [newsStream, setNewsStream] = useState(generateMockNewsStream());
  const [stocks] = useState(mockStockData);
  const [cryptos] = useState(mockCryptoData);
  const [isLoading, setIsLoading] = useState(false);

  // 页面配置
  const pages = [
    {
      title: "实时新闻",
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

  // 模拟实时新闻流
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLoading(true);
      
      const newNews = {
        id: Date.now(),
        title: "实时突发：" + ["全球经济", "科技创新", "国际关系"][Math.floor(Math.random() * 3)],
        source: ["路透社", "新华社", "BBC"][Math.floor(Math.random() * 3)],
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        duration: Math.floor(Math.random() * 30) + 5,
        content: "最新消息正在持续更新中...",
        category: ["政治", "经济", "科技"][Math.floor(Math.random() * 3)],
        image: "/api/placeholder/400/200"
      };
      
      setTimeout(() => {
        setNewsStream(prev => [newNews, ...prev].slice(0, 5));
        setIsLoading(false);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // 切换页面
  const handlePageChange = (direction) => {
    const newPage = (currentPage + direction + pages.length) % pages.length;
    setCurrentPage(newPage);
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
            {currentPageData.content.map((news, index) => (
              <NewsItem 
                key={news.id}
                news={news} 
                index={index} 
                isLoading={isLoading}
              />
            ))}
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
          className="p-3 rounded-lg bg-white border flex justify-between items-center mb-3"
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
      className="flex flex-col h-[700px] w-full max-w-xl mx-auto bg-white rounded-xl shadow-lg border"
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
        <RefreshCw className="text-gray-500 cursor-pointer hover:text-blue-500" />
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
            />
          ))}
        </div>
        <ChevronRight 
          className="cursor-pointer text-gray-500 hover:text-blue-500" 
          onClick={() => handlePageChange(1)}
        />
      </motion.div>

      {/* 内容区域 */}
      <motion.div 
        className="flex-1 overflow-y-auto relative"
        initial={false}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {renderPageContent()}
      </motion.div>
    </motion.div>
  );
};

export default MultiPageNewsStreamComponent;