import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
// 如果需要图标，可以安装 heroicons：npm install @heroicons/react
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 分类数据
  const categories = [
    { id: 'all', name: '全部', path: '/' },
    { id: 'western', name: '美西方', count: 2, path: '/category/western' },
    { id: 'russia-ukraine', name: '俄乌', path: '/category/russia-ukraine' },
    { id: 'middle-east', name: '中东', path: '/category/middle-east' }
  ];

  return (
    <header className="w-full">
      {/* 顶部红色条 */}
      <div className="w-full h-1 bg-red-500"></div>

      {/* 主导航部分 */}
      <div className="bg-[#e9e4dd] py-4">
        <div className="w-full px-4 md:px-8 lg:px-16 flex items-center justify-between">
          {/* Logo */}
          <div>
            <a href="/" className="text-2xl font-bold text-black flex items-center">
              a<span className="text-red-500">●</span>live
            </a>
          </div>

          {/* 右侧部分：包含汉堡菜单按钮(小屏幕) 和 社交媒体图标(大屏幕) */}
          <div className="flex items-center space-x-4">
            {/* 小屏幕：汉堡菜单按钮（lg:hidden 表示在 lg 及以上屏幕隐藏） */}
            <button
              className="lg:hidden focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6 text-black" />
              ) : (
                <Bars3Icon className="h-6 w-6 text-black" />
              )}
            </button>

            {/* 大屏幕：社交媒体图标（hidden lg:flex 表示小屏幕隐藏，lg 及以上显示） */}
            <div className="hidden lg:flex space-x-2">
              <a href="https://youtube.com" className="bg-red-500 rounded-full p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
              </a>
              <a href="https://instagram.com" className="bg-red-500 rounded-full p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="https://facebook.com" className="bg-red-500 rounded-full p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* 移动端下拉菜单（当 isMenuOpen = true 时显示） */}
        {isMenuOpen && (
          <div className="bg-[#e9e4dd] px-4 pt-4 pb-2 flex flex-col space-y-2 lg:hidden">
            {categories.map((cat) => {
              const isActive = location.pathname === cat.path;
              return (
                <Link
                  key={cat.id}
                  to={cat.path}
                  className={[
                    'block py-2 px-2 text-sm font-medium',
                    isActive ? 'bg-blue-600 text-white' : 'bg-white text-black'
                  ].join(' ')}
                  onClick={() => setIsMenuOpen(false)} // 点击后收起菜单
                >
                  {cat.name}
                  {cat.count && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs">
                      {cat.count}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* 如果需要在移动端菜单中也放社交媒体图标，可以在这里添加 */}
          </div>
        )}

        {/* 大屏幕分类按钮条：hidden lg:flex，小屏幕隐藏 */}
        <div className="hidden lg:flex bg-[#e9e4dd] px-8 lg:px-16 py-2">
          {categories.map((cat) => {
            const isActive = location.pathname === cat.path;
            return (
              <Link
                key={cat.id}
                to={cat.path}
                className={[
                  'mx-1 h-10 px-4 flex items-center justify-center text-sm font-medium border border-transparent',
                  isActive ? 'bg-blue-600 text-white font-bold' : 'bg-white text-black'
                ].join(' ')}
              >
                {cat.name}
                {cat.count && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs">
                    {cat.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
