import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import NewsDetailPage from './pages/NewsDetailPage';
import AdminPage from './pages/AdminPage';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [appReady, setAppReady] = useState(false);

  // 模拟初始化延迟
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // 加载中的过渡界面，也使用相同背景
  if (!appReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e9e4dd]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Router>
      {/* 整个应用的外层容器，背景改为 #e9e4dd */}
      <div className="flex flex-col min-h-screen bg-[#e9e4dd]">
        <Navbar />
        
        {/* 主体部分容器，可根据需要决定是否使用 container */}
        <main className="flex-grow container mx-auto px-4 py-6">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/category/:category" element={<CategoryPage />} />
              <Route path="/news/:id" element={<NewsDetailPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </ErrorBoundary>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
