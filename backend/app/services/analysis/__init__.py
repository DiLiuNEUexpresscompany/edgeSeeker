"""
智能分析服务
"""

from typing import List
from datetime import datetime
import random

from app.models import Region as Region


class HotspotAnalysis:
    """热点分析结果"""

    def __init__(
        self,
        region: str,
        score: float,
        trend: str,
        news_count_24h: int,
        social_volume_24h: int,
        key_events: List[str],
    ):
        self.region = region
        self.score = score
        self.trend = trend
        self.news_count_24h = news_count_24h
        self.social_volume_24h = social_volume_24h
        self.key_events = key_events

    def dict(self):
        return {
            "region": self.region,
            "score": self.score,
            "trend": self.trend,
            "news_count_24h": self.news_count_24h,
            "social_volume_24h": self.social_volume_24h,
            "key_events": self.key_events,
        }


class AnalysisService:
    """智能分析服务"""

    # 地区基础权重（基于当前世界局势）
    REGION_BASE_SCORES = {
        "israel-palestine": 85,
        "russia-ukraine": 75,
        "iran": 90,  # 当前最热
        "taiwan-strait": 45,
        "korea": 35,
    }

    async def analyze_region(self, region_id: str) -> dict:
        """分析单个地区"""
        base_score = self.REGION_BASE_SCORES.get(region_id, 50)

        # 添加随机波动模拟实时变化
        score = base_score + random.uniform(-5, 10)
        score = max(0, min(100, score))

        news_count = int(score * random.uniform(15, 25))
        social_volume = int(score * random.uniform(500, 1000))

        # 根据分数变化判断趋势
        if score > base_score + 3:
            trend = "rising"
        elif score < base_score - 3:
            trend = "falling"
        else:
            trend = "stable"

        # 生成关键事件（实际应该从新闻中提取）
        key_events = [
            f"Key development in {region_id} region",
            "Military activity reported",
            "Diplomatic discussions ongoing",
        ]

        return HotspotAnalysis(
            region=region_id,
            score=round(score, 1),
            trend=trend,
            news_count_24h=news_count,
            social_volume_24h=social_volume,
            key_events=key_events,
        ).dict()

    async def analyze_all_regions(self) -> List[dict]:
        """分析所有地区"""
        analyses = []

        for region_id in self.REGION_BASE_SCORES.keys():
            analysis = await self.analyze_region(region_id)
            analyses.append(analysis)

        # 按热度分数排序
        analyses.sort(key=lambda x: x["score"], reverse=True)

        return analyses

    async def get_current_hotspot(self) -> dict:
        """获取当前最热地区（用于自动切换）"""
        analyses = await self.analyze_all_regions()

        if not analyses:
            return await self.analyze_region("russia-ukraine")

        # 返回分数最高的地区
        return analyses[0]

    async def calculate_tension_index(self) -> dict:
        """计算全球紧张指数"""
        analyses = await self.analyze_all_regions()

        # 加权平均
        total_score = sum(a["score"] for a in analyses)
        avg_score = total_score / len(analyses) if analyses else 50

        # 判断整体趋势
        rising_count = sum(1 for a in analyses if a["trend"] == "rising")
        falling_count = sum(1 for a in analyses if a["trend"] == "falling")

        if rising_count > falling_count:
            overall_trend = "escalating"
        elif falling_count > rising_count:
            overall_trend = "de-escalating"
        else:
            overall_trend = "stable"

        return {
            "global_tension_index": round(avg_score, 1),
            "trend": overall_trend,
            "hottest_region": analyses[0]["region"] if analyses else None,
            "regions": analyses,
            "last_updated": datetime.now().isoformat(),
        }


# 单例
analysis_service = AnalysisService()
