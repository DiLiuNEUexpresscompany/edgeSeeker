import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const categories = [
    { id: 'western', name: '美西方', count: 2 },
    { id: 'russia-ukraine', name: '俄乌', count: 0 },
    { id: 'middle-east', name: '中东', count: 0 },
    { id: 'asia-pacific', name: '亚太', count: 0 },
    { id: 'others', name: '其他', count: 0 }
  ]

  const today = new Date()
  const formattedDate = `${today.getMonth() + 1}月${today.getDate()}日`

  return (
    <nav className="bg-purple-700 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold">全球热点新闻</Link>
          <div className="hidden md:block">{formattedDate}</div>
        </div>
        
        <div className="flex overflow-x-auto py-2 space-x-6">
          {categories.map(category => (
            <Link 
              key={category.id} 
              to={`/category/${category.id}`}
              className="whitespace-nowrap"
            >
              {category.name} ({category.count})
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navbar