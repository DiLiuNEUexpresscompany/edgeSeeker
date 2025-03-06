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

// 生成时间戳，从最近到几小时前的随机时间
const generateTimeStamp = (maxHoursBefore = 24) => {
  const now = new Date();
  const randomHours = Math.random() * maxHoursBefore;
  const timestamp = new Date(now.getTime() - randomHours * 60 * 60 * 1000);
  return timestamp.toISOString();
};

// 模拟美股数据 - 添加时间戳和类型标记
const mockStockData = [
  { 
    symbol: "AAPL", 
    name: "苹果", 
    price: 182.45, 
    change: 1.23, 
    url: "https://finance.yahoo.com/quote/AAPL",
    date: generateTimeStamp(8),
    type: "stock",
    category: "科技股"
  },
  { 
    symbol: "GOOGL", 
    name: "谷歌", 
    price: 125.67, 
    change: -0.45, 
    url: "https://finance.yahoo.com/quote/GOOGL",
    date: generateTimeStamp(4),
    type: "stock",
    category: "科技股"
  },
  { 
    symbol: "MSFT", 
    name: "微软", 
    price: 335.22, 
    change: 0.89, 
    url: "https://finance.yahoo.com/quote/MSFT",
    date: generateTimeStamp(12),
    type: "stock",
    category: "科技股"
  }
];

// 模拟加密货币数据 - 添加时间戳和类型标记
const mockCryptoData = [
  { 
    symbol: "BTC", 
    name: "比特币", 
    price: 51234.56, 
    change: 1.23, 
    url: "https://coinmarketcap.com/currencies/bitcoin/",
    date: generateTimeStamp(2),
    type: "crypto",
    category: "加密货币"
  },
  { 
    symbol: "ETH", 
    name: "以太坊", 
    price: 2876.44, 
    change: 0.45, 
    url: "https://coinmarketcap.com/currencies/ethereum/",
    date: generateTimeStamp(6),
    type: "crypto",
    category: "加密货币"
  },
  { 
    symbol: "BNB", 
    name: "币安币", 
    price: 312.22, 
    change: -0.89, 
    url: "https://coinmarketcap.com/currencies/bnb/",
    date: generateTimeStamp(10),
    type: "crypto",
    category: "加密货币"
  }
];

