"""
Twitter/X Service - Hybrid API
- ScrapeBadger: Trends (5 req/15min free tier)
- GetXAPI: Tweets & Search ($0.001/req, no limits)
"""

import asyncio
import os
import aiohttp
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

# API Keys
SCRAPEBADGER_KEY = os.getenv("SCRAPEBADGER_KEY", "")
GETXAPI_KEY = os.getenv("GETXAPI_KEY", "")

# API Endpoints
SCRAPEBADGER_BASE = "https://scrapebadger.com/v1/twitter"
GETXAPI_BASE = "https://api.getxapi.com"


@dataclass
class Tweet:
    id: str
    author: str
    handle: str
    text: str
    created_at: datetime
    likes: int = 0
    retweets: int = 0
    replies: int = 0
    views: int = 0
    region: Optional[str] = None
    platform: str = "twitter"
    url: Optional[str] = None


@dataclass
class Trend:
    name: str
    url: str
    tweet_volume: Optional[int] = None
    category: Optional[str] = None
    location: str = "Worldwide"
    woeid: int = 1


# WOEID mapping
REGION_WOEIDS = {
    "worldwide": 1,
    "united_states": 23424977,
    "israel": 23424852,
    "united_kingdom": 23424975,
}

# Search terms
TWITTER_SEARCH_TERMS = {
    "iran": ["Iran military", "IRGC"],
    "israel-palestine": ["Gaza", "IDF"],
    "russia-ukraine": ["Ukraine war", "Kyiv"],
    "taiwan-strait": ["Taiwan China"],
    "korea": ["North Korea"],
}

# OSINT accounts
TWITTER_OSINT_ACCOUNTS = [
    "sentdefender",
    "Faytuks",
    "War_Mapper",
    "DefMon3",
]


