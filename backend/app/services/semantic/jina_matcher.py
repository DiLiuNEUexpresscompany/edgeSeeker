"""
Semantic Matcher using Jina AI Embeddings
Free tier: 10M tokens per API key
https://jina.ai/embeddings/
"""

import os
import asyncio
import aiohttp
import numpy as np
from typing import Optional
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

JINA_API_KEY = os.getenv("JINA_API_KEY", "")
JINA_API_URL = "https://api.jina.ai/v1/embeddings"
JINA_MODEL = "jina-embeddings-v3"  # Multilingual, 1024 dimensions


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    a_np = np.array(a)
    b_np = np.array(b)
    return float(np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np)))


class JinaSemanticMatcher:
    """Embedding-based semantic matching using Jina AI"""

    def __init__(self):
        self.cache = {}  # {text_hash: embedding}
        self.cache_ttl = timedelta(hours=6)
        if JINA_API_KEY:
            print("✅ Jina Semantic Matcher initialized")
        else:
            print("⚠️ JINA_API_KEY not set. Get free key at https://jina.ai/embeddings/")

    def is_configured(self) -> bool:
        return bool(JINA_API_KEY)

    async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Get embeddings for a list of texts"""
        if not self.is_configured() or not texts:
            return []

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    JINA_API_URL,
                    headers={
                        "Authorization": f"Bearer {JINA_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": JINA_MODEL,
                        "input": texts,
                        "task": "text-matching"  # Optimized for similarity
                    },
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        embeddings = [item["embedding"] for item in data.get("data", [])]
                        return embeddings
                    else:
                        error = await response.text()
                        print(f"Jina API error {response.status}: {error[:200]}")
                        return []
        except Exception as e:
            print(f"Jina embedding error: {e}")
            return []

    async def match_posts_to_news(
        self,
        news_title: str,
        news_summary: str,
        news_region: str,
        posts: list[dict],
        top_k: int = 4
    ) -> list[dict]:
        """
        Find semantically related social posts for a news article.
        Uses embedding similarity for accurate matching.
        """
        if not self.is_configured() or not posts:
            return self._fallback_match(posts, news_region, top_k)

        # Prepare texts
        news_text = f"{news_title}. {news_summary}"
        
        # Pre-filter candidates by region (efficiency)
        candidates = [
            p for p in posts
            if not p.get('region') or p.get('region') == news_region
        ][:30]
        
        if len(candidates) < 5:
            candidates = posts[:20]

        post_texts = [p.get('text', '')[:500] for p in candidates]
        
        # Get embeddings for news + all posts in one batch
        all_texts = [news_text] + post_texts
        embeddings = await self.get_embeddings(all_texts)
        
        if len(embeddings) < 2:
            return self._fallback_match(candidates, news_region, top_k)

        news_embedding = embeddings[0]
        post_embeddings = embeddings[1:]

        # Calculate similarities
        scored_posts = []
        for i, post in enumerate(candidates):
            if i < len(post_embeddings):
                similarity = cosine_similarity(news_embedding, post_embeddings[i])
                # Convert to 0-100 scale (similarity is typically 0-1)
                score = max(0, similarity * 100)
                
                # Boost for same region
                if post.get('region') == news_region:
                    score += 10
                
                if score > 25:  # Minimum threshold
                    scored_posts.append({
                        **post,
                        'relevance_score': round(score, 1)
                    })

        # Sort by score
        scored_posts.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
        return scored_posts[:top_k]

    def _fallback_match(self, posts: list[dict], region: str, top_k: int) -> list[dict]:
        """Fallback to region-based matching"""
        region_posts = [p for p in posts if p.get('region') == region]
        if region_posts:
            return region_posts[:top_k]
        return posts[:top_k]


# Global instance
jina_matcher = JinaSemanticMatcher()
