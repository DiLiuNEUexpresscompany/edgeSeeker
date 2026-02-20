"""
Polymarket Service
Fetches prediction market data for geopolitical events ONLY
"""

import asyncio
import aiohttp
import random
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass


# Rate limiting
REQUEST_DELAY = 0.5


@dataclass
class PredictionMarket:
    id: str
    question: str
    outcome_yes: float
    outcome_no: float
    volume: float
    liquidity: float
    region: Optional[str] = None
    end_date: Optional[datetime] = None
    change_24h: float = 0.0
    slug: Optional[str] = None
    history: Optional[list] = None  # Price history for charts
    clob_token_id: Optional[str] = None  # For fetching price history
    volume_24h: float = 0.0  # 24h trading volume

    def __post_init__(self):
        if self.history is None:
            self.history = []


GAMMA_API = "https://gamma-api.polymarket.com"

# STRICT keywords - must match geopolitical content
GEOPOLITICAL_KEYWORDS = {
    "iran": [
        "iran",
        "iranian",
        "tehran",
        "hormuz",
        "irgc",
        "ayatollah",
        "strike iran",
        "bomb iran",
        "iran nuclear",
        "iran war",
    ],
    "israel-palestine": [
        "israel",
        "israeli",
        "gaza",
        "hamas",
        "netanyahu",
        "idf",
        "palestine",
        "ceasefire gaza",
        "hostage",
        "hezbollah",
    ],
    "russia-ukraine": [
        "ukraine",
        "ukrainian",
        "russia",
        "russian",
        "kyiv",
        "moscow",
        "putin",
        "zelensky",
        "crimea",
        "donbas",
        "nato",
    ],
    "taiwan-strait": [
        "taiwan",
        "china invade",
        "china attack",
        "pla",
        "taiwan strait",
        "xi jinping war",
        "reunification",
    ],
    "korea": [
        "north korea",
        "dprk",
        "pyongyang",
        "kim jong",
        "korean war",
        "icbm",
        "korean peninsula",
    ],
}

# Words that indicate NON-geopolitical content - EXCLUDE these
EXCLUDE_KEYWORDS = [
    # Sports
    "nba",
    "nfl",
    "mlb",
    "nhl",
    "sports",
    "basketball",
    "football",
    "soccer",
    "baseball",
    "hockey",
    "tennis",
    "golf",
    "cricket",
    "rugby",
    "f1",
    "nascar",
    "premier league",
    "la liga",
    "bundesliga",
    "serie a",
    "ligue 1",
    "mls",
    "champions league",
    "europa league",
    "english premier",
    "epl",
    "ronaldo",
    "messi",
    "haaland",
    "mbappe",
    "brentford",
    "arsenal",
    "chelsea",
    "manchester",
    "liverpool",
    "barcelona",
    "real madrid",
    "fc ",
    "fc.",
    "galaxy",
    "toronto fc",
    "cincinnati",
    "dallas",
    "last place",
    # Entertainment
    "oscar",
    "grammy",
    "emmy",
    "award",
    "movie",
    "film",
    "album",
    "song",
    "netflix",
    "beast games",
    "mr beast",
    "mrbeast",
    "player 1",
    "player 2",
    "player 19",
    "retirement plan",
    "animated short",
    "win best",
    "youtube",
    "tiktok",
    # Crypto
    "crypto",
    "bitcoin",
    "ethereum",
    "doge",
    "memecoin",
    "solana",
    "token",
    # Esports
    "esports",
    "lol",
    "dota",
    "csgo",
    "valorant",
    "league of legends",
    "lpl",
    # Sports events
    "super bowl",
    "world cup",
    "playoffs",
    "championship",
    "finals",
    # NBA players
    "jimmy butler",
    "lebron",
    "curry",
    "clutch player",
    "defensive player",
    "ivica zubac",
    "mvp",
    "rookie",
    "all-star",
    "season 2",
    # Personal
    "dating",
    "married",
    "pregnant",
    "baby",
    "celebrity",
    "kardashian",
]


