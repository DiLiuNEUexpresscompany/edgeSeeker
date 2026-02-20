"""
市场数据模型
"""

from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime
from enum import Enum


class MarketType(str, Enum):
    """市场类型"""

    PREDICTION = "prediction"
    STOCK = "stock"
    COMMODITY = "commodity"
    CRYPTO = "crypto"
    FOREX = "forex"


class PredictionMarket(BaseModel):
    """预测市场"""

    id: str
    title: str
    description: Optional[str] = None
    url: HttpUrl
    platform: str = "polymarket"
    probability: float  # 0-100
    volume: float  # 交易量
    image: Optional[str] = None
    region: Optional[str] = None
    end_date: Optional[datetime] = None
    last_updated: datetime


class StockQuote(BaseModel):
    """股票行情"""

    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    market_cap: Optional[float] = None
    sector: Optional[str] = None
    last_updated: datetime


class CommodityQuote(BaseModel):
    """大宗商品行情"""

    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    unit: str  # barrel, ounce, etc.
    last_updated: datetime


class MarketAlert(BaseModel):
    """市场异动警报"""

    id: str
    market_type: MarketType
    symbol: str
    name: str
    alert_type: str  # surge, plunge, breakout
    change_percent: float
    message: str
    timestamp: datetime
    related_region: Optional[str] = None


# 军工股列表
DEFENSE_STOCKS = [
    {"symbol": "LMT", "name": "Lockheed Martin"},
    {"symbol": "RTX", "name": "Raytheon"},
    {"symbol": "NOC", "name": "Northrop Grumman"},
    {"symbol": "BA", "name": "Boeing"},
    {"symbol": "GD", "name": "General Dynamics"},
    {"symbol": "LHX", "name": "L3Harris"},
]

# 能源股列表
ENERGY_STOCKS = [
    {"symbol": "XOM", "name": "Exxon Mobil"},
    {"symbol": "CVX", "name": "Chevron"},
    {"symbol": "OXY", "name": "Occidental"},
]

# 大宗商品
COMMODITIES = [
    {"symbol": "CL=F", "name": "Crude Oil", "unit": "barrel"},
    {"symbol": "GC=F", "name": "Gold", "unit": "ounce"},
    {"symbol": "NG=F", "name": "Natural Gas", "unit": "MMBtu"},
]
