"""
Bluesky Social Service
Fetches posts from Bluesky for geopolitical monitoring
"""

import asyncio
import aiohttp
import random
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass

from app.core.proxy import get_proxy


# Rate limiting
MAX_CONCURRENT = 3
REQUEST_DELAY = 0.3


@dataclass
class SocialPost:
    id: str
    author: str
    handle: str
    text: str
    created_at: datetime
    likes: int = 0
    reposts: int = 0
    region: Optional[str] = None
    platform: str = "bluesky"
    url: Optional[str] = None


# Bluesky API endpoints
BSKY_API = "https://public.api.bsky.app"

# Search terms for each region
SEARCH_TERMS = {
    "iran": [
        "Iran strike",
        "IRGC",
        "Strait of Hormuz",
        "Iran nuclear",
        "Tehran",
        "Iran sanctions",
        "Iran Israel",
    ],
    "israel-palestine": [
        "Gaza",
        "IDF",
        "Hamas",
        "Netanyahu",
        "Rafah",
        "Israel strike",
        "ceasefire",
        "hostages Gaza",
    ],
    "russia-ukraine": [
        "Ukraine war",
        "Kyiv strike",
        "Russian invasion",
        "Zelensky",
        "Putin Ukraine",
        "Bakhmut",
        "Kharkiv",
    ],
    "taiwan-strait": [
        "Taiwan China",
        "Taiwan strait",
        "PLA Taiwan",
        "TSMC",
        "China military",
        "Taiwan independence",
    ],
    "korea": [
        "North Korea missile",
        "Kim Jong Un",
        "ICBM test",
        "Korean peninsula",
        "DMZ",
        "Pyongyang",
    ],
}

# OSINT accounts to monitor (handles without @)
# Updated Feb 2026 with active accounts
OSINT_ACCOUNTS = [
    # Active Ukraine/OSINT
    "osintradar.bsky.social",  # OSINT Radar - daily updates
    "osinttechnical.bsky.social",  # OSINT Technical
    "warontherocks.bsky.social",  # War on the Rocks
    "bendobrown.bsky.social",  # Benjamin Strick - Bellingcat
    "warmapper.org",  # War Mapper - Ukraine maps
    # General OSINT
    "bellingcat.com",  # Bellingcat official
    "osint.industries",  # OSINT Industries
    # Backup accounts (may be less active)
    "intelcrab.bsky.social",
    "sentdefender.bsky.social",
]


