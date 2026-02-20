"""
Truth Social Service
Fetches real posts from Truth Social via CNN archive (updated every 5 minutes)
"""

import aiohttp
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass
import re
import html


@dataclass
class TruthPost:
    id: str
    author: str
    handle: str
    text: str
    created_at: datetime
    likes: int = 0
    reposts: int = 0
    replies: int = 0
    region: Optional[str] = None
    platform: str = "truthsocial"
    url: Optional[str] = None
    media: Optional[list] = None


# CNN's real-time Truth Social archive (updated every 5 minutes)
TRUTH_ARCHIVE_URL = "https://ix.cnn.io/data/truth-social/truth_archive.json"

# Geopolitical keywords for classification
REGION_KEYWORDS = {
    "iran": ["iran", "tehran", "nuclear", "hormuz", "middle east", "iranian"],
    "israel-palestine": [
        "israel",
        "gaza",
        "hamas",
        "netanyahu",
        "palestine",
        "palestinian",
        "jewish",
        "jews",
    ],
    "russia-ukraine": [
        "russia",
        "ukraine",
        "putin",
        "zelensky",
        "nato",
        "kyiv",
        "russian",
        "ukrainian",
    ],
    "taiwan-strait": ["china", "taiwan", "beijing", "xi jinping", "chinese", "ccp"],
    "korea": ["north korea", "kim jong", "korea", "pyongyang", "korean"],
}


class TruthSocialService:
    def __init__(self):
        self.cache: list[TruthPost] = []
        self.last_fetch: Optional[datetime] = None
        self.fetch_interval = timedelta(minutes=5)

    def _classify_region(self, text: str) -> Optional[str]:
        """Classify post by region"""
        text_lower = text.lower()
        for region, keywords in REGION_KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                return region
        return None

    def _clean_html(self, text: str) -> str:
        """Remove HTML tags and decode entities"""
        # Remove HTML tags
        text = re.sub(r"<[^>]+>", "", text)
        # Decode HTML entities
        text = html.unescape(text)
        return text.strip()

    async def fetch_all(self, force: bool = False) -> list[TruthPost]:
        """Fetch Truth Social posts from CNN archive"""
        now = datetime.now()

        if (
            not force
            and self.cache
            and self.last_fetch
            and (now - self.last_fetch) < self.fetch_interval
        ):
            return self.cache

        posts = []

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    TRUTH_ARCHIVE_URL,
                    timeout=aiohttp.ClientTimeout(total=15),
                    headers={"User-Agent": "Mozilla/5.0"},
                ) as response:
                    if response.status == 200:
                        data = await response.json()

                        # Get recent posts (last 50)
                        for item in data[:50]:
                            try:
                                content = self._clean_html(item.get("content", ""))

                                # Skip empty posts or media-only posts
                                if not content or len(content) < 10:
                                    continue

                                # Parse datetime
                                created_str = item.get("created_at", "")
                                try:
                                    created_at = datetime.fromisoformat(
                                        created_str.replace("Z", "+00:00")
                                    )
                                except Exception:
                                    created_at = datetime.now()

                                region = self._classify_region(content)

                                post = TruthPost(
                                    id=item.get("id", ""),
                                    author="Donald J. Trump",
                                    handle="@realDonaldTrump",
                                    text=content[:500],
                                    created_at=created_at,
                                    likes=item.get("favourites_count", 0),
                                    reposts=item.get("reblogs_count", 0),
                                    replies=item.get("replies_count", 0),
                                    region=region,
                                    platform="truthsocial",
                                    url=item.get("url", ""),
                                    media=item.get("media", []),
                                )
                                posts.append(post)

                            except Exception as e:
                                print(f"Error parsing Truth Social post: {e}")
                                continue

                        print(
                            f"✅ Fetched {len(posts)} Truth Social posts with real engagement data"
                        )

        except Exception as e:
            print(f"Error fetching Truth Social archive: {e}")
            # Return cached data if available
            if self.cache:
                return self.cache

        if posts:
            self.cache = posts
            self.last_fetch = now

        return self.cache if self.cache else []

    def get_social_volume(self, region: str) -> float:
        """Calculate social volume for a region"""
        if not self.cache:
            return 0.0

        region_posts = [p for p in self.cache if p.region == region]

        if not region_posts:
            return 0.0

        # Calculate volume based on engagement
        total_engagement = sum(p.likes + p.reposts + p.replies for p in region_posts)

        # Normalize to 0-100 scale (assume 100K engagement is max)
        return min(total_engagement / 1000, 100)


# Global instance
truthsocial_service = TruthSocialService()
