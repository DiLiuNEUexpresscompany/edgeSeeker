"""
Markets Services
- Alpaca: Stocks and Crypto
- Yahoo Finance: Commodities
- Polymarket: Prediction Markets
"""

from app.services.markets.alpaca_service import alpaca_service, StockData, CryptoData
from app.services.markets.commodities_service import commodities_service, CommodityData
from app.services.markets.polymarket import polymarket_service

__all__ = [
    "alpaca_service",
    "commodities_service",
    "polymarket_service",
    "StockData",
    "CryptoData",
    "CommodityData",
]
