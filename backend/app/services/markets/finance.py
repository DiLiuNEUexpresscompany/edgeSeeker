"""
Financial Markets Service
Fetches defense stocks and related market data via Yahoo Finance
"""

import asyncio
import aiohttp
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional


@dataclass
class StockData:
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    market_cap: Optional[float] = None
    category: str = "defense"


@dataclass
class CommodityData:
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float


@dataclass
class CryptoData:
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int = 0
    history: Optional[list] = None  # Price history for charts


# Defense sector stocks to monitor
DEFENSE_STOCKS = {
    "LMT": "Lockheed Martin",
    "RTX": "RTX Corp (Raytheon)",
    "NOC": "Northrop Grumman",
    "GD": "General Dynamics",
    "BA": "Boeing",
    "LHX": "L3Harris",
    "HII": "Huntington Ingalls",
    "KTOS": "Kratos Defense",
}

# Commodities that spike during geopolitical tension
COMMODITIES = {
    "CL=F": "Crude Oil WTI",
    "BZ=F": "Brent Crude",
    "GC=F": "Gold",
    "NG=F": "Natural Gas",
}

# Crypto assets (often move during uncertainty)
CRYPTO = {
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",
    "SOL-USD": "Solana",
    "XRP-USD": "XRP",
}

# Regional ETFs/indices
REGIONAL_ETFS = {
    "iran": ["USO", "XLE"],  # Oil ETFs
    "israel-palestine": ["EIS", "GULF"],  # Israel/Middle East ETFs
    "russia-ukraine": ["RSX", "ERUS"],  # Russia ETFs (if available)
    "taiwan-strait": ["EWT", "MCHI"],  # Taiwan/China ETFs
    "korea": ["EWY", "FLKR"],  # Korea ETFs
}

# Yahoo Finance API (unofficial but widely used)
YAHOO_API = "https://query1.finance.yahoo.com/v8/finance/chart"


