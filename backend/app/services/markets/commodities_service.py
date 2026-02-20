"""
Commodities Service
Fetches commodity prices via Yahoo Finance (free, no API key needed)
"""

import asyncio
import aiohttp
import random
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional

from app.core.proxy import get_proxy


# Rate limiting
MAX_CONCURRENT = 2
REQUEST_DELAY = 0.5


@dataclass
class CommodityData:
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    history: list = field(default_factory=list)


# Commodities (Yahoo Finance futures symbols)
COMMODITIES = {
    "CL=F": "Crude Oil WTI",
    "BZ=F": "Brent Crude",
    "GC=F": "Gold",
    "SI=F": "Silver",
    "NG=F": "Natural Gas",
}

# Yahoo Finance API
YAHOO_API = "https://query1.finance.yahoo.com/v8/finance/chart"


class CommoditiesService:
    def __init__(self):
        self.cache: dict[str, CommodityData] = {}
        self.last_fetch: Optional[datetime] = None
        self.fetch_interval = timedelta(minutes=5)

    async def _fetch_quote(
        self, session: aiohttp.ClientSession, symbol: str, semaphore: asyncio.Semaphore
    ) -> Optional[dict]:
        """Fetch quote data from Yahoo Finance with rate limiting"""
        async with semaphore:
            await asyncio.sleep(REQUEST_DELAY + random.uniform(0, 0.3))

            for attempt in range(3):
                try:
                    url = f"{YAHOO_API}/{symbol}"
                    params = {"interval": "1h", "range": "5d"}
                    headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    }

                    async with session.get(
                        url,
                        params=params,
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=10),
                        proxy=get_proxy(),
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            result = data.get("chart", {}).get("result", [])
                            if result:
                                return result[0]
                        elif response.status == 429:
                            wait_time = (2**attempt) + random.uniform(0, 1)
                            print(
                                f"Yahoo Finance rate limited for {symbol}, waiting {wait_time:.1f}s"
                            )
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            break

                except asyncio.TimeoutError:
                    print(f"Yahoo Finance timeout for {symbol}")
                except Exception as e:
                    print(f"Yahoo Finance error for {symbol}: {e}")

                if attempt < 2:
                    await asyncio.sleep(1)

            return None

    async def fetch_commodities(self, force: bool = False) -> list[CommodityData]:
        """Fetch commodity prices"""
        now = datetime.now()

        if not force and self.cache and self.last_fetch:
            if (now - self.last_fetch) < self.fetch_interval:
                return list(self.cache.values())

        commodities = []
        semaphore = asyncio.Semaphore(MAX_CONCURRENT)

        async with aiohttp.ClientSession() as session:
            tasks = [
                self._fetch_quote(session, symbol, semaphore)
                for symbol in COMMODITIES.keys()
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for symbol, result in zip(COMMODITIES.keys(), results):
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

                        # Get price history
                        closes = quotes.get("close", [])
                        history = [p for p in closes if p is not None][-24:]

                        commodity = CommodityData(
                            symbol=symbol,
                            name=COMMODITIES[symbol],
                            price=round(current, 2),
                            change=round(change, 2),
                            change_percent=round(change_pct, 2),
                            history=history,
                        )
                        commodities.append(commodity)
                        self.cache[symbol] = commodity

                    except Exception as e:
                        print(f"Error parsing {symbol}: {e}")

        self.last_fetch = now

        if not commodities:
            return self._get_mock_commodities()

        return commodities

    def _get_mock_commodities(self) -> list[CommodityData]:
        """Return mock data when API is unavailable"""
        mocks = []
        base_prices = {"CL=F": 70, "BZ=F": 75, "GC=F": 2650, "SI=F": 30, "NG=F": 3.5}

        for symbol, name in COMMODITIES.items():
            base = base_prices.get(symbol, 100)
            price = base * (1 + random.uniform(-0.02, 0.02))
            change_pct = random.uniform(-3, 3)
            change = price * change_pct / 100
            history = [base * (1 + random.uniform(-0.01, 0.01)) for _ in range(24)]

            mocks.append(
                CommodityData(
                    symbol=symbol,
                    name=name,
                    price=round(price, 2),
                    change=round(change, 2),
                    change_percent=round(change_pct, 2),
                    history=history,
                )
            )
        return mocks

    def get_market_movement(self, region: str) -> float:
        """Calculate market movement score for a region based on commodities"""
        oil_movement = 0.0
        for symbol in ["CL=F", "BZ=F"]:
            if symbol in self.cache:
                oil_movement = max(oil_movement, abs(self.cache[symbol].change_percent))

        gold_movement = 0.0
        if "GC=F" in self.cache:
            gold_movement = abs(self.cache["GC=F"].change_percent)

        # Regional weighting
        region_weights = {
            "iran": {"oil": 0.8, "gold": 0.2},
            "israel-palestine": {"oil": 0.6, "gold": 0.4},
            "russia-ukraine": {"oil": 0.7, "gold": 0.3},
            "taiwan-strait": {"oil": 0.5, "gold": 0.5},
            "korea": {"oil": 0.5, "gold": 0.5},
        }

        weights = region_weights.get(region, {"oil": 0.6, "gold": 0.4})

        # Normalize to 0-100 (assume 5% move is max)
        score = (oil_movement / 5 * 100 * weights["oil"]) + (
            gold_movement / 5 * 100 * weights["gold"]
        )

        return min(score, 100)


# Global instance
commodities_service = CommoditiesService()
