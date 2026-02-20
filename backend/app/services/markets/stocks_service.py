"""
Stocks Service
Fetches stock prices via Yahoo Finance (free, no API key needed)
"""

import asyncio
import aiohttp
import random
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional

from app.core.proxy import get_proxy


@dataclass
class StockData:
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int = 0
    market_cap: Optional[float] = None
    category: str = "defense"
    history: list = field(default_factory=list)


# Rate limiting: max concurrent requests
MAX_CONCURRENT = 2
REQUEST_DELAY = 0.5  # seconds between requests


# Defense sector stocks
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

# Yahoo Finance API
YAHOO_API = "https://query1.finance.yahoo.com/v8/finance/chart"


class StocksService:
    def __init__(self):
        self.cache: dict[str, StockData] = {}
        self.last_fetch: Optional[datetime] = None
        self.fetch_interval = timedelta(minutes=1)

    async def _fetch_quote(
        self, session: aiohttp.ClientSession, symbol: str, semaphore: asyncio.Semaphore
    ) -> Optional[dict]:
        """Fetch quote data from Yahoo Finance with rate limiting"""
        async with semaphore:
            # Add random delay to avoid burst requests
            await asyncio.sleep(REQUEST_DELAY + random.uniform(0, 0.3))

            for attempt in range(3):  # Retry up to 3 times
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
                            # Rate limited - wait and retry with exponential backoff
                            wait_time = (2**attempt) + random.uniform(0, 1)
                            print(
                                f"Yahoo Finance rate limited for {symbol}, waiting {wait_time:.1f}s"
                            )
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            break  # Other error, don't retry

                except asyncio.TimeoutError:
                    print(f"Yahoo Finance timeout for {symbol}")
                except Exception as e:
                    print(f"Yahoo Finance error for {symbol}: {e}")

                if attempt < 2:
                    await asyncio.sleep(1)  # Brief pause before retry

            return None

    async def fetch_defense_stocks(self, force: bool = False) -> list[StockData]:
        """Fetch defense sector stocks via Yahoo Finance"""
        now = datetime.now()

        if not force and self.cache and self.last_fetch:
            if (now - self.last_fetch) < self.fetch_interval:
                return list(self.cache.values())

        stocks = []
        semaphore = asyncio.Semaphore(MAX_CONCURRENT)

        async with aiohttp.ClientSession() as session:
            tasks = [
                self._fetch_quote(session, symbol, semaphore)
                for symbol in DEFENSE_STOCKS.keys()
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for symbol, result in zip(DEFENSE_STOCKS.keys(), results):
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

                        stock = StockData(
                            symbol=symbol,
                            name=DEFENSE_STOCKS[symbol],
                            price=round(current, 2),
                            change=round(change, 2),
                            change_percent=round(change_pct, 2),
                            volume=int(meta.get("regularMarketVolume", 0)),
                            market_cap=meta.get("marketCap"),
                            category="defense",
                            history=history,
                        )
                        stocks.append(stock)
                        self.cache[symbol] = stock

                    except Exception as e:
                        print(f"Error parsing {symbol}: {e}")

        self.last_fetch = now

        return stocks if stocks else list(self.cache.values())


# Global instance
stocks_service = StocksService()
