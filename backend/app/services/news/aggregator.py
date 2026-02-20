"""
News Aggregator Service - RSS Feeds
Aggregates news from multiple sources for geopolitical monitoring
"""

import asyncio
import aiohttp
import feedparser
import random
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass
import re
import html


# Rate limiting for RSS feeds
MAX_CONCURRENT = 4
REQUEST_DELAY = 0.2


@dataclass
class NewsItem:
    id: str
    title: str
    summary: str
    source: str
    source_id: str
    url: str
    published: datetime
    region: Optional[str] = None
    classification: str = "OSINT"
    relevance_score: float = 0.0


# RSS Feed sources - FOCUSED on geopolitics/defense
RSS_FEEDS = {
    # Wire Services
    "reuters_world": {
        "url": "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best",
        "name": "Reuters",
        "source_id": "WIRE-RTR",
    },
    # Defense & Military
    "defense_one": {
        "url": "https://www.defenseone.com/rss/all/",
        "name": "Defense One",
        "source_id": "MILINT-D1",
    },
    "breaking_defense": {
        "url": "https://breakingdefense.com/feed/",
        "name": "Breaking Defense",
        "source_id": "MILINT-BD",
    },
    "war_on_rocks": {
        "url": "https://warontherocks.com/feed/",
        "name": "War on the Rocks",
        "source_id": "MILINT-WOR",
    },
    # Middle East
    "al_monitor": {
        "url": "https://www.al-monitor.com/rss",
        "name": "Al-Monitor",
        "source_id": "OSINT-ALM",
    },
    "times_israel": {
        "url": "https://www.timesofisrael.com/feed/",
        "name": "Times of Israel",
        "source_id": "OSINT-TOI",
    },
    "jerusalem_post": {
        "url": "https://www.jpost.com/rss/rssfeedsfrontpage.aspx",
        "name": "Jerusalem Post",
        "source_id": "OSINT-JP",
    },
    "iran_intl": {
        "url": "https://www.iranintl.com/en/rss",
        "name": "Iran International",
        "source_id": "OSINT-IRI",
    },
    # Asia-Pacific
    "scmp_china": {
        "url": "https://www.scmp.com/rss/5/feed",
        "name": "SCMP China",
        "source_id": "OSINT-SCMP",
    },
    "taipei_times": {
        "url": "https://www.taipeitimes.com/xml/index.rss",
        "name": "Taipei Times",
        "source_id": "OSINT-TT",
    },
    "nk_news": {
        "url": "https://www.nknews.org/feed/",
        "name": "NK News",
        "source_id": "OSINT-NK",
    },
    # Europe/Russia-Ukraine
    "kyiv_independent": {
        "url": "https://kyivindependent.com/feed/",
        "name": "Kyiv Independent",
        "source_id": "OSINT-KI",
    },
    "ukraine_pravda": {
        "url": "https://www.pravda.com.ua/eng/rss/",
        "name": "Ukrainska Pravda",
        "source_id": "OSINT-UP",
    },
    # General but filtered
    "bbc_world": {
        "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "name": "BBC World",
        "source_id": "OSINT-BBC",
    },
    "aljazeera": {
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "name": "Al Jazeera",
        "source_id": "OSINT-AJ",
    },
}

# Keywords for region classification - STRICT matching
REGION_KEYWORDS = {
    "iran": [
        "iran",
        "iranian",
        "tehran",
        "persian gulf",
        "strait of hormuz",
        "irgc",
        "khamenei",
        "raisi",
        "rouhani",
        "nuclear deal",
        "jcpoa",
        "enrichment",
        "natanz",
        "fordow",
        "parchin",
        "hezbollah",
        "quds force",
        "soleimani",
        "sanctions iran",
        "revolutionary guard",
        "ayatollah",
        "isfahan",
    ],
    "israel-palestine": [
        "israel",
        "israeli",
        "gaza",
        "hamas",
        "netanyahu",
        "idf",
        "west bank",
        "tel aviv",
        "jerusalem",
        "rafah",
        "khan younis",
        "hezbollah",
        "lebanon",
        "beirut",
        "ceasefire",
        "hostage",
        "kibbutz",
        "iron dome",
        "palestinian",
        "mossad",
        "shin bet",
        "houthi",
        "red sea",
        "yemen strike",
    ],
    "russia-ukraine": [
        "ukraine",
        "ukrainian",
        "russia",
        "russian",
        "kyiv",
        "kiev",
        "moscow",
        "putin",
        "zelensky",
        "donbas",
        "donetsk",
        "luhansk",
        "crimea",
        "kharkiv",
        "mariupol",
        "bakhmut",
        "kherson",
        "odesa",
        "wagner",
        "drone strike",
        "himars",
        "patriot missile",
        "f-16",
        "kursk",
        "belgorod",
    ],
    "taiwan-strait": [
        "taiwan",
        "taiwanese",
        "taipei",
        "china military",
        "pla navy",
        "pla air",
        "taiwan strait",
        "south china sea",
        "xi jinping",
        "tsmc",
        "reunification",
        "one china",
        "aukus",
        "quad",
        "indo-pacific",
        "chinese aircraft",
        "chinese warship",
        "median line",
        "adiz",
    ],
    "korea": [
        "north korea",
        "dprk",
        "pyongyang",
        "kim jong",
        "south korea",
        "seoul",
        "korean peninsula",
        "icbm",
        "hwasong",
        "missile test",
        "nuclear test",
        "dmz",
        "kaesong",
        "yongbyon",
        "kim yo jong",
        "denuclearization",
    ],
}

