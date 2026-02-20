"""
新闻数据模型
"""

from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from enum import Enum


class EventType(str, Enum):
    """事件类型"""

    CONFLICT = "conflict"
    DIPLOMACY = "diplomacy"
    SANCTIONS = "sanctions"
    MILITARY = "military"
    ECONOMY = "economy"
    PROTEST = "protest"
    OTHER = "other"


class Region(str, Enum):
    """热点地区"""

    ISRAEL_PALESTINE = "israel-palestine"
    RUSSIA_UKRAINE = "russia-ukraine"
    TAIWAN_STRAIT = "taiwan-strait"
    IRAN = "iran"
    KOREA = "korea"


class NewsSource(BaseModel):
    """新闻来源"""

    id: str
    name: str
    url: Optional[str] = None
    logo: Optional[str] = None
    country: Optional[str] = None


class NewsArticle(BaseModel):
    """新闻文章"""

    id: str
    title: str
    summary: Optional[str] = None
    content: Optional[str] = None
    url: HttpUrl
    image: Optional[str] = None
    source: NewsSource
    author: Optional[str] = None
    published_at: datetime
    region: Optional[Region] = None
    event_type: Optional[EventType] = None
    tags: List[str] = []
    is_breaking: bool = False
    importance_score: float = 0.0  # 0-10 重要性评分


class BreakingNews(BaseModel):
    """突发新闻"""

    id: str
    title: str
    source: str
    url: HttpUrl
    published_at: datetime
    region: Optional[Region] = None


class DailyBriefing(BaseModel):
    """每日简报"""

    date: str
    region: Region
    summary: str
    key_events: List[str]
    outlook: Optional[str] = None


class NewsVolume(BaseModel):
    """新闻量统计"""

    date: str
    count: int
    change_percent: Optional[float] = None
