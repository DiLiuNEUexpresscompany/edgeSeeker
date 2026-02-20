"""
EdgeSeeker API - 全球军情舆情监控系统
"""

from dotenv import load_dotenv

# Load environment variables before importing app modules
load_dotenv()

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from app.api.v1 import news, social, markets, regions, hotspot, translate, semantic  # noqa: E402

app = FastAPI(
    title="EdgeSeeker API", description="全球热点地区军情舆情监控系统", version="0.2.0"
)

# CORS 配置 (standard FastAPI/Starlette pattern)
app.add_middleware(
    CORSMiddleware,  # ty: ignore[invalid-argument-type]
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(news.router, prefix="/api/v1/news", tags=["news"])
app.include_router(social.router, prefix="/api/v1/social", tags=["social"])
app.include_router(markets.router, prefix="/api/v1/markets", tags=["markets"])
app.include_router(regions.router, prefix="/api/v1/regions", tags=["regions"])
app.include_router(hotspot.router, prefix="/api/v1/hotspot", tags=["hotspot"])
app.include_router(translate.router, prefix="/api/v1/translate", tags=["translate"])
app.include_router(semantic.router, prefix="/api/v1/semantic", tags=["semantic"])


@app.get("/")
async def root():
    """系统状态"""
    return {
        "name": "EdgeSeeker",
        "version": "0.2.0",
        "status": "online",
        "description": "全球热点地区军情舆情监控系统",
        "endpoints": {
            "hotspot": "/api/v1/hotspot - 热点检测与自动切换",
            "news": "/api/v1/news - 新闻聚合",
            "social": "/api/v1/social - 社交媒体监控",
            "markets": "/api/v1/markets - 市场数据",
            "regions": "/api/v1/regions - 区域管理",
            "translate": "/api/v1/translate - 翻译服务",
            "semantic": "/api/v1/semantic - 语义匹配",
        },
    }


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy"}