// 通用内容项目组件（处理新闻、股票、加密货币等不同类型）
const ContentItem = React.memo(({ item, index, isLoading }) => {
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
  
  // 获取内容类型图标
  const getTypeIcon = (type) => {
    switch(type) {
      case 'news':
        return <Globe size={16} className="text-blue-500" />;
      case 'stock':
        return <TrendingUp size={16} className="text-green-500" />;
      case 'crypto':
        return <Bitcoin size={16} className="text-orange-500" />;
      default:
        return <Globe size={16} className="text-blue-500" />;
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
    const imageTime = item.image ? 0.25 : 0;
    
    // 计算实际阅读时间（分钟），最少1分钟
    const readingTime = Math.max(1, Math.ceil(totalWords / wordsPerMinute + imageTime));
    
    return readingTime;
  };

  // 渲染内容，根据类型选择不同布局
  const renderContent = () => {
    // 根据内容类型渲染不同的卡片内容
    switch(item.type) {
      case 'stock':
      case 'crypto':
        return (
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold">{item.name} ({item.symbol})</div>
              <div className="text-sm text-gray-500">
                价格: ${item.price.toLocaleString()}
              </div>
            </div>
            <div className={`font-semibold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {item.change >= 0 ? '+' : ''}{item.change}%
            </div>
          </div>
        );
      
      case 'news':
      default:
        return (
          <>
            {item.image && (
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
                onClick={() => window.open(item.url, '_blank')}
              >
                <img 
                  src={item.image} 
                  alt={item.title || item.name} 
                  className="w-full h-48 object-cover"
                />
              </motion.div>
            )}
            <h3 
              className="font-semibold text-base mb-1 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => window.open(item.url, '_blank')}
            >
              {item.title || (item.name + ' ' + item.symbol)}
            </h3>
          </>
        );
    }
  };

  // 计算可读时间（针对不同类型的内容）
  const calculateReadTime = () => {
    if (item.type === 'news') {
      return calculateDuration(item.title);
    } else {
      // 金融类内容阅读时间默认为1分钟
      return 1;
    }
  };

  // 获取来源名称
  const getSourceName = () => {
    if (item.type === 'news') {
      return item.website || '未知来源';
    } else if (item.type === 'stock') {
      return '股票';
    } else if (item.type === 'crypto') {
      return '加密货币';
    } else {
      return '未知类型';
    }
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
      >
        {/* 内容类型图标（仅在时间点内部显示） */}
        <div className="absolute inset-0 flex items-center justify-center">
          {getTypeIcon(item.type)}
        </div>
      </motion.div>

      {/* 内容卡片 */}
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
        onClick={() => window.open(item.url, '_blank')}
        whileHover={{ scale: 1.02 }}
        style={{ cursor: 'pointer' }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">{getSourceName()}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getTimeTagColor(item.date)}`}>
              {formatTimestamp(item.date)}
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock size={12} className="mr-1" />
            {calculateReadTime()}分钟
          </div>
        </div>
        
        {renderContent()}
        
        <p className="text-sm text-gray-600 mt-1">{item.category}</p>
      </motion.div>
    </motion.div>
  );
});

const UnifiedNewsStreamComponent = () => {
  const [allContent, setAllContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef(null);

  // 根据时间排序内容（从近到远）
  const sortContentByTime = (content) => {
    return [...content].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      // 降序排列，最新的在前面
      return dateB - dateA;
    });
  };

  // 获取所有内容数据并合并
  const fetchAllContent = async () => {
    try {
      setIsLoading(true);
      
      // 1. 尝试获取新闻数据
      let newsData = [];
      try {
        const response = await fetch('http://127.0.0.1:5000/api/admin/news/cnn');
        
        if (response.ok) {
          const data = await response.json();
          // 确保每条新闻都有URL和类型标记
          newsData = data.map(news => ({
            ...news,
            url: news.url || '#',
            type: 'news' // 添加类型标记
          }));
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        // 模拟新闻数据
        const currentTime = new Date();
        newsData = [
          {
            title: "全球科技企业加速AI投资，竞争日益激烈",
            website: "CNN",
            date: new Date(currentTime.getTime()).toISOString(), // 当前时间
            category: "科技",
            image: "https://via.placeholder.com/600x400",
            url: "https://www.cnn.com/tech",
            type: 'news'
          },
          {
            title: "金融市场波动加剧，投资者谨慎观望",
            website: "CNN",
            date: new Date(currentTime.getTime() - 30 * 60 * 1000).toISOString(), // 30分钟前
            category: "金融",
            image: "https://via.placeholder.com/600x400",
            url: "https://www.cnn.com/money",
            type: 'news'
          },
          {
            title: "气候变化峰会召开，各国承诺减排",
            website: "CNN",
            date: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
            category: "环境",
            image: "https://via.placeholder.com/600x400",
            url: "https://www.cnn.com/climate",
            type: 'news'
          },
          {
            title: "新冠疫情最新情况：全球疫苗接种率上升",
            website: "CNN",
            date: new Date(currentTime.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5小时前
            category: "健康",
            image: "https://via.placeholder.com/600x400",
            url: "https://www.cnn.com/health",
            type: 'news'
          }
        ];
      }
      
      // 2. 获取股票数据（这里使用模拟数据）
      const stocksData = mockStockData;
      
      // 3. 获取加密货币数据（这里使用模拟数据）
      const cryptoData = mockCryptoData;
      
      // 4. 合并所有数据
      const combinedContent = [
        ...newsData,
        ...stocksData,
        ...cryptoData
      ];
      
      // 5. 按时间排序
      const sortedContent = sortContentByTime(combinedContent);
      
      // 6. 更新状态
      setAllContent(sortedContent);
    } catch (error) {
      console.error('Error fetching content:', error);
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

  // 初始加载和定时刷新所有内容
  useEffect(() => {
    // 初始加载
    fetchAllContent();
    
    // 设置定时刷新（每10秒）
    const interval = setInterval(() => {
      fetchAllContent();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // 手动刷新
  const handleRefresh = () => {
    fetchAllContent();
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

  // 渲染统一的内容流
  const renderContentStream = () => {
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
          {allContent && allContent.length > 0 ? (
            allContent.map((item, index) => (
              <ContentItem 
                key={item.url || item.symbol || index}
                item={item} 
                index={index} 
                isLoading={isLoading}
              />
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              {isLoading ? "加载中..." : "暂无数据"}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
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
          <div className="flex space-x-1">
            <Globe className="text-blue-500" />
            <TrendingUp className="text-green-500" />
            <Bitcoin className="text-orange-500" />
          </div>
          <h2 className="text-xl font-bold">全部动态</h2>
        </div>
        <RefreshCw 
          className="text-gray-500 cursor-pointer hover:text-blue-500" 
          onClick={handleRefresh}
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
        {renderContentStream()}
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

export default UnifiedNewsStreamComponent;