class PolymarketService:
    def __init__(self):
        self.cache: dict[str, list[PredictionMarket]] = {}
        self.all_markets: list[PredictionMarket] = []
        self.last_fetch: Optional[datetime] = None
        self.fetch_interval = timedelta(minutes=5)

    def _is_geopolitical(self, question: str) -> bool:
        """Check if market is about geopolitics"""
        q_lower = question.lower()

        # Exclude non-geopolitical content
        if any(excl in q_lower for excl in EXCLUDE_KEYWORDS):
            return False

        # Must match geopolitical keywords
        for keywords in GEOPOLITICAL_KEYWORDS.values():
            if any(kw in q_lower for kw in keywords):
                return True

        # Also accept general conflict/military terms
        conflict_terms = [
            "war",
            "strike",
            "invasion",
            "military",
            "troops",
            "missile",
            "nuclear",
            "conflict",
            "sanctions",
        ]
        country_terms = [
            "us ",
            "united states",
            "china",
            "russia",
            "iran",
            "israel",
            "ukraine",
            "korea",
            "taiwan",
        ]

        has_conflict = any(ct in q_lower for ct in conflict_terms)
        has_country = any(ct in q_lower for ct in country_terms)

        return has_conflict and has_country

    def _classify_region(self, question: str) -> Optional[str]:
        """Classify market by region - STRICT"""
        q_lower = question.lower()

        scores = {}
        for region, keywords in GEOPOLITICAL_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in q_lower)
            if score > 0:
                scores[region] = score

        if scores:
            return max(scores, key=lambda x: scores[x])
        return None

    def _parse_market(self, market: dict) -> Optional[PredictionMarket]:
        """Parse a single market from API response"""
        import json as json_module

        try:
            question = market.get("question", "")
            if not question:
                return None

            # Exclude non-geopolitical content
            q_lower = question.lower()
            if any(excl in q_lower for excl in EXCLUDE_KEYWORDS):
                return None

            # Classify region (relaxed - allow None)
            region = self._classify_region(question)

            # Parse prices
            outcome_prices_raw = market.get("outcomePrices", "[]")
            yes_price = 0.5
            no_price = 0.5

            try:
                if isinstance(outcome_prices_raw, str):
                    outcome_prices = json_module.loads(outcome_prices_raw)
                else:
                    outcome_prices = outcome_prices_raw

                if isinstance(outcome_prices, list) and len(outcome_prices) >= 2:
                    yes_price = float(outcome_prices[0]) if outcome_prices[0] else 0.5
                    no_price = float(outcome_prices[1]) if outcome_prices[1] else 0.5
                elif isinstance(outcome_prices, list) and len(outcome_prices) == 1:
                    yes_price = float(outcome_prices[0]) if outcome_prices[0] else 0.5
                    no_price = 1 - yes_price
            except (ValueError, TypeError, json_module.JSONDecodeError):
                pass

            # Parse end date
            end_date = None
            end_str = market.get("endDate") or market.get("end_date_iso")
            if end_str:
                try:
                    end_date = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
                except Exception:
                    pass

            # Get CLOB token ID for price history
            clob_ids_raw = market.get("clobTokenIds", "[]")
            try:
                if isinstance(clob_ids_raw, str):
                    clob_ids = json_module.loads(clob_ids_raw)
                else:
                    clob_ids = clob_ids_raw
            except (json_module.JSONDecodeError, TypeError):
                clob_ids = []
            clob_token_id = clob_ids[0] if clob_ids and len(clob_ids) > 0 else None

            # Get 24h volume
            volume_24h = float(market.get("volume24hr", 0) or 0)

            return PredictionMarket(
                id=str(market.get("id", market.get("condition_id", ""))),
                question=question[:250],
                outcome_yes=yes_price,
                outcome_no=no_price,
                volume=float(market.get("volume", 0) or 0),
                liquidity=float(market.get("liquidity", 0) or 0),
                region=region,
                end_date=end_date,
                change_24h=0.0,  # Will calculate from history if available
                slug=market.get("slug"),
                history=[],
                clob_token_id=clob_token_id,
                volume_24h=volume_24h,
            )
        except Exception:
            return None

    async def _fetch_with_retry(
        self,
        session: aiohttp.ClientSession,
        url: str,
        params: dict,
        tag_name: str = "api",
    ) -> list:
        """Fetch with retry and rate limiting"""
        await asyncio.sleep(REQUEST_DELAY + random.uniform(0, 0.3))

        for attempt in range(3):
            try:
                async with session.get(
                    url, params=params, timeout=aiohttp.ClientTimeout(total=20)
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status in (429, 503):
                        wait = (2**attempt) + random.uniform(0, 1)
                        print(
                            f"Polymarket rate limited ({tag_name}), waiting {wait:.1f}s"
                        )
                        await asyncio.sleep(wait)
                        continue
                    else:
                        return []
            except asyncio.TimeoutError:
                pass
            except Exception as e:
                if attempt == 2:
                    print(f"Polymarket {tag_name} fetch error: {e}")

            if attempt < 2:
                await asyncio.sleep(1)
        return []

    async def _fetch_markets(
        self, session: aiohttp.ClientSession
    ) -> list[PredictionMarket]:
        """Fetch markets from Polymarket - geopolitics tag + keyword search"""
        markets = []
        seen_ids = set()

        # Strategy 1: Fetch from geopolitics tag
        data = await self._fetch_with_retry(
            session,
            f"{GAMMA_API}/markets",
            {
                "closed": "false",
                "limit": 100,
                "order": "volume",
                "ascending": "false",
                "tag": "geopolitics",
            },
            "geopolitics",
        )
        for market in data:
            pm = self._parse_market(market)
            if pm and pm.id not in seen_ids:
                if not pm.region:
                    pm.region = self._classify_region(pm.question) or "global"
                markets.append(pm)
                seen_ids.add(pm.id)

        # Strategy 2: Fetch from politics tag
        data = await self._fetch_with_retry(
            session,
            f"{GAMMA_API}/markets",
            {
                "closed": "false",
                "limit": 100,
                "order": "volume",
                "ascending": "false",
                "tag": "politics",
            },
            "politics",
        )
        for market in data:
            pm = self._parse_market(market)
            if pm and pm.id not in seen_ids:
                if self._is_geopolitical(pm.question):
                    if not pm.region:
                        pm.region = self._classify_region(pm.question) or "global"
                    markets.append(pm)
                    seen_ids.add(pm.id)

        # Strategy 3: General search with high volume
        data = await self._fetch_with_retry(
            session,
            f"{GAMMA_API}/markets",
            {"closed": "false", "limit": 200, "order": "volume", "ascending": "false"},
            "general",
        )
        for market in data:
            pm = self._parse_market(market)
            if pm and pm.id not in seen_ids:
                if self._is_geopolitical(pm.question):
                    region = self._classify_region(pm.question)
                    if region:
                        pm.region = region
                        markets.append(pm)
                        seen_ids.add(pm.id)

        return markets

    async def fetch_all(self, force: bool = False) -> list[PredictionMarket]:
        """Fetch all geopolitical prediction markets"""
        now = datetime.now()

        if (
            not force
            and self.all_markets
            and self.last_fetch
            and (now - self.last_fetch) < self.fetch_interval
        ):
            return self.all_markets

        async with aiohttp.ClientSession() as session:
            markets = await self._fetch_markets(session)

        # Deduplicate and cache by region
        seen = set()
        unique = []
        self.cache.clear()

        for m in markets:
            if m.id not in seen:
                seen.add(m.id)
                unique.append(m)

                region = m.region or "global"
                if region not in self.cache:
                    self.cache[region] = []
                self.cache[region].append(m)

        # Sort by volume
        unique.sort(key=lambda x: x.volume, reverse=True)

        self.all_markets = unique
        self.last_fetch = now

        return unique

    async def fetch_by_region(self, region: str) -> list[PredictionMarket]:
        """Fetch markets for a specific region"""
        await self.fetch_all()
        return self.cache.get(region, [])

    async def _fetch_price_history(
        self, session: aiohttp.ClientSession, clob_token_id: str
    ) -> tuple[list, float]:
        """Fetch price history for a market from CLOB API. Returns (history, change_24h)"""
        try:
            url = "https://clob.polymarket.com/prices-history"
            params = {
                "market": clob_token_id,
                "interval": "1d",
                "fidelity": 50,
            }

            async with session.get(
                url, params=params, timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    raw_history = data.get("history", [])

                    # Extract prices as percentages
                    history = [
                        round(float(p.get("p", 0.5)) * 100, 1)
                        for p in raw_history[-30:]
                    ]

                    # Calculate 24h change - compare first and last points
                    change_24h = 0.0
                    if len(history) >= 2:
                        old_price = history[0]  # earliest price in history
                        new_price = history[-1]  # current price
                        change_24h = (
                            new_price - old_price
                        )  # absolute change in percentage points

                    return history, change_24h
        except Exception as e:
            print(f"Price history fetch error: {e}")
        return [], 0.0

    async def fetch_market_with_history(
        self, market_id: str
    ) -> Optional[PredictionMarket]:
        """Fetch a single market with price history"""
        # Find market in cache
        for m in self.all_markets:
            if m.id == market_id:
                if not m.history and m.clob_token_id:
                    async with aiohttp.ClientSession() as session:
                        history, change = await self._fetch_price_history(
                            session, m.clob_token_id
                        )
                        m.history = history
                        if change != 0:
                            m.change_24h = change
                return m
        return None

    async def fetch_top_markets_history(self, limit: int = 10):
        """Fetch history for top N markets (by volume)"""
        async with aiohttp.ClientSession() as session:
            for m in self.all_markets[:limit]:
                if not m.history and m.clob_token_id:
                    history, change = await self._fetch_price_history(
                        session, m.clob_token_id
                    )
                    m.history = history
                    if change != 0:
                        m.change_24h = change

    def get_prediction_volatility(self, region: str) -> float:
        """Calculate prediction volatility for a region"""
        markets = self.cache.get(region, [])

        if not markets:
            return 0.0

        volatility = 0.0
        for m in markets:
            # Extreme prices (near 0% or 100%) = high certainty = lower volatility
            # Middle prices (near 50%) = high uncertainty = higher volatility
            uncertainty = 1 - abs(m.outcome_yes - 0.5) * 2

            # Factor in price change
            change_factor = min(abs(m.change_24h) / 5, 1.0)

            # Weight by volume (more volume = more significant)
            volume_weight = min(m.volume / 50000, 1.0)

            market_vol = (uncertainty * 0.6 + change_factor * 0.4) * volume_weight * 100
            volatility += market_vol

        return min(volatility / max(len(markets), 1), 100)


# Global instance
polymarket_service = PolymarketService()
