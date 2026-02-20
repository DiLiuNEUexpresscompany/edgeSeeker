"""
EdgeSeeker 配置文件
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""

    # 基础配置
    APP_NAME: str = "EdgeSeeker"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # API 配置
    API_V1_PREFIX: str = "/api/v1"

    # CORS 配置
    CORS_ORIGINS: List[str] = ["*"]

    # Redis 配置
    REDIS_URL: str = "redis://localhost:6379"

    # 外部 API 密钥
    NEWSAPI_KEY: Optional[str] = None
    TWITTER_BEARER_TOKEN: Optional[str] = None

    # Alpaca API (股票/加密货币数据)
    ALPACA_API_KEY: Optional[str] = None
    ALPACA_SECRET_KEY: Optional[str] = None

    # Twitter/X 凭据 (用于 twikit)
    TWITTER_USERNAME: Optional[str] = None
    TWITTER_EMAIL: Optional[str] = None
    TWITTER_PASSWORD: Optional[str] = None
    TWITTER_BEARER_TOKEN: Optional[str] = None

    # GetXAPI (Twitter data provider)
    GETXAPI_KEY: Optional[str] = None

    # ScrapeBadger (Twitter API with Trends)
    SCRAPEBADGER_KEY: Optional[str] = None

    # Kimi K2 (Moonshot AI) - for LLM translation
    KIMI_API_KEY: Optional[str] = None
    KIMI_BASE_URL: str = "https://api.moonshot.cn/v1"
    KIMI_MODEL: str = "kimi-k2-turbo-preview"

    # Proxy configuration
    PROXY_URL: Optional[str] = None

    # 热点地区配置
    REGIONS: List[str] = [
        "israel-palestine",
        "russia-ukraine",
        "taiwan-strait",
        "iran",
        "korea",
    ]

    # 默认地区
    DEFAULT_REGION: str = "russia-ukraine"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
