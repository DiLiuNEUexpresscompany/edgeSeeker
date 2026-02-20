# edge●SEEKER

全球军情舆情监控平台 - Global Military & Geopolitical Intelligence Monitor

类似 [IranMonitor.org](https://iranmonitor.org) 的多地区实时情报监控系统。

![EdgeSeeker](./docs/screenshot.png)

## 🎯 功能特性

### 核心功能
- 🔴 **Breaking News** - 实时滚动突发新闻横幅
- 📰 **多源新闻聚合** - 整合 CNN, BBC, Reuters, Al Jazeera 等
- 📱 **社交媒体监控** - X/Twitter, BlueSky 大V追踪
- 📊 **预测市场** - Polymarket 实时赔率
- 📈 **市场数据** - 军工股、能源、大宗商品异动
- 🗺️ **事件时间线** - 按类型分类的事件流

### 智能分析
- 🔥 **热点自动识别** - AI 判断当前最热地区
- 📉 **趋势分析** - 新闻量、社交热度趋势图
- 🎯 **紧张指数** - 全球紧张局势评分

### 覆盖地区
| 地区 | 关键词 |
|------|--------|
| 🇮🇱🇵🇸 巴以 | Israel, Gaza, Hamas, IDF |
| 🇷🇺🇺🇦 俄乌 | Ukraine, Russia, NATO |
| 🇹🇼 台海 | Taiwan, PLA, Strait |
| 🇮🇷 伊朗 | Iran, IRGC, Nuclear |
| 🇰🇵 朝鲜半岛 | DPRK, Kim Jong Un |

## 🛠️ 技术栈

### 前端
- React 19 + Vite
- WindiCSS
- Framer Motion
- Recharts

### 后端
- FastAPI (Python 3.13)
- Redis (缓存)
- uv (包管理)

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- Python >= 3.13
- [uv](https://github.com/astral-sh/uv)

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 启动后端

```bash
cd backend
./start.sh
# 或手动: uv run python main.py
```

后端运行在 http://localhost:8000

API 文档: http://localhost:8000/docs

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:5173

## 📁 项目结构

```
edgeSeeker/
├── backend/                  # FastAPI 后端
│   ├── app/
│   │   ├── api/v1/          # API 路由
│   │   ├── models/          # 数据模型
│   │   └── services/        # 业务服务
│   │       ├── news/        # 新闻服务
│   │       ├── social/      # 社交媒体服务
│   │       ├── markets/     # 市场数据服务
│   │       └── analysis/    # 智能分析服务
│   └── main.py
│
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # 通用组件
│   │   │   ├── news/        # 新闻组件
│   │   │   ├── social/      # 社交组件
│   │   │   └── markets/     # 市场组件
│   │   ├── pages/           # 页面
│   │   ├── services/        # API 服务
│   │   └── config/          # 配置
│   └── package.json
│
└── docs/                     # 文档
```

## 📡 API 接口

### 新闻
- `GET /api/v1/news/breaking` - 突发新闻
- `GET /api/v1/news/latest` - 最新新闻
- `GET /api/v1/news/headlines` - 头条新闻

### 社交媒体
- `GET /api/v1/social/feed` - 社交信息流
- `GET /api/v1/social/accounts` - 追踪账号

### 市场
- `GET /api/v1/markets/predictions` - 预测市场
- `GET /api/v1/markets/stocks/defense` - 军工股
- `GET /api/v1/markets/commodities` - 大宗商品

### 地区
- `GET /api/v1/regions/` - 所有地区
- `GET /api/v1/regions/hotspot` - 当前热点

## 🔮 规划中的功能

- [ ] 实时推送 (WebSocket)
- [ ] 舰船追踪 (MarineTraffic)
- [ ] 航班追踪 (ADS-B)
- [ ] AI 每日简报生成
- [ ] 用户自定义监控列表
- [ ] 移动端 App

## 📜 License

MIT
