import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold">全球热点新闻</h2>
            <p className="text-gray-400 mt-1">实时追踪全球新闻动态</p>
          </div>
          <div className="flex flex-col md:flex-row md:space-x-4">
            <a href="#" className="text-gray-300 hover:text-white my-1">关于我们</a>
            <a href="#" className="text-gray-300 hover:text-white my-1">联系方式</a>
            <a href="#" className="text-gray-300 hover:text-white my-1">隐私政策</a>
            <a href="/admin" className="text-gray-300 hover:text-white my-1">管理入口</a>
          </div>
        </div>
        <div className="mt-6 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} 全球热点新闻. 保留所有权利. ID: 新闻防务
        </div>
      </div>
    </footer>
  )
}

export default Footer