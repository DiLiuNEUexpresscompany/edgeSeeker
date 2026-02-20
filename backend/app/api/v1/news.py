"""
News API
Real-time news aggregation endpoints
Supports lang=zh for automatic LLM translation
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timezone

from app.services.news.aggregator import news_aggregator
from app.services.translate.llm_translator import llm_translator

router = APIRouter()


@router.get("/")
async def get_news(
    region: Optional[str] = Query(None, description="Filter by region"),
    limit: int = Query(50, ge=1, le=100),
    force_refresh: bool = Query(False),
    lang: Optional[str] = Query(
        None, description="Language: zh for Chinese translation"
    ),
):
    """Get aggregated news from all sources"""
    if region:
        items = await news_aggregator.fetch_by_region(region)
    else:
        items = await news_aggregator.fetch_all(force=force_refresh)

    # Limit results
    items = items[:limit]

    # Build response items
    result_items = [
        {
            "id": item.id,
            "title": item.title,
            "summary": item.summary,
            "source": item.source,
            "source_id": item.source_id,
            "url": item.url,
            "published": item.published.isoformat(),
            "region": item.region,
            "classification": item.classification,
            "relevance_score": item.relevance_score,
        }
        for item in items
    ]

    # Translate if lang=zh
    if lang in ["zh", "zh-CN", "zh-TW"] and llm_translator.is_configured():
        result_items = await llm_translator.translate_list(
            result_items, fields=["title", "summary"], target=lang
        )

    return {
        "count": len(result_items),
        "items": result_items,
        "lang": lang,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/velocity")
async def get_news_velocity():
    """Get news velocity for all regions"""
    # Ensure data is fresh
    await news_aggregator.fetch_all()

    velocities = {}
    for region in [
        "iran",
        "israel-palestine",
        "russia-ukraine",
        "taiwan-strait",
        "korea",
    ]:
        velocities[region] = round(news_aggregator.get_news_velocity(region), 1)

    return {
        "velocities": velocities,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/sources")
async def get_sources():
    """Get list of news sources"""
    from app.services.news.aggregator import RSS_FEEDS

    return {
        "sources": [
            {"id": key, "name": config["name"], "source_id": config["source_id"]}
            for key, config in RSS_FEEDS.items()
        ]
    }
