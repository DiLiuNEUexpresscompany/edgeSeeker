"""
Social Media API
Bluesky, Truth Social, Twitter/X and social intelligence endpoints
Supports lang=zh for automatic LLM translation
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timezone

from app.services.social.bluesky import bluesky_service
from app.services.social.truthsocial import truthsocial_service
from app.services.social.twitter import twitter_service
from app.services.translate.llm_translator import llm_translator

router = APIRouter()


@router.get("/")
async def get_social_posts(
    region: Optional[str] = Query(None, description="Filter by region"),
    platform: Optional[str] = Query(
        None, description="Filter by platform: bluesky, truthsocial, twitter, all"
    ),
    limit: int = Query(50, ge=1, le=100),
    force_refresh: bool = Query(False),
    lang: Optional[str] = Query(
        None, description="Language: zh for Chinese translation"
    ),
):
    """Get social media posts from all platforms"""
    all_posts = []

    # Fetch from Bluesky
    if platform in [None, "all", "bluesky"]:
        if region:
            bsky_posts = await bluesky_service.fetch_by_region(region)
        else:
            bsky_posts = await bluesky_service.fetch_all(force=force_refresh)

        for post in bsky_posts:
            all_posts.append(
                {
                    "id": post.id,
                    "author": post.author,
                    "handle": post.handle,
                    "text": post.text,
                    "created_at": post.created_at.isoformat(),
                    "likes": post.likes,
                    "reposts": post.reposts,
                    "region": post.region,
                    "platform": "bluesky",
                    "url": getattr(post, "url", None),
                }
            )

    # Fetch from Truth Social
    if platform in [None, "all", "truthsocial"]:
        truth_posts = await truthsocial_service.fetch_all(force=force_refresh)

        for post in truth_posts:
            # Filter by region if specified
            if region and post.region != region:
                continue

            all_posts.append(
                {
                    "id": post.id,
                    "author": post.author,
                    "handle": post.handle,
                    "text": post.text,
                    "created_at": post.created_at.isoformat(),
                    "likes": post.likes,
                    "reposts": post.reposts,
                    "replies": getattr(post, "replies", 0),
                    "region": post.region,
                    "platform": "truthsocial",
                    "url": getattr(post, "url", None),
                }
            )

    # Fetch from Twitter/X (if configured)
    if platform in [None, "all", "twitter"] and twitter_service.is_configured():
        twitter_posts = await twitter_service.fetch_all(force=force_refresh)

        for post in twitter_posts:
            if region and post.region != region:
                continue

            all_posts.append(
                {
                    "id": post.id,
                    "author": post.author,
                    "handle": post.handle,
                    "text": post.text,
                    "created_at": post.created_at.isoformat(),
                    "likes": post.likes,
                    "reposts": post.retweets,
                    "replies": post.replies,
                    "views": post.views,
                    "region": post.region,
                    "platform": "twitter",
                    "url": post.url,
                }
            )

    # Balanced sorting: ensure all platforms are represented
    # Group by platform
    by_platform = {}
    for post in all_posts:
        plat = post["platform"]
        if plat not in by_platform:
            by_platform[plat] = []
        by_platform[plat].append(post)

    # Sort each platform by date
    for plat in by_platform:
        by_platform[plat].sort(key=lambda x: x["created_at"], reverse=True)

    # Take proportional amount from each platform
    # If specific platform requested, just sort by date
    if platform and platform not in ["all", None]:
        all_posts.sort(key=lambda x: x["created_at"], reverse=True)
        all_posts = all_posts[:limit]
    else:
        # Distribute limit across platforms proportionally, min 10 each
        num_platforms = len(by_platform)
        if num_platforms > 0:
            per_platform = max(limit // num_platforms, 10)
            balanced_posts = []
            for plat, posts in by_platform.items():
                balanced_posts.extend(posts[:per_platform])
            # Sort combined by date
            balanced_posts.sort(key=lambda x: x["created_at"], reverse=True)
            all_posts = balanced_posts[:limit]
        else:
            all_posts = []

    # Translate if lang=zh
    if lang in ["zh", "zh-CN", "zh-TW"] and llm_translator.is_configured():
        all_posts = await llm_translator.translate_list(
            all_posts, fields=["text"], target=lang
        )

    # Determine available platforms
    platforms = ["bluesky", "truthsocial"]
    if twitter_service.is_configured():
        platforms.append("twitter")

    return {
        "count": len(all_posts),
        "items": all_posts,
        "platforms": platforms,
        "lang": lang,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/bluesky")
async def get_bluesky_posts(
    region: Optional[str] = Query(None),
    limit: int = Query(30, ge=1, le=100),
    force_refresh: bool = Query(False),
):
    """Get Bluesky posts only"""
    if region:
        posts = await bluesky_service.fetch_by_region(region)
    else:
        posts = await bluesky_service.fetch_all(force=force_refresh)

    return {
        "count": len(posts[:limit]),
        "items": [
            {
                "id": p.id,
                "author": p.author,
                "handle": p.handle,
                "text": p.text,
                "created_at": p.created_at.isoformat(),
                "likes": p.likes,
                "reposts": p.reposts,
                "region": p.region,
                "platform": "bluesky",
                "url": getattr(p, "url", None),
            }
            for p in posts[:limit]
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/truthsocial")
async def get_truthsocial_posts(
    limit: int = Query(30, ge=1, le=100), force_refresh: bool = Query(False)
):
    """Get Truth Social posts (Trump's platform)"""
    posts = await truthsocial_service.fetch_all(force=force_refresh)

    return {
        "count": len(posts[:limit]),
        "items": [
            {
                "id": p.id,
                "author": p.author,
                "handle": p.handle,
                "text": p.text,
                "created_at": p.created_at.isoformat(),
                "likes": p.likes,
                "reposts": p.reposts,
                "region": p.region,
                "platform": "truthsocial",
                "url": getattr(p, "url", None),
            }
            for p in posts[:limit]
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/volume")
async def get_social_volume():
    """Get social volume for all regions"""
    await bluesky_service.fetch_all()

    volumes = {}
    for region in [
        "iran",
        "israel-palestine",
        "russia-ukraine",
        "taiwan-strait",
        "korea",
    ]:
        volumes[region] = round(bluesky_service.get_social_volume(region), 1)

    return {"volumes": volumes, "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/trending")
async def get_trending(limit: int = Query(10, ge=1, le=50)):
    """Get trending posts by engagement across all platforms"""
    bsky_posts = await bluesky_service.fetch_all()
    truth_posts = await truthsocial_service.fetch_all()

    all_posts = []

    for post in bsky_posts:
        all_posts.append(
            {
                "id": post.id,
                "author": post.author,
                "handle": post.handle,
                "text": post.text,
                "created_at": post.created_at.isoformat(),
                "likes": post.likes,
                "reposts": post.reposts,
                "engagement": post.likes + post.reposts,
                "region": post.region,
                "platform": "bluesky",
            }
        )

    for post in truth_posts:
        all_posts.append(
            {
                "id": post.id,
                "author": post.author,
                "handle": post.handle,
                "text": post.text,
                "created_at": post.created_at.isoformat(),
                "likes": post.likes,
                "reposts": post.reposts,
                "engagement": post.likes + post.reposts,
                "region": post.region,
                "platform": "truthsocial",
            }
        )

    # Sort by engagement
    all_posts.sort(key=lambda p: p["engagement"], reverse=True)

    return {
        "count": min(len(all_posts), limit),
        "items": all_posts[:limit],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/twitter")
async def get_twitter_posts(
    limit: int = Query(30, ge=1, le=100), force_refresh: bool = Query(False)
):
    """Get Twitter/X posts"""
    if not twitter_service.is_configured():
        return {
            "error": "Twitter not configured",
            "message": "Set GETXAPI_KEY environment variable",
            "count": 0,
            "items": [],
        }

    posts = await twitter_service.fetch_all(force=force_refresh)

    return {
        "count": len(posts[:limit]),
        "items": [
            {
                "id": p.id,
                "author": p.author,
                "handle": p.handle,
                "text": p.text,
                "created_at": p.created_at.isoformat(),
                "likes": p.likes,
                "retweets": p.retweets,
                "replies": p.replies,
                "views": p.views,
                "region": p.region,
                "platform": "twitter",
                "url": p.url,
            }
            for p in posts[:limit]
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/twitter/trends")
async def get_twitter_trends(force_refresh: bool = Query(False)):
    """Get Twitter/X trending topics (worldwide)"""
    trends_data = await twitter_service.get_geopolitical_trends(force=force_refresh)

    result = {}
    for location, trends in trends_data.items():
        result[location] = [
            {
                "name": t.name,
                "url": t.url,
                "tweet_volume": t.tweet_volume,
            }
            for t in trends
        ]

    return {
        "trends": result,
        "provider": "ScrapeBadger",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/status")
async def get_social_status():
    """Get status of all social media services"""
    return {
        "services": {
            "bluesky": {
                "available": True,
                "cache_size": sum(len(v) for v in bluesky_service.cache.values()),
            },
            "truthsocial": {
                "available": True,
                "cache_size": len(truthsocial_service.cache),
            },
            "twitter": twitter_service.get_status(),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