class BlueskyService:
    def __init__(self):
        self.cache: dict[str, list[SocialPost]] = {}
        self.last_fetch: Optional[datetime] = None
        self.fetch_interval = timedelta(minutes=3)

    def _classify_region(self, text: str) -> Optional[str]:
        """Classify post by region"""
        text_lower = text.lower()

        for region, terms in SEARCH_TERMS.items():
            for term in terms:
                if term.lower() in text_lower:
                    return region
        return None

    async def _search_posts(
        self,
        session: aiohttp.ClientSession,
        query: str,
        limit: int = 25,
        semaphore: Optional[asyncio.Semaphore] = None,
    ) -> list[SocialPost]:
        """Search Bluesky posts with rate limiting"""
        posts = []

        async def do_request():
            nonlocal posts
            await asyncio.sleep(REQUEST_DELAY + random.uniform(0, 0.2))

            for attempt in range(2):
                try:
                    url = f"{BSKY_API}/xrpc/app.bsky.feed.searchPosts"
                    params = {"q": query, "limit": limit, "sort": "latest"}

                    async with session.get(
                        url,
                        params=params,
                        timeout=aiohttp.ClientTimeout(total=10),
                        proxy=get_proxy(),
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            for post in data.get("posts", []):
                                try:
                                    author = post.get("author", {})
                                    record = post.get("record", {})

                                    created_str = record.get("createdAt", "")
                                    created_at = (
                                        datetime.fromisoformat(
                                            created_str.replace("Z", "+00:00")
                                        )
                                        if created_str
                                        else datetime.now()
                                    )

                                    text = record.get("text", "")
                                    region = self._classify_region(text)

                                    handle = author.get("handle", "")
                                    uri = post.get("uri", "")
                                    rkey = uri.split("/")[-1] if "/" in uri else ""
                                    post_url = (
                                        f"https://bsky.app/profile/{handle}/post/{rkey}"
                                        if handle and rkey
                                        else None
                                    )

                                    social_post = SocialPost(
                                        id=uri,
                                        author=author.get(
                                            "displayName",
                                            author.get("handle", "Unknown"),
                                        ),
                                        handle=f"@{handle}",
                                        text=text[:500],
                                        created_at=created_at,
                                        likes=post.get("likeCount", 0),
                                        reposts=post.get("repostCount", 0),
                                        region=region,
                                        platform="bluesky",
                                        url=post_url,
                                    )
                                    posts.append(social_post)
                                except Exception:
                                    continue
                            return
                        elif response.status in (403, 429):
                            await asyncio.sleep((attempt + 1) * 2)
                            continue
                        else:
                            return
                except asyncio.TimeoutError:
                    pass
                except Exception as e:
                    if attempt == 1:
                        print(f"Bluesky search error for '{query}': {e}")

        if semaphore:
            async with semaphore:
                await do_request()
        else:
            await do_request()

        return posts

    async def _get_account_feed(
        self,
        session: aiohttp.ClientSession,
        handle: str,
        limit: int = 10,
        semaphore: Optional[asyncio.Semaphore] = None,
    ) -> list[SocialPost]:
        """Get posts from a specific account with rate limiting"""
        posts = []

        async def do_request():
            nonlocal posts
            await asyncio.sleep(REQUEST_DELAY + random.uniform(0, 0.2))

            try:
                # First resolve handle to DID
                url = f"{BSKY_API}/xrpc/com.atproto.identity.resolveHandle"
                params = {"handle": handle}

                async with session.get(
                    url,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=5),
                    proxy=get_proxy(),
                ) as response:
                    if response.status != 200:
                        return
                    data = await response.json()
                    did = data.get("did")

                if not did:
                    return

                await asyncio.sleep(0.2)  # Brief pause between requests

                # Get author feed
                url = f"{BSKY_API}/xrpc/app.bsky.feed.getAuthorFeed"
                params = {"actor": did, "limit": limit}

                async with session.get(
                    url,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=10),
                    proxy=get_proxy(),
                ) as response:
                    if response.status == 200:
                        data = await response.json()

                        for item in data.get("feed", []):
                            post = item.get("post", {})
                            author = post.get("author", {})
                            record = post.get("record", {})

                            created_str = record.get("createdAt", "")
                            created_at = (
                                datetime.fromisoformat(
                                    created_str.replace("Z", "+00:00")
                                )
                                if created_str
                                else datetime.now()
                            )

                            text = record.get("text", "")
                            region = self._classify_region(text)

                            uri = post.get("uri", "")
                            rkey = uri.split("/")[-1] if "/" in uri else ""
                            post_url = (
                                f"https://bsky.app/profile/{handle}/post/{rkey}"
                                if rkey
                                else None
                            )

                            social_post = SocialPost(
                                id=uri,
                                author=author.get("displayName", handle),
                                handle=f"@{handle}",
                                text=text[:500],
                                created_at=created_at,
                                likes=post.get("likeCount", 0),
                                reposts=post.get("repostCount", 0),
                                region=region,
                                platform="bluesky",
                                url=post_url,
                            )
                            posts.append(social_post)
            except Exception as e:
                print(f"Bluesky account feed error for {handle}: {e}")

        if semaphore:
            async with semaphore:
                await do_request()
        else:
            await do_request()

        return posts

    async def fetch_all(self, force: bool = False) -> list[SocialPost]:
        """Fetch posts from searches and monitored accounts with rate limiting"""
        now = datetime.now()

        # Use cache if recent
        if (
            not force
            and self.last_fetch
            and (now - self.last_fetch) < self.fetch_interval
        ):
            all_posts = []
            for posts in self.cache.values():
                all_posts.extend(posts)
            return sorted(all_posts, key=lambda x: x.created_at, reverse=True)

        all_posts = []
        semaphore = asyncio.Semaphore(MAX_CONCURRENT)

        async with aiohttp.ClientSession() as session:
            # OSINT account feeds are more reliable (search API often returns 403)
            # Increase limit since search might not work
            account_tasks = [
                self._get_account_feed(session, handle, limit=15, semaphore=semaphore)
                for handle in OSINT_ACCOUNTS
            ]

            # Try search as well (may fail with 403)
            search_tasks = []
            for region, terms in SEARCH_TERMS.items():
                for term in terms[:1]:
                    search_tasks.append(
                        self._search_posts(session, term, limit=10, semaphore=semaphore)
                    )

            # Execute account feeds first (more reliable)
            account_results = await asyncio.gather(
                *account_tasks, return_exceptions=True
            )
            for result in account_results:
                if isinstance(result, list):
                    all_posts.extend(result)

            # Then try search (might fail)
            search_results = await asyncio.gather(*search_tasks, return_exceptions=True)
            for result in search_results:
                if isinstance(result, list):
                    all_posts.extend(result)

        # Deduplicate by ID
        seen_ids = set()
        unique_posts = []
        for post in all_posts:
            if post.id not in seen_ids:
                seen_ids.add(post.id)
                unique_posts.append(post)

        # Cache by region
        self.cache.clear()
        for post in unique_posts:
            region = post.region or "global"
            if region not in self.cache:
                self.cache[region] = []
            self.cache[region].append(post)

        self.last_fetch = now

        return sorted(unique_posts, key=lambda x: x.created_at, reverse=True)

    async def fetch_by_region(self, region: str) -> list[SocialPost]:
        """Fetch posts for a specific region"""
        await self.fetch_all()
        return self.cache.get(region, [])

    def get_social_volume(self, region: str) -> float:
        """Calculate social volume for a region based on post count and engagement"""
        posts = self.cache.get(region, [])

        if not posts:
            return 0.0

        # Count posts for this region
        post_count = len(posts)

        # Calculate total engagement
        engagement = sum(p.likes + p.reposts for p in posts)

        # Normalize: 10+ posts = good, 100+ engagement = good
        post_score = min(post_count / 5 * 50, 50)
        engagement_score = min(engagement / 50 * 50, 50)

        return post_score + engagement_score


# Global instance
bluesky_service = BlueskyService()