# High-priority trigger words
TRIGGER_WORDS = [
    "breaking",
    "urgent",
    "just in",
    "developing",
    "strike",
    "attack",
    "explosion",
    "missile",
    "invasion",
    "troops",
    "military operation",
    "nuclear",
    "war",
    "conflict",
    "escalation",
    "casualties",
    "killed",
    "wounded",
    "evacuation",
]


class NewsAggregator:
    def __init__(self):
        self.cache: dict[str, list[NewsItem]] = {}
        self.all_items: list[NewsItem] = []
        self.last_fetch: Optional[datetime] = None
        self.fetch_interval = timedelta(minutes=3)

    def _clean_html(self, text: str) -> str:
        """Remove HTML tags and decode entities"""
        if not text:
            return ""
        clean = re.sub(r"<[^>]+>", "", text)
        clean = html.unescape(clean)
        clean = " ".join(clean.split())
        return clean[:500]

    def _classify_region(self, title: str, summary: str) -> Optional[str]:
        """Classify news item by region - STRICT matching"""
        text = f"{title} {summary}".lower()

        scores = {}
        for region, keywords in REGION_KEYWORDS.items():
            score = 0
            for kw in keywords:
                if kw in text:
                    # Longer keywords get more weight
                    score += len(kw.split())
            if score > 0:
                scores[region] = score

        if scores:
            # Only return if score is significant (at least 2 keyword matches)
            best_region = max(scores, key=lambda x: scores[x])
            if scores[best_region] >= 2:
                return best_region
        return None

    def _calculate_relevance(
        self, title: str, summary: str, region: Optional[str]
    ) -> float:
        """Calculate relevance score - prioritize geopolitical content"""
        if not region:
            return 0.05  # Very low for unclassified

        text = f"{title} {summary}".lower()
        keywords = REGION_KEYWORDS.get(region, [])

        # Count keyword matches
        matches = sum(1 for kw in keywords if kw in text)
        base_score = min(matches / 3, 0.6)  # Up to 0.6 for keywords

        # Boost for trigger words
        trigger_boost = sum(0.1 for tw in TRIGGER_WORDS if tw in text)
        trigger_boost = min(trigger_boost, 0.3)

        # Boost for defense/military sources
        source_boost = 0.1 if region else 0

        return min(base_score + trigger_boost + source_boost, 1.0)

    def _is_relevant(self, title: str, summary: str) -> bool:
        """Check if article is relevant to geopolitical monitoring"""
        text = f"{title} {summary}".lower()

        # Must match at least one region's keywords
        for keywords in REGION_KEYWORDS.values():
            if any(kw in text for kw in keywords):
                return True

        # Or contain trigger words with military/political context
        military_context = [
            "military",
            "defense",
            "army",
            "navy",
            "air force",
            "strike",
            "missile",
            "nuclear",
            "war",
            "conflict",
        ]
        if any(tw in text for tw in TRIGGER_WORDS):
            if any(mc in text for mc in military_context):
                return True

        return False

    async def _fetch_feed(
        self,
        session: aiohttp.ClientSession,
        feed_key: str,
        feed_config: dict,
        semaphore: Optional[asyncio.Semaphore] = None,
    ) -> list[NewsItem]:
        """Fetch and parse a single RSS feed with rate limiting"""
        items = []

        async def do_fetch():
            nonlocal items
            await asyncio.sleep(REQUEST_DELAY + random.uniform(0, 0.2))

            try:
                async with session.get(
                    feed_config["url"],
                    timeout=aiohttp.ClientTimeout(total=15),
                    headers={"User-Agent": "Mozilla/5.0 EdgeSeeker/1.0"},
                ) as response:
                    if response.status == 200:
                        content = await response.text()
                        parsed = feedparser.parse(content)

                        for entry in parsed.entries[:20]:
                            try:
                                title = self._clean_html(entry.get("title", ""))
                                summary = self._clean_html(
                                    entry.get("summary", entry.get("description", ""))
                                )

                                # FILTER: Only keep relevant articles
                                if not self._is_relevant(title, summary):
                                    continue

                                # Parse published date
                                published = datetime.now()
                                if (
                                    hasattr(entry, "published_parsed")
                                    and entry.published_parsed
                                ):
                                    try:
                                        published = datetime(
                                            *entry.published_parsed[:6]
                                        )
                                    except Exception:
                                        pass

                                region = self._classify_region(title, summary)
                                relevance = self._calculate_relevance(
                                    title, summary, region
                                )

                                item = NewsItem(
                                    id=entry.get(
                                        "id",
                                        entry.get("link", f"{feed_key}_{len(items)}"),
                                    ),
                                    title=title,
                                    summary=summary,
                                    source=feed_config["name"],
                                    source_id=feed_config["source_id"],
                                    url=entry.get("link", ""),
                                    published=published,
                                    region=region,
                                    classification="OSINT"
                                    if "OSINT" in feed_config["source_id"]
                                    else "MILINT",
                                    relevance_score=relevance,
                                )
                                items.append(item)
                            except Exception:
                                continue
            except Exception as e:
                print(f"Error fetching {feed_key}: {e}")

        if semaphore:
            async with semaphore:
                await do_fetch()
        else:
            await do_fetch()

        return items

    async def fetch_all(self, force: bool = False) -> list[NewsItem]:
        """Fetch news from all RSS feeds with rate limiting"""
        now = datetime.now()

        if (
            not force
            and self.all_items
            and self.last_fetch
            and (now - self.last_fetch) < self.fetch_interval
        ):
            return self.all_items

        semaphore = asyncio.Semaphore(MAX_CONCURRENT)

        async with aiohttp.ClientSession() as session:
            tasks = [
                self._fetch_feed(session, key, config, semaphore)
                for key, config in RSS_FEEDS.items()
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        all_items = []
        self.cache.clear()

        for i, (key, _) in enumerate(RSS_FEEDS.items()):
            result = results[i]
            if isinstance(result, list):
                for item in result:
                    all_items.append(item)
                    # Cache by region
                    region = item.region or "global"
                    if region not in self.cache:
                        self.cache[region] = []
                    self.cache[region].append(item)

        # Sort by relevance then date
        all_items.sort(key=lambda x: (x.relevance_score, x.published), reverse=True)

        self.all_items = all_items
        self.last_fetch = now

        return all_items

    async def fetch_by_region(self, region: str) -> list[NewsItem]:
        """Fetch news filtered by region"""
        await self.fetch_all()
        return self.cache.get(region, [])

    def get_news_velocity(self, region: str, hours: int = 24) -> float:
        """Calculate news velocity for a region (0-100 scale)
        
        Uses logarithmic scaling for better distribution:
        - 1 item = ~15
        - 5 items = ~40  
        - 10 items = ~55
        - 20 items = ~70
        - 50 items = ~90
        """
        items = self.cache.get(region, [])
        
        if not items:
            return 0.0
        
        import math
        
        # Count items by relevance tiers
        high_rel = sum(1 for i in items if i.relevance_score > 0.7)
        med_rel = sum(1 for i in items if 0.4 < i.relevance_score <= 0.7)
        low_rel = sum(1 for i in items if 0.1 < i.relevance_score <= 0.4)
        
        # Weighted count: high=2, med=1.5, low=1
        weighted_count = high_rel * 2 + med_rel * 1.5 + low_rel * 1
        
        if weighted_count <= 0:
            return 0.0
        
        # Logarithmic scaling: log(count + 1) / log(100) * 100
        # This gives better distribution across the 0-100 range
        velocity = (math.log(weighted_count + 1) / math.log(100)) * 100
        
        return round(min(velocity, 100), 1)


# Global instance
news_aggregator = NewsAggregator()
