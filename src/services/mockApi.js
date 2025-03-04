import { mockData } from './mockData.js';

// Helper to generate a JWT-like token (not secure, just for mock)
const generateToken = (username) => {
  return `mock-jwt-${username}-${Date.now()}`;
};

export const setupMockServer = (app) => {
  // 添加调试中间件
  app.use((req, res, next) => {
    console.log(`[Mock API Request] ${req.method} ${req.url}`);
    next();
  });

  // Mock authentication
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = mockData.users.find(u => u.username === username && u.password === password);
    
    if (user) {
      return res.json({
        token: generateToken(username),
        token_type: "bearer"
      });
    }
    
    return res.status(401).json({ detail: "Incorrect username or password" });
  });
  
  // 修改获取新闻的路由处理
  app.get('/api/news', (req, res) => {
    const { category } = req.query;
  
    try {
      if (!Array.isArray(mockData.news)) {
        console.error('[Mock API Error] mockData.news 不是数组:', mockData.news);
        return res.json([]); // 确保返回的是数组
      }
  
      let news = [...mockData.news];
  
      if (category) {
        news = news.filter(item => item.category === category);
      }
  
      console.log(`[Mock API Response] 返回 ${category ? category + ' 分类的' : '所有'} 新闻:`, news);
      return res.json(news);
    } catch (error) {
      console.error('[Mock API Error]:', error);
      return res.json([]); // 确保返回的是数组
    }
  });
  
  
  // Get news by ID
  app.get('/api/news/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const news = mockData.news.find(item => item.id === id);
    
    if (!news) {
      return res.status(404).json({ detail: "News not found" });
    }
    
    return res.json(news);
  });
  
  // 修改获取分类信息的路由处理
  app.get('/api/categories/:category_id', (req, res) => {
    try {
      const categoryId = req.params.category_id;
      const category = mockData.categories[categoryId];
      
      if (!category) {
        console.log('[Mock API] 分类不存在:', categoryId);
        return res.status(404).json({ error: '分类不存在' });
      }
      
      console.log('[Mock API] 返回分类信息:', category);
      return res.json(category);
    } catch (error) {
      console.error('[Mock API Error]:', error);
      return res.status(500).json({ error: '服务器错误' });
    }
  });
  
  // Get admin news list
  app.get('/api/admin/news', (req, res) => {
    // In a real app, you'd check the authorization header
    return res.json(mockData.news);
  });
  
  // Create news
  app.post('/api/admin/news', (req, res) => {
    const nextId = Math.max(...mockData.news.map(item => item.id)) + 1;
    
    const newNews = {
      id: nextId,
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      category: req.body.category,
      category_name: mockData.categories[req.body.category]?.name || req.body.category,
      image: null, // In a real app, you'd handle file uploads
      published_at: new Date().toISOString(),
      author: "新闻编辑",
      author_id: "千手防务",
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
    };
    
    mockData.news.push(newNews);
    
    // Update category count
    if (mockData.categories[newNews.category]) {
      mockData.categories[newNews.category].news_count++;
    }
    
    return res.status(201).json({ success: true, id: newNews.id });
  });
  
  // Update news
  app.put('/api/admin/news/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const newsIndex = mockData.news.findIndex(item => item.id === id);
    
    if (newsIndex === -1) {
      return res.status(404).json({ detail: "News not found" });
    }
    
    const oldCategory = mockData.news[newsIndex].category;
    const newCategory = req.body.category;
    
    // Update the news
    mockData.news[newsIndex] = {
      ...mockData.news[newsIndex],
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      category: newCategory,
      category_name: mockData.categories[newCategory]?.name || newCategory,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : mockData.news[newsIndex].tags
    };
    
    // Update category counts if category changed
    if (oldCategory !== newCategory) {
      if (mockData.categories[oldCategory]) {
        mockData.categories[oldCategory].news_count--;
      }
      if (mockData.categories[newCategory]) {
        mockData.categories[newCategory].news_count++;
      }
    }
    
    return res.json({ success: true, id });
  });
  
  // Delete news
  app.delete('/api/admin/news/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const newsIndex = mockData.news.findIndex(item => item.id === id);
    
    if (newsIndex === -1) {
      return res.status(404).json({ detail: "News not found" });
    }
    
    const category = mockData.news[newsIndex].category;
    
    // Remove the news
    mockData.news.splice(newsIndex, 1);
    
    // Update category count
    if (mockData.categories[category]) {
      mockData.categories[category].news_count--;
    }
    
    return res.json({ success: true });
  });
};