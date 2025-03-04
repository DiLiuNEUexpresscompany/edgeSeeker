import React from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'

const NewsCard = ({ news }) => {
  return (
    <Link to={`/news/${news.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 relative">
        {/* Diagonal accent line inspired by the poster */}
        <div className="absolute top-0 bottom-0 left-0 w-2 bg-primary-light"></div>
        
        {news.image && (
          <div className="relative">
            <img 
              src={news.image} 
              alt={news.title} 
              className="w-full h-56 object-cover"
            />
            <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-transparent to-accent-midnight/50"></div>
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-medium py-1 px-3 rounded-full text-white bg-accent-purple">
              {news.category_name}
            </span>
            <span className="text-gray-400 text-sm font-medium">
              {dayjs(news.published_at).format('YYYY-MM-DD')}
            </span>
          </div>
          <h3 className="text-xl font-bold mb-3 text-accent-midnight leading-tight">{news.title}</h3>
          <p className="text-gray-600 line-clamp-2 text-sm leading-relaxed">{news.summary}</p>
          
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">作者: {news.author}</span>
            <div className="flex items-center gap-1 text-primary-DEFAULT font-medium text-sm group">
              <span>阅读更多</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default NewsCard