class FinanceService:
    def __init__(self):
        self.stock_cache: dict[str, StockData] = {}
        self.commodity_cache: dict[str, CommodityData] = {}
        self.crypto_cache: dict[str, CryptoData] = {}
        self.history_cache: dict[str, list] = {}  # Price history for charts
        self.last_fetch: Optional[datetime] = None
        self.fetch_interval = timedelta(minutes=5)

    async def _fetch_quote(
        self, session: aiohttp.ClientSession, symbol: str, with_history: bool = False
    ) -> Optional[dict]:
        """Fetch quote data for a symbol"""
        try:
            url = f"{YAHOO_API}/{symbol}"
            params = {
                "interval": "1h" if with_history else "1d",
                "range": "5d" if with_history else "2d",
            }

            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }

            async with session.get(
                url,
                params=params,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    result = data.get("chart", {}).get("result", [])
                    if result:
                        return result[0]
        except Exception as e:
            print(f"Yahoo Finance error for {symbol}: {e}")

        return None

    async def fetch_defense_stocks(self, force: bool = False) -> list[StockData]:
        """Fetch defense sector stocks"""
        now = datetime.now()

        if (
            not force
            and self.stock_cache
            and self.last_fetch
            and (now - self.last_fetch) < self.fetch_interval
        ):
            return list(self.stock_cache.values())

        stocks = []

        async with aiohttp.ClientSession() as session:
            tasks = [
                self._fetch_quote(session, symbol) for symbol in DEFENSE_STOCKS.keys()
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for symbol, result in zip(DEFENSE_STOCKS.keys(), results):
                if isinstance(result, dict):
                    try:
                        meta = result.get("meta", {})
                        indicators = result.get("indicators", {})
                        quotes = indicators.get("quote", [{}])[0]

                        # Get current and previous close
                        closes = quotes.get("close", [])
                        current = meta.get("regularMarketPrice", 0)
                        prev_close = meta.get("previousClose") or meta.get(
                            "chartPreviousClose", 0
                        )

                        if not current and closes:
                            current = closes[-1] if closes[-1] else 0

                        change = current - prev_close if prev_close else 0
                        change_pct = (change / prev_close * 100) if prev_close else 0

                        stock = StockData(
                            symbol=symbol,
                            name=DEFENSE_STOCKS[symbol],
                            price=round(current, 2),
                            change=round(change, 2),
                            change_percent=round(change_pct, 2),
                            volume=int(meta.get("regularMarketVolume", 0)),
                            market_cap=meta.get("marketCap"),
                            category="defense",
                        )
                        stocks.append(stock)
                        self.stock_cache[symbol] = stock
                    except Exception as e:
                        print(f"Error parsing {symbol}: {e}")

        self.last_fetch = now
        return stocks

    async def fetch_commodities(self, force: bool = False) -> list[CommodityData]:
        """Fetch commodity prices (oil, gold, etc.)"""
        now = datetime.now()

        if (
            not force
            and self.commodity_cache
            and self.last_fetch
            and (now - self.last_fetch) < self.fetch_interval
        ):
            return list(self.commodity_cache.values())

        commodities = []

        async with aiohttp.ClientSession() as session:
            tasks = [
                self._fetch_quote(session, symbol) for symbol in COMMODITIES.keys()
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for symbol, result in zip(COMMODITIES.keys(), results):
                if isinstance(result, dict):
                    try:
                        meta = result.get("meta", {})

                        current = meta.get("regularMarketPrice", 0)
                        prev_close = meta.get("previousClose") or meta.get(
                            "chartPreviousClose", 0
                        )

                        change = current - prev_close if prev_close else 0
                        change_pct = (change / prev_close * 100) if prev_close else 0

                        commodity = CommodityData(
                            symbol=symbol,
                            name=COMMODITIES[symbol],
                            price=round(current, 2),
                            change=round(change, 2),
                            change_percent=round(change_pct, 2),
                        )
                        commodities.append(commodity)
                        self.commodity_cache[symbol] = commodity
                    except Exception as e:
                        print(f"Error parsing {symbol}: {e}")

        return commodities

    async def fetch_crypto(self, force: bool = False) -> list[CryptoData]:
        """Fetch cryptocurrency prices"""
        now = datetime.now()

        if (
            not force
            and self.crypto_cache
            and self.last_fetch
            and (now - self.last_fetch) < self.fetch_interval
        ):
            return list(self.crypto_cache.values())

        cryptos = []

        async with aiohttp.ClientSession() as session:
            tasks = [
                self._fetch_quote(session, symbol, with_history=True)
                for symbol in CRYPTO.keys()
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for symbol, result in zip(CRYPTO.keys(), results):
                if isinstance(result, dict):
                    try:
                        meta = result.get("meta", {})
                        indicators = result.get("indicators", {})
                        quotes = indicators.get("quote", [{}])[0]

                        current = meta.get("regularMarketPrice", 0)
                        prev_close = meta.get("previousClose") or meta.get(
                            "chartPreviousClose", 0
                        )

                        change = current - prev_close if prev_close else 0
                        change_pct = (change / prev_close * 100) if prev_close else 0

                        # Get price history for charts
                        closes = quotes.get("close", [])
                        # Filter out None values and get last 24 points
                        history = [p for p in closes if p is not None][-24:]
                        self.history_cache[symbol] = history

                        crypto = CryptoData(
                            symbol=symbol,
                            name=CRYPTO[symbol],
                            price=round(current, 2),
                            change=round(change, 2),
                            change_percent=round(change_pct, 2),
                            volume=int(meta.get("regularMarketVolume", 0)),
                            history=history,
                        )
                        cryptos.append(crypto)
                        self.crypto_cache[symbol] = crypto
                    except Exception as e:
                        print(f"Error parsing {symbol}: {e}")

        return cryptos

    async def fetch_with_history(self, symbol: str) -> Optional[list]:
        """Fetch price history for a specific symbol"""
        async with aiohttp.ClientSession() as session:
            result = await self._fetch_quote(session, symbol, with_history=True)
            if result:
                indicators = result.get("indicators", {})
                quotes = indicators.get("quote", [{}])[0]
                closes = quotes.get("close", [])
                timestamps = result.get("timestamp", [])

                # Combine timestamps and prices
                history = []
                for i, (ts, price) in enumerate(zip(timestamps, closes)):
                    if price is not None:
                        history.append({"time": ts, "price": round(price, 2)})

                return history[-48:]  # Last 48 hours (hourly data)
        return None

    async def fetch_all(self, force: bool = False) -> dict:
        """Fetch all market data"""
        stocks = await self.fetch_defense_stocks(force)
        commodities = await self.fetch_commodities(force)
        cryptos = await self.fetch_crypto(force)

        return {
            "defense_stocks": stocks,
            "commodities": commodities,
            "crypto": cryptos,
            "timestamp": datetime.now().isoformat(),
        }

    def get_market_movement(self, region: str) -> float:
        """Calculate market movement score for a region"""
        # Defense stocks movement
        defense_movement = 0.0
        if self.stock_cache:
            changes = [abs(s.change_percent) for s in self.stock_cache.values()]
            defense_movement = sum(changes) / len(changes) if changes else 0

        # Oil movement (affects all regions but especially Middle East)
        oil_movement = 0.0
        for symbol in ["CL=F", "BZ=F"]:
            if symbol in self.commodity_cache:
                oil_movement = max(
                    oil_movement, abs(self.commodity_cache[symbol].change_percent)
                )

        # Regional weighting
        region_weights = {
            "iran": {"defense": 0.3, "oil": 0.7},
            "israel-palestine": {"defense": 0.5, "oil": 0.5},
            "russia-ukraine": {"defense": 0.4, "oil": 0.6},
            "taiwan-strait": {"defense": 0.6, "oil": 0.4},
            "korea": {"defense": 0.5, "oil": 0.5},
        }

        weights = region_weights.get(region, {"defense": 0.5, "oil": 0.5})

        # Calculate weighted score, normalize to 0-100
        # Assume 5% move is max
        score = (defense_movement / 5 * 100 * weights["defense"]) + (
            oil_movement / 5 * 100 * weights["oil"]
        )

        return min(score, 100)


# Global instance
finance_service = FinanceService()
