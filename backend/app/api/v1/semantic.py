"""
Semantic Matching API
Uses Jina AI embeddings for intelligent content matching
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from app.services.semantic.jina_matcher import jina_matcher
from app.services.social.bluesky import bluesky_service
from app.services.social.truthsocial import truthsocial_service

router = APIRouter()


class MatchRequest(BaseModel):
    news_title: str
    news_summary: str = ""
    news_region: str = "global"
    top_k: int = 4


@router.post("/match")
async def match_related_posts(request: MatchRequest):
    """
    Find semantically related social posts for a news article.
    Uses Jina AI embeddings for accurate matching.
    """
    # Get all social posts
    bsky_posts = await bluesky_service.fetch_all()
    truth_posts = await truthsocial_service.fetch_all()
    
    all_posts = []
    for post in bsky_posts:
        all_posts.append({
            "id": post.id,
            "author": post.author,
            "handle": post.handle,
            "text": post.text,
            "platform": "bluesky",
            "region": post.region,
            "likes": post.likes,
            "reposts": post.reposts,
            "url": getattr(post, 'url', None),
        })
    
    for post in truth_posts:
        all_posts.append({
            "id": post.id,
            "author": post.author,
            "handle": post.handle,
            "text": post.text,
            "platform": "truthsocial",
            "region": post.region,
            "likes": post.likes,
            "reposts": post.reposts,
            "url": getattr(post, 'url', None),
        })

    # Get matched posts
    matched = await jina_matcher.match_posts_to_news(
        news_title=request.news_title,
        news_summary=request.news_summary,
        news_region=request.news_region,
        posts=all_posts,
        top_k=request.top_k
    )

    return {
        "matched_posts": matched,
        "total_candidates": len(all_posts),
        "provider": "Jina AI Embeddings" if jina_matcher.is_configured() else "Fallback (region)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/status")
async def get_semantic_status():
    """Get semantic matching service status"""
    return {
        "jina_configured": jina_matcher.is_configured(),
        "model": "jina-embeddings-v3",
        "free_tier": "10M tokens",
        "get_key": "https://jina.ai/embeddings/",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
