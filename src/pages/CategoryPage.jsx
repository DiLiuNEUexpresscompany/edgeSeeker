import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import NewsCard from '../components/NewsCard'

const CategoryPage = () => {
  const {category } = useParams()
  const [news, setNews] = useState([]);  // 确保初始值是数组
  const [loading, setLoading] = useState(true)
  const [categoryInfo, setCategoryInfo] = useState(null)
  
  const categoryMap = {
    'western': '美西方',
    'russia-ukraine': '俄乌',
    'middle-east': '中东',
    'asia-pacific': '亚太',
    'others': '其他'
  }
  
  useEffect(() => {
    const fetchCategoryNews = async () => {
      setLoading(true);
      try {
        const [newsRes, categoryRes] = await Promise.all([
          axios.get(`/api/news?category=${category}`),
          axios.get(`/api/categories/${category}`)
        ]);
  
        console.log("API 返回的数据: ", newsRes.data); // 🟢 调试 API 返回的数据
  
        // 确保 `newsRes.data` 是数组
        setNews(Array.isArray(newsRes.data) ? newsRes.data : []);
        setCategoryInfo(categoryRes.data);
      } catch (error) {
        console.error('Error fetching category news:', error);
        setNews([]); // 遇到错误时，`news` 设置为空数组，避免 `.map` 报错
      } finally {
        setLoading(false);
      }
    };
  
    fetchCategoryNews();
  }, [category]);
  
  
  
  return (
    <div>
      <div className="mb-6 p-6 rounded-lg bg-purple-500 text-white">
        <h2 className="text-2xl font-bold mb-2">{categoryMap[category] || category}</h2>
        {categoryInfo && (
          <p className="text-lg">共 {categoryInfo.news_count} 条新闻</p>
        )}
      </div>
      
      {Array.isArray(news) && news.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map(item => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>
    ) : (
      !loading && (
        <div className="text-center p-8 bg-gray-200 rounded-lg">
          <p className="text-lg">该分类暂无新闻</p>
        </div>
      )
    )}
    </div>
  )
}

export default CategoryPage