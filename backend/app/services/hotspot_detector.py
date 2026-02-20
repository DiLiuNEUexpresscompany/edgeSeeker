"""
Hotspot Detector Service
Automatically detects the hottest geopolitical region based on real-time data
"""

import asyncio
from datetime import datetime, timezone
from typing import Optional
from enum import Enum
from dataclasses import dataclass, field

from app.services.news.aggregator import news_aggregator, NewsItem
from app.services.social.bluesky import bluesky_service, SocialPost
from app.services.social.truthsocial import truthsocial_service
from app.services.markets.polymarket import polymarket_service
from app.services.markets.commodities_service import commodities_service
from app.services.trends.google_trends import google_trends_service


class AlertLevel(str, Enum):
    LOW = "low"
    ELEVATED = "elevated"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class RegionScore:
    region_id: str
    name: str
    name_zh: str
    total_score: float = 0.0
    alert_level: AlertLevel = AlertLevel.LOW
    factors: dict = field(default_factory=dict)
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


REGIONS = {
    "israel-palestine": {"name": "Israel-Palestine", "name_zh": "巴以", "emoji": "🇮🇱"},
    "russia-ukraine": {"name": "Russia-Ukraine", "name_zh": "俄乌", "emoji": "🇺🇦"},
    "taiwan-strait": {"name": "Taiwan Strait", "name_zh": "台海", "emoji": "🇹🇼"},
    "iran": {"name": "Iran", "name_zh": "伊朗", "emoji": "🇮🇷"},
    "korea": {"name": "Korean Peninsula", "name_zh": "朝韩", "emoji": "🇰🇷"},
}

# Scoring weights (total = 1.0)
WEIGHTS = {
    "news_velocity": 0.20,
    "social_volume": 0.15,
    "google_trends": 0.20,  # Google search interest
    "sentiment_shift": 0.10,
    "prediction_volatility": 0.20,
    "market_movement": 0.10,
    "event_triggers": 0.05,
}