class TwitterService:
    """Hybrid Twitter service: ScrapeBadger (trends) + GetXAPI (tweets)"""

    def __init__(self):
        self.tweet_cache: list[Tweet] = []
        self.trend_cache: dict[str, list[Trend]] = {}
        self.last_tweet_fetch: Optional[datetime] = None
        self.last_trend_fetch: Optional[datetime] = None
        self.tweet_interval = timedelta(minutes=10)
        self.trend_interval = timedelta(minutes=15)
        self.request_count = {"getxapi": 0, "scrapebadger": 0}

    def _classify_region(self, text: str) -> Optional[str]:
        """Classify tweet by region"""
        text_lower = text.lower()

        keywords = {
            "iran": ["iran", "tehran", "irgc", "ayatollah"],
            "israel-palestine": ["gaza", "israel", "idf", "hamas", "hezbollah"],
            "russia-ukraine": ["ukraine", "russia", "kyiv", "putin", "zelensky"],
            "taiwan-strait": ["taiwan", "pla", "taipei", "chinese military"],
            "korea": ["north korea", "pyongyang", "kim jong", "dprk"],
        }

        for region, words in keywords.items():
            if any(w in text_lower for w in words):
                return region
        return None

    # ========== GetXAPI (Tweets) ==========

    def _parse_getxapi_tweet(self, data: dict) -> Optional[Tweet]:
        """Parse GetXAPI tweet format"""
        try:
            text = data.get("text", "")
            if not text:
                return None

            author = data.get("author", {})
            username = author.get("userName", "unknown")

            created_str = data.get("createdAt", "")
            try:
                created_at = datetime.strptime(created_str, "%a %b %d %H:%M:%S %z %Y")
            except (ValueError, TypeError):
                created_at = datetime.now()

            tweet_id = str(data.get("id", ""))

            return Tweet(
                id=tweet_id,
                author=author.get("name", username),
                handle=f"@{username}",
                text=text[:500],
                created_at=created_at,
                likes=data.get("likeCount", 0),
                retweets=data.get("retweetCount", 0),
                replies=data.get("replyCount", 0),
                views=data.get("viewCount", 0),
                region=self._classify_region(text),
                platform="twitter",
                url=data.get(
                    "url", f"https://twitter.com/{username}/status/{tweet_id}"
                ),
            )
        except Exception as e:
            print(f"GetXAPI parse error: {e}")
            return None

    async def search_tweets(self, query: str, count: int = 10) -> list[Tweet]:
        """Search tweets via GetXAPI"""
        if not GETXAPI_KEY:
            return []

        tweets = []
        url = f"{GETXAPI_BASE}/twitter/tweet/advanced_search"
        params = {"q": query, "product": "Latest"}
        headers = {"Authorization": f"Bearer {GETXAPI_KEY}"}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    params=params,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    self.request_count["getxapi"] += 1

                    if resp.status == 200:
                        data = await resp.json()
                        for item in data.get("tweets", [])[:count]:
                            tweet = self._parse_getxapi_tweet(item)
                            if tweet:
                                tweets.append(tweet)
                    else:
                        print(f"GetXAPI search error: {resp.status}")
        except Exception as e:
            print(f"GetXAPI error: {e}")

        return tweets

    async def get_user_tweets(self, username: str, count: int = 10) -> list[Tweet]:
        """Get user tweets via GetXAPI"""
        if not GETXAPI_KEY:
            return []

        tweets = []
        url = f"{GETXAPI_BASE}/twitter/user/tweets"
        params = {"userName": username}
        headers = {"Authorization": f"Bearer {GETXAPI_KEY}"}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    params=params,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    self.request_count["getxapi"] += 1

                    if resp.status == 200:
                        data = await resp.json()
                        for item in data.get("tweets", [])[:count]:
                            tweet = self._parse_getxapi_tweet(item)
                            if tweet:
                                tweets.append(tweet)
                    else:
                        print(f"GetXAPI user error: {resp.status}")
        except Exception as e:
            print(f"GetXAPI error: {e}")

        return tweets

    # ========== ScrapeBadger (Trends) ==========

    async def get_trends(
        self, woeid: int = 1, location: str = "Worldwide"
    ) -> list[Trend]:
        """Get trends via ScrapeBadger"""
        if not SCRAPEBADGER_KEY:
            return []

        trends = []
        url = f"{SCRAPEBADGER_BASE}/trends/place/{woeid}"
        headers = {"x-api-key": SCRAPEBADGER_KEY}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)
                ) as resp:
                    self.request_count["scrapebadger"] += 1

                    if resp.status == 200:
                        data = await resp.json()
                        for item in data.get("data", data.get("trends", [])):
                            trends.append(
                                Trend(
                                    name=item.get("name", ""),
                                    url=item.get("url", ""),
                                    tweet_volume=item.get("tweet_volume"),
                                    location=location,
                                    woeid=woeid,
                                )
                            )
                    elif resp.status == 429:
                        print("ScrapeBadger: Rate limited (5/15min)")
                    else:
                        print(f"ScrapeBadger trends error: {resp.status}")
        except Exception as e:
            print(f"ScrapeBadger error: {e}")

        return trends

    async def get_geopolitical_trends(
        self, force: bool = False
    ) -> dict[str, list[Trend]]:
        """Get trends from key locations (cached 15min)"""
        now = datetime.now()

        if (
            not force
            and self.last_trend_fetch
            and (now - self.last_trend_fetch) < self.trend_interval
            and self.trend_cache
        ):
            return self.trend_cache

        results = {}

        # Only fetch worldwide to conserve rate limit
        trends = await self.get_trends(1, "Worldwide")
        if trends:
            results["Worldwide"] = trends[:15]

        if results:
            self.trend_cache = results
            self.last_trend_fetch = now

        return results

    # ========== Combined Methods ==========

    async def fetch_all(self, force: bool = False) -> list[Tweet]:
        """Fetch all tweets (OSINT accounts + search)"""
        now = datetime.now()

        if (
            not force
            and self.last_tweet_fetch
            and (now - self.last_tweet_fetch) < self.tweet_interval
            and self.tweet_cache
        ):
            return self.tweet_cache

        if not GETXAPI_KEY:
            print("Twitter: GetXAPI key not configured")
            return []

        all_tweets = []

        # OSINT accounts (3 accounts, 5 tweets each)
        for account in TWITTER_OSINT_ACCOUNTS[:3]:
            tweets = await self.get_user_tweets(account, count=5)
            all_tweets.extend(tweets)
            await asyncio.sleep(0.3)

        # Geopolitical search
        search_tweets = await self.search_tweets(
            "Ukraine OR Gaza OR Taiwan OR Iran", count=15
        )
        all_tweets.extend(search_tweets)

        # Deduplicate & sort
        seen = set()
        unique = []
        for t in all_tweets:
            if t.id not in seen:
                seen.add(t.id)
                unique.append(t)

        unique.sort(key=lambda x: x.created_at, reverse=True)

        self.tweet_cache = unique
        self.last_tweet_fetch = now

        print(
            f"Twitter: {len(unique)} tweets (GetXAPI: {self.request_count['getxapi']} reqs)"
        )
        return unique

    async def fetch_all_with_trends(self, force: bool = False) -> dict:
        """Fetch tweets and trends together"""
        tweets = await self.fetch_all(force)
        trends = await self.get_geopolitical_trends(force)

        return {
            "tweets": tweets,
            "trends": trends,
        }

    def is_configured(self) -> bool:
        """Check if APIs are configured"""
        return bool(GETXAPI_KEY)  # GetXAPI is primary

    def get_status(self) -> dict:
        """Get service status"""
        return {
            "available": True,
            "configured": self.is_configured(),
            "providers": {
                "tweets": "GetXAPI" if GETXAPI_KEY else None,
                "trends": "ScrapeBadger" if SCRAPEBADGER_KEY else None,
            },
            "requests": self.request_count,
            "cache": {
                "tweets": len(self.tweet_cache),
                "trends": len(self.trend_cache),
            },
        }


# Global instance
twitter_service = TwitterService()
