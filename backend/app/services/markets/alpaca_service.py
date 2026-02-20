"""
Alpaca Markets Service
Free stock and crypto data via Alpaca API
"""

import os
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional

# Alpaca SDK
try:
    from alpaca.data.historical import (
        StockHistoricalDataClient,
        CryptoHistoricalDataClient,
    )
    from alpaca.data.requests import (
        StockLatestQuoteRequest,
        StockBarsRequest,
        CryptoLatestQuoteRequest,
        CryptoBarsRequest,
    )
    from alpaca.data.timeframe import TimeFrame

    ALPACA_AVAILABLE = True
except ImportError:
    ALPACA_AVAILABLE = False
    print("Warning: alpaca-py not installed. Run: uv add alpaca-py")


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


@dataclass
class CryptoData:
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int = 0
    history: list = field(default_factory=list)


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

# Crypto symbols (Alpaca format)
CRYPTO_SYMBOLS = {
    "BTC/USD": "Bitcoin",
    "ETH/USD": "Ethereum",
    "SOL/USD": "Solana",
    "XRP/USD": "XRP",
}


class AlpacaService:
    def __init__(self):
        self.stock_cache: dict[str, StockData] = {}
        self.crypto_cache: dict[str, CryptoData] = {}
        self.last_fetch: Optional[datetime] = None
        self.fetch_interval = timedelta(minutes=1)

        # Initialize clients
        self.stock_client = None
        self.crypto_client = None

        if ALPACA_AVAILABLE:
            # Get API keys from environment or settings
            api_key = os.getenv("ALPACA_API_KEY", "")
            secret_key = os.getenv("ALPACA_SECRET_KEY", "")

            # Try to load from pydantic settings if env vars not found
            if not api_key or not secret_key:
                try:
                    from app.core.config import settings

                    api_key = settings.ALPACA_API_KEY or ""
                    secret_key = settings.ALPACA_SECRET_KEY or ""
                except Exception:
                    pass

            if api_key and secret_key:
                self.stock_client = StockHistoricalDataClient(api_key, secret_key)
                print("✅ Alpaca Stock client initialized")
            else:
                print(
                    "⚠️ Alpaca API keys not found. Set ALPACA_API_KEY and ALPACA_SECRET_KEY"
                )

            # Crypto client doesn't require API keys
            self.crypto_client = CryptoHistoricalDataClient()
            print("✅ Alpaca Crypto client initialized (no keys required)")

    async def fetch_defense_stocks(self, force: bool = False) -> list[StockData]:
        """Fetch defense sector stocks via Alpaca"""
        now = datetime.now()

        if not force and self.stock_cache and self.last_fetch:
            if (now - self.last_fetch) < self.fetch_interval:
                return list(self.stock_cache.values())

        stocks = []

        if not self.stock_client:
            # Return mock data if no client
            return self._get_mock_stocks()

        try:
            symbols = list(DEFENSE_STOCKS.keys())

            # Get latest quotes
            request = StockLatestQuoteRequest(symbol_or_symbols=symbols)
            quotes = self.stock_client.get_stock_latest_quote(request)

            # Get historical bars for change calculation and history
            end = datetime.now()
            start = end - timedelta(days=5)
            bars_request = StockBarsRequest(
                symbol_or_symbols=symbols,
                timeframe=TimeFrame.Hour,
                start=start,
                end=end,
            )
            bars = self.stock_client.get_stock_bars(bars_request)

            for symbol in symbols:
                try:
                    quote = quotes.get(symbol)
                    if not quote:
                        continue

                    current_price = float(quote.ask_price + quote.bid_price) / 2

                    # Get history and calculate change
                    # Note: 'symbol in bars' doesn't work correctly with Alpaca BarSet
                    # Use try-except instead
                    try:
                        symbol_bars = bars[symbol]
                        history = [float(b.close) for b in symbol_bars[-24:]]
                    except (KeyError, AttributeError):
                        history = []

                    # Calculate change from previous day
                    prev_close = history[0] if history else current_price
                    change = current_price - prev_close
                    change_pct = (change / prev_close * 100) if prev_close else 0

                    stock = StockData(
                        symbol=symbol,
                        name=DEFENSE_STOCKS[symbol],
                        price=round(current_price, 2),
                        change=round(change, 2),
                        change_percent=round(change_pct, 2),
                        volume=int(quote.ask_size + quote.bid_size),
                        category="defense",
                        history=history,
                    )
                    stocks.append(stock)
                    self.stock_cache[symbol] = stock

                except Exception as e:
                    print(f"Error fetching {symbol}: {e}")

            self.last_fetch = now

        except Exception as e:
            print(f"Alpaca stock fetch error: {e}")
            return self._get_mock_stocks()

        return stocks if stocks else self._get_mock_stocks()

    async def fetch_crypto(self, force: bool = False) -> list[CryptoData]:
        """Fetch crypto via Alpaca (no API keys needed)"""
        now = datetime.now()

        if not force and self.crypto_cache and self.last_fetch:
            if (now - self.last_fetch) < self.fetch_interval:
                return list(self.crypto_cache.values())

        cryptos = []

        if not self.crypto_client:
            return self._get_mock_crypto()

        try:
            symbols = list(CRYPTO_SYMBOLS.keys())

            # Get latest quotes
            request = CryptoLatestQuoteRequest(symbol_or_symbols=symbols)
            quotes = self.crypto_client.get_crypto_latest_quote(request)

            # Get historical bars
            end = datetime.now()
            start = end - timedelta(days=2)
            bars_request = CryptoBarsRequest(
                symbol_or_symbols=symbols,
                timeframe=TimeFrame.Hour,
                start=start,
                end=end,
            )
            bars = self.crypto_client.get_crypto_bars(bars_request)

            for symbol in symbols:
                try:
                    quote = quotes.get(symbol)
                    if not quote:
                        continue

                    current_price = float(quote.ask_price + quote.bid_price) / 2

                    # Get history
                    # Note: 'symbol in bars' doesn't work correctly with Alpaca BarSet
                    try:
                        symbol_bars = bars[symbol]
                        history = [float(b.close) for b in symbol_bars[-24:]]
                    except (KeyError, AttributeError):
                        history = []

                    # Calculate change
                    prev_close = history[0] if history else current_price
                    change = current_price - prev_close
                    change_pct = (change / prev_close * 100) if prev_close else 0

                    # Convert symbol format BTC/USD -> BTC-USD for display
                    display_symbol = symbol.replace("/", "-")

                    crypto = CryptoData(
                        symbol=display_symbol,
                        name=CRYPTO_SYMBOLS[symbol],
                        price=round(current_price, 2),
                        change=round(change, 2),
                        change_percent=round(change_pct, 2),
                        history=history,
                    )
                    cryptos.append(crypto)
                    self.crypto_cache[display_symbol] = crypto

                except Exception as e:
                    print(f"Error fetching {symbol}: {e}")

        except Exception as e:
            print(f"Alpaca crypto fetch error: {e}")
            return self._get_mock_crypto()

        return cryptos if cryptos else self._get_mock_crypto()

    def _get_mock_stocks(self) -> list[StockData]:
        """Return mock data when API is unavailable"""
        import random

        mocks = []
        for symbol, name in DEFENSE_STOCKS.items():
            base_prices = {
                "LMT": 480,
                "RTX": 120,
                "NOC": 500,
                "GD": 300,
                "BA": 180,
                "LHX": 230,
                "HII": 280,
                "KTOS": 25,
            }
            base = base_prices.get(symbol, 100)
            price = base * (1 + random.uniform(-0.02, 0.02))
            change_pct = random.uniform(-3, 5)
            change = price * change_pct / 100
            history = [base * (1 + random.uniform(-0.01, 0.01)) for _ in range(24)]

            mocks.append(
                StockData(
                    symbol=symbol,
                    name=name,
                    price=round(price, 2),
                    change=round(change, 2),
                    change_percent=round(change_pct, 2),
                    volume=random.randint(100000, 5000000),
                    category="defense",
                    history=history,
                )
            )
        return mocks

    def _get_mock_crypto(self) -> list[CryptoData]:
        """Return mock crypto data"""
        import random

        mocks = []
        base_prices = {
            "BTC-USD": 95000,
            "ETH-USD": 3200,
            "SOL-USD": 180,
            "XRP-USD": 2.5,
        }

        for symbol, name in CRYPTO_SYMBOLS.items():
            display_symbol = symbol.replace("/", "-")
            base = base_prices.get(display_symbol, 100)
            price = base * (1 + random.uniform(-0.03, 0.03))
            change_pct = random.uniform(-5, 8)
            change = price * change_pct / 100
            history = [base * (1 + random.uniform(-0.02, 0.02)) for _ in range(24)]

            mocks.append(
                CryptoData(
                    symbol=display_symbol,
                    name=name,
                    price=round(price, 2),
                    change=round(change, 2),
                    change_percent=round(change_pct, 2),
                    history=history,
                )
            )
        return mocks


# Global instance
alpaca_service = AlpacaService()