class HotspotDetector:
    def __init__(self):
        self.scores: dict[str, RegionScore] = {}
        self.current_hotspot: Optional[str] = None
        self.history: list[dict] = []
        self.last_update: Optional[datetime] = None

        # Initialize region scores
        for region_id, info in REGIONS.items():
            self.scores[region_id] = RegionScore(
                region_id=region_id, name=info["name"], name_zh=info["name_zh"]
            )

    def _determine_alert_level(self, score: float) -> AlertLevel:
        """Determine alert level based on score"""
        if score >= 80:
            return AlertLevel.CRITICAL
        elif score >= 60:
            return AlertLevel.HIGH
        elif score >= 40:
            return AlertLevel.ELEVATED
        else:
            return AlertLevel.LOW

    def _calculate_sentiment_shift(
        self, news_items: list[NewsItem], posts: list[SocialPost]
    ) -> float:
        """Calculate sentiment shift based on content analysis"""
        # Keywords indicating escalation
        escalation_keywords = [
            "strike",
            "attack",
            "war",
            "invasion",
            "military",
            "nuclear",
            "missile",
            "bomb",
            "troops",
            "conflict",
            "threat",
            "urgent",
            "breaking",
            "emergency",
            "crisis",
            "escalation",
            "tension",
        ]

        # Combine all text
        all_text = " ".join(
            [item.title.lower() + " " + item.summary.lower() for item in news_items]
        )
        all_text += " ".join([post.text.lower() for post in posts])

        # Count escalation keywords
        count = sum(1 for kw in escalation_keywords if kw in all_text)

        # Normalize: 20+ keywords = 100
        return min(count / 20 * 100, 100)

    def _calculate_event_triggers(self, news_items: list[NewsItem]) -> float:
        """Check for major event triggers in headlines"""
        trigger_phrases = [
            "breaking:",
            "just in:",
            "urgent:",
            "developing:",
            "strike",
            "explosion",
            "attack",
            "invasion",
            "declares war",
            "state of emergency",
            "evacuate",
            "nuclear",
            "missile launch",
            "airstrikes",
        ]

        trigger_count = 0
        for item in news_items[:20]:  # Check recent items
            text = item.title.lower()
            for phrase in trigger_phrases:
                if phrase in text:
                    trigger_count += 1
                    break

        # Normalize: 5+ triggers = 100
        return min(trigger_count / 5 * 100, 100)

    def _calculate_social_volume(
        self, bsky_posts: list, truth_posts: list, region: str
    ) -> float:
        """Calculate combined social volume from all platforms"""
        # Count posts for this region
        bsky_count = sum(1 for p in bsky_posts if p.region == region)
        truth_count = sum(1 for p in truth_posts if p.region == region)

        # Count engagement
        bsky_engagement = sum(
            p.likes + p.reposts for p in bsky_posts if p.region == region
        )
        truth_engagement = sum(
            p.likes + p.reposts for p in truth_posts if p.region == region
        )

        total_posts = bsky_count + truth_count
        total_engagement = bsky_engagement + truth_engagement

        # Also count posts mentioning region keywords (even if not classified)
        region_keywords = {
            "iran": ["iran", "tehran", "persian"],
            "israel-palestine": ["israel", "gaza", "hamas"],
            "russia-ukraine": ["ukraine", "russia", "kyiv"],
            "taiwan-strait": ["taiwan", "china"],
            "korea": ["korea", "pyongyang"],
        }
        keywords = region_keywords.get(region, [])

        for p in bsky_posts + truth_posts:
            text = p.text.lower() if hasattr(p, "text") else ""
            if any(kw in text for kw in keywords):
                total_posts += 0.5
                total_engagement += (p.likes + p.reposts) if hasattr(p, "likes") else 0

        # Normalize: 10 posts or 100 engagement = 50 each, max 100
        post_score = min(total_posts / 10 * 50, 50)
        engagement_score = min(total_engagement / 100 * 50, 50)

        return post_score + engagement_score

    async def update_scores(self) -> None:
        """Update all region scores using real API data"""
        try:
            # Fetch data from all services concurrently
            news_task = news_aggregator.fetch_all()
            bsky_task = bluesky_service.fetch_all()
            truth_task = truthsocial_service.fetch_all()
            prediction_task = polymarket_service.fetch_all()
            market_task = commodities_service.fetch_commodities()

            (
                news_items,
                bsky_posts,
                truth_posts,
                predictions,
                market_data,
            ) = await asyncio.gather(
                news_task,
                bsky_task,
                truth_task,
                prediction_task,
                market_task,
                return_exceptions=True,
            )

            # Handle exceptions
            if isinstance(news_items, Exception):
                print(f"News fetch error: {news_items}")
                news_items = []
            if isinstance(bsky_posts, Exception):
                print(f"Bluesky fetch error: {bsky_posts}")
                bsky_posts = []
            if isinstance(truth_posts, Exception):
                print(f"Truth Social fetch error: {truth_posts}")
                truth_posts = []
            if isinstance(predictions, Exception):
                print(f"Prediction fetch error: {predictions}")
                predictions = []
            if isinstance(market_data, Exception):
                print(f"Market fetch error: {market_data}")
                market_data = {}

            # Combine social posts for sentiment analysis
            all_social = []
            for p in bsky_posts:
                all_social.append(p)

            # Calculate scores for each region
            for region_id in REGIONS.keys():
                # Filter data by region
                region_news = [n for n in news_items if n.region == region_id]
                region_posts = [p for p in all_social if p.region == region_id]
                # Filter predictions for region (used for volatility calculation)
                _ = [p for p in predictions if p.region == region_id]

                # Calculate individual factors
                news_velocity = news_aggregator.get_news_velocity(region_id)
                social_volume = self._calculate_social_volume(
                    bsky_posts, truth_posts, region_id
                )
                # Get Google Trends interest (0-100)
                google_trends = await google_trends_service.get_trend_interest(region_id)
                sentiment_shift = self._calculate_sentiment_shift(
                    region_news, region_posts
                )
                prediction_volatility = polymarket_service.get_prediction_volatility(
                    region_id
                )
                market_movement = commodities_service.get_market_movement(region_id)
                event_triggers = self._calculate_event_triggers(region_news)

                factors = {
                    "news_velocity": round(news_velocity, 1),
                    "social_volume": round(social_volume, 1),
                    "google_trends": round(google_trends, 1),
                    "sentiment_shift": round(sentiment_shift, 1),
                    "prediction_volatility": round(prediction_volatility, 1),
                    "market_movement": round(market_movement, 1),
                    "event_triggers": round(event_triggers, 1),
                }

                # Calculate weighted total
                total_score = sum(
                    factors[factor] * weight for factor, weight in WEIGHTS.items()
                )

                # Update region score
                self.scores[region_id] = RegionScore(
                    region_id=region_id,
                    name=REGIONS[region_id]["name"],
                    name_zh=REGIONS[region_id]["name_zh"],
                    total_score=round(total_score, 1),
                    alert_level=self._determine_alert_level(total_score),
                    factors=factors,
                    last_updated=datetime.now(timezone.utc),
                )

            # Determine current hotspot (highest score)
            self.current_hotspot = max(
                self.scores.keys(), key=lambda r: self.scores[r].total_score
            )

            # Record history
            self.history.append(
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "hotspot": self.current_hotspot,
                    "scores": {r: s.total_score for r, s in self.scores.items()},
                }
            )

            # Keep only last 100 history entries
            if len(self.history) > 100:
                self.history = self.history[-100:]

            self.last_update = datetime.now(timezone.utc)

        except Exception as e:
            print(f"Error updating scores: {e}")
            raise

    def get_current_hotspot(self) -> Optional[RegionScore]:
        """Get the current hotspot region"""
        if self.current_hotspot:
            return self.scores.get(self.current_hotspot)
        return None

    def get_all_scores(self) -> dict:
        """Get all region scores"""
        return {
            region_id: {
                "region_id": score.region_id,
                "name": score.name,
                "name_zh": score.name_zh,
                "total_score": score.total_score,
                "alert_level": score.alert_level.value,
                "factors": score.factors,
                "last_updated": score.last_updated.isoformat(),
            }
            for region_id, score in self.scores.items()
        }

    def get_history(self, limit: int = 20) -> list[dict]:
        """Get score history"""
        return self.history[-limit:]


# Global instance
detector = HotspotDetector()
