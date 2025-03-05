import React, { useState, useEffect, useRef } from 'react';
import { Send, Globe, RefreshCw, ChevronLeft, ChevronRight, TrendingUp, Bitcoin } from 'lucide-react';

// 模拟新闻数据（增加图片）
const generateMockNewsStream = () => {
  return [
    {
      id: 1,
      title: "太空探索新突破",
      source: "科技前沿",
      category: "科技",
      content: "国际航天局宣布重大发现，可能改变我们对宇宙的理解。",
      timestamp: new Date(),
      imageUrl: "/api/placeholder/800/400?text=Space+Exploration"
    }
  ];
};

// 模拟美股数据
const mockStockData = [
  { symbol: "AAPL", name: "苹果", price: 182.45, change: 1.23 },
  { symbol: "GOOGL", name: "谷歌", price: 125.67, change: -0.45 },
  { symbol: "MSFT", name: "微软", price: 335.22, change: 0.89 },
  { symbol: "AMZN", name: "亚马逊", price: 142.33, change: 1.56 },
  { symbol: "TSLA", name: "特斯拉", price: 248.76, change: -0.77 }
];

// 模拟加密货币数据
const mockCryptoData = [
  { symbol: "BTC", name: "比特币", price: 51234.56, change: 1.23 },
  { symbol: "ETH", name: "以太坊", price: 2876.44, change: 0.45 },
  { symbol: "BNB", name: "币安币", price: 312.22, change: -0.89 },
  { symbol: "SOL", name: "Solana", price: 134.55, change: 1.56 },
  { symbol: "XRP", name: "瑞波币", price: 0.6234, change: -0.33 }
];

const MultiPageNewsStreamComponent = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [newsStream, setNewsStream] = useState(generateMockNewsStream());
  const [filter, setFilter] = useState('');
  const messagesEndRef = useRef(null);

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
      content: mockStockData
    },
    {
      title: "加密货币",
      icon: Bitcoin,
      content: mockCryptoData
    }
  ];

  // 模拟实时新闻流
  useEffect(() => {
    const interval = setInterval(() => {
      const newNews = {
        id: Date.now(),
        title: "实时突发：" + ["全球经济", "科技创新", "国际关系"][Math.floor(Math.random() * 3)],
        source: ["路透社", "新华社", "BBC"][Math.floor(Math.random() * 3)],
        category: ["政治", "经济", "科技"][Math.floor(Math.random() * 3)],
        content: "最新消息正在持续更新中...",
        timestamp: new Date(),
        imageUrl: `/api/placeholder/800/400?text=${encodeURIComponent('实时新闻')}`
      };
      
      setNewsStream(prev => [newNews, ...prev].slice(0, 5));
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
      // 新闻页面（增加图片展示）
      return currentPageData.content.map((news) => (
        <div 
          key={news.id} 
          className="p-3 rounded-lg bg-white border mb-3 shadow-sm"
        >
          {/* 新闻图片 */}
          <div className="mb-3 overflow-hidden rounded-lg">
            <img 
              src={news.imageUrl} 
              alt={news.title} 
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          {/* 新闻信息 */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-bold text-sm text-gray-700">{news.source}</span>
              <span className="text-xs text-gray-500">
                {news.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">{news.title}</h3>
            <p className="text-sm text-gray-600">{news.content}</p>
          </div>
        </div>
      ));
    } else {
      // 股票和加密货币页面
      return currentPageData.content.map((item) => (
        <div 
          key={item.symbol} 
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
        </div>
      ));
    }
  };

  return (
    <div className="flex flex-col h-[700px] w-full max-w-2xl mx-auto bg-gray-50 rounded-xl shadow-2xl border">
      {/* 头部 */}
      <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-xl">
        <div className="flex items-center space-x-2">
          {React.createElement(pages[currentPage].icon, { className: "text-blue-500" })}
          <h2 className="text-xl font-bold">{pages[currentPage].title}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <RefreshCw 
            className="text-gray-500 cursor-pointer hover:text-blue-500" 
            onClick={() => {}}
          />
        </div>
      </div>

      {/* 页面切换控制 */}
      <div className="flex justify-between items-center p-2 border-b bg-white">
        <ChevronLeft 
          className="cursor-pointer text-gray-500 hover:text-blue-500" 
          onClick={() => handlePageChange(-1)}
        />
        <div className="flex space-x-2">
          {pages.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 w-2 rounded-full ${currentPage === index ? 'bg-blue-500' : 'bg-gray-300'}`}
            />
          ))}
        </div>
        <ChevronRight 
          className="cursor-pointer text-gray-500 hover:text-blue-500" 
          onClick={() => handlePageChange(1)}
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {renderPageContent()}
      </div>
    </div>
  );
};

export default MultiPageNewsStreamComponent;