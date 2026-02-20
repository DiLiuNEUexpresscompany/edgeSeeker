"""
Google Trends Service
Fetches real-time search trend data for geopolitical keywords
"""

import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional
from dataclasses import dataclass, field

try:
    from pytrends.request import TrendReq
    PYTRENDS_AVAILABLE = True
except ImportError:
    PYTRENDS_AVAILABLE = False
    print("⚠️ pytrends not installed. Run: uv pip install pytrends")


@dataclass
class TrendData:
    keyword: str
    interest: int  # 0-100 scale
    region: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


# Keywords to track for each region
REGION_KEYWORDS = {
    "russia-ukraine": ["Ukraine war", "Russia Ukraine", "Kyiv", "Zelensky"],
    "israel-palestine": ["Gaza", "Israel Hamas", "Netanyahu", "IDF"],
    "iran": ["Iran nuclear", "Iran Israel", "IRGC", "Tehran"],
    "taiwan-strait": ["Taiwan China", "Taiwan strait", "PLA", "TSMC"],
    "korea": ["North Korea", "Kim Jong Un", "ICBM", "Korean peninsula"],
}


class GoogleTrendsService:
    def __init__(self):
        self.pytrends = None
        self.cache: dict[str, dict] = {}  # region -> {interest, timestamp}
        self.cache_duration = timedelta(minutes=30)
        self._init_client()

    def _init_client(self):
        """Initialize pytrends client"""
        if PYTRENDS_AVAILABLE:
            try:
                self.pytrends = TrendReq(hl='en-US', tz=0, timeout=(10, 25))
                print("✅ Google Trends client initialized")
            except Exception as e:
                print(f"⚠️ Failed to initialize Google Trends: {e}")
                self.pytrends = None

    def is_configured(self) -> bool:
        return self.pytrends is not None

    async def get_trend_interest(self, region: str) -> float:
        """Get average trend interest for a region's keywords (0-100)"""
        if not self.is_configured():
            return 50.0  # Default middle value

        # Check cache
        now = datetime.now(timezone.utc)
        if region in self.cache:
            cached = self.cache[region]
            if now - cached["timestamp"] < self.cache_duration:
                return cached["interest"]

        keywords = REGION_KEYWORDS.get(region, [])
        if not keywords:
            return 50.0

        try:
            # Run in thread pool to avoid blocking
            interest = await asyncio.to_thread(
                self._fetch_interest, keywords[:5]  # Max 5 keywords per request
            )
            
            # Cache result
            self.cache[region] = {
                "interest": interest,
                "timestamp": now
            }
            
            return interest

        except Exception as e:
            print(f"Google Trends error for {region}: {e}")
            return self.cache.get(region, {}).get("interest", 50.0)

    def _fetch_interest(self, keywords: list[str]) -> float:
        """Fetch interest from Google Trends (blocking call)"""
        if not self.pytrends:
            return 50.0

        try:
            # Build payload for interest over time (last 7 days)
            self.pytrends.build_payload(keywords, timeframe='now 7-d', geo='')
            
            # Get interest over time
            interest_df = self.pytrends.interest_over_time()
            
            if interest_df.empty:
                return 50.0

            # Calculate average interest across all keywords
            # Drop 'isPartial' column if exists
            if 'isPartial' in interest_df.columns:
                interest_df = interest_df.drop(columns=['isPartial'])
            
            # Get the latest values and average them
            latest_values = interest_df.iloc[-1].values
            avg_interest = float(sum(latest_values) / len(latest_values))
            
            return min(100.0, max(0.0, avg_interest))

        except Exception as e:
            print(f"Pytrends fetch error: {e}")
            return 50.0

    async def get_all_regions_interest(self) -> dict[str, float]:
        """Get trend interest for all tracked regions"""
        results = {}
        
        for region in REGION_KEYWORDS.keys():
            results[region] = await self.get_trend_interest(region)
            # Small delay to avoid rate limiting
            await asyncio.sleep(0.5)
        
        return results

    def get_status(self) -> dict:
        return {
            "available": self.is_configured(),
            "provider": "Google Trends (pytrends)",
            "cached_regions": list(self.cache.keys()),
        }


# Global instance
google_trends_service = GoogleTrendsService()
