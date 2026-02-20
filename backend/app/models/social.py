"""
社交媒体数据模型
"""

from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SocialPlatform(str, Enum):
    """社交平台"""

    TWITTER = "twitter"
    BLUESKY = "bluesky"
    TELEGRAM = "telegram"


class SocialAccount(BaseModel):
    """社交账号"""

    id: str
    platform: SocialPlatform
    username: str
    display_name: str
    avatar: Optional[str] = None
    verified: bool = False
    followers_count: int = 0
    description: Optional[str] = None
    url: Optional[HttpUrl] = None
    tags: List[str] = []  # 账号分类标签


class SocialPost(BaseModel):
    """社交帖子"""

    id: str
    platform: SocialPlatform
    account: SocialAccount
    content: str
    url: HttpUrl
    published_at: datetime
    likes: int = 0
    reposts: int = 0
    replies: int = 0
    media: List[str] = []  # 媒体链接
    is_repost: bool = False
    original_post_id: Optional[str] = None


class SocialVolume(BaseModel):
    """社交媒体热度"""

    timestamp: datetime
    platform: SocialPlatform
    keyword: str
    count: int
    sentiment: Optional[float] = None  # -1 到 1


class TrackedAccount(BaseModel):
    """追踪的账号"""

    account: SocialAccount
    region: Optional[str] = None
    category: str  # journalist, official, analyst, etc.
    priority: int = 1  # 1-5 优先级
