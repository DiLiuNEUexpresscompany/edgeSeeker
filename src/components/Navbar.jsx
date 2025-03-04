import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const categories = [
    { id: 'all', name: '全部', path: '/' },
    { id: 'western', name: '美西方', count: 2, path: '/category/western' },
    { id: 'russia-ukraine', name: '俄乌', path: '/category/russia-ukraine' },
    { id: 'middle-east', name: '中东', path: '/category/middle-east' },
    { id: 'asia-pacific', name: '亚太', path: '/category/asia-pacific' },
    { id: 'others', name: '其他', path: '/category/others' }
  ];

  const today = new Date();
  const formattedDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // 检查当前路径是否匹配分类路径
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="w-full">
      {/* 顶部导航栏 */}
      <div className="bg-zinc-800 text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 bg-fuchsia-600 rounded-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <Link to="/" className="text-xl font-bold">全球热点新闻</Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              <span className="hidden sm:inline">{formattedDate}</span>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="搜索新闻..."
                className="bg-zinc-700 text-white text-sm rounded-full px-4 py-1.5 pl-8 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 w-48"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* 最新新闻标题栏 */}
      <div className="w-full bg-zinc-100 border-b border-zinc-200">
        <div className="container mx-auto px-4 py-2 flex items-center">
          <div className="flex items-center">
            <div className="w-1 h-6 bg-fuchsia-600 mr-3"></div>
            <h2 className="text-lg font-bold text-zinc-800">最新新闻</h2>
          </div>
          <span className="text-sm text-zinc-500 ml-3">每日更新</span>
        </div>
      </div>
      
      {/* 分类导航 */}
      <div className="w-full bg-zinc-200">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-2 -mx-1 scrollbar-hide">
            {categories.map(category => (
              <Link
                key={category.id}
                to={category.path}
                className={`whitespace-nowrap px-4 py-1.5 mx-1 text-sm rounded-full transition-colors ${
                  isActive(category.path)
                    ? 'bg-fuchsia-600 text-white font-medium'
                    : 'bg-white text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {category.name}
                {category.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    isActive(category.path)
                      ? 'bg-white text-fuchsia-600 font-medium'
                      : 'bg-zinc-200 text-zinc-700'
                  }`}>
                    {category.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
