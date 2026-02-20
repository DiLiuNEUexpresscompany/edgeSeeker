"""
地区相关 API 路由
"""

from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

from app.services.analysis import analysis_service
from app.core.config import settings

router = APIRouter()


class RegionInfo(BaseModel):
    """地区信息"""

    id: str
    name: str
    name_cn: str
    keywords: List[str]
    color: str
    is_active: bool = True


class HotspotAnalysis(BaseModel):
    """热点分析"""

    region: str
    score: float  # 0-100 热度分数
    trend: str  # rising, falling, stable
    news_count_24h: int
    social_volume_24h: int
    key_events: List[str]


# 地区配置
REGIONS_CONFIG = {
    "israel-palestine": {
        "name": "Israel-Palestine",
        "name_cn": "巴以",
        "keywords": [
            "Israel",
            "Gaza",
            "Hamas",
            "IDF",
            "Netanyahu",
            "Palestine",
            "West Bank",
        ],
        "color": "#3B82F6",
    },
    "russia-ukraine": {
        "name": "Russia-Ukraine",
        "name_cn": "俄乌",
        "keywords": [
            "Ukraine",
            "Russia",
            "Zelensky",
            "Putin",
            "Crimea",
            "Donbas",
            "NATO",
        ],
        "color": "#EF4444",
    },
    "taiwan-strait": {
        "name": "Taiwan Strait",
        "name_cn": "台海",
        "keywords": ["Taiwan", "PLA", "PLAN", "Strait", "China", "Taipei", "TSMC"],
        "color": "#10B981",
    },
    "iran": {
        "name": "Iran",
        "name_cn": "伊朗",
        "keywords": ["Iran", "IRGC", "Tehran", "Khamenei", "Nuclear", "Sanctions"],
        "color": "#F59E0B",
    },
    "korea": {
        "name": "Korean Peninsula",
        "name_cn": "朝鲜半岛",
        "keywords": ["North Korea", "DPRK", "Kim Jong Un", "Pyongyang", "Seoul", "DMZ"],
        "color": "#8B5CF6",
    },
}


@router.get("/", response_model=List[RegionInfo])
async def get_all_regions():
    """获取所有热点地区"""
    regions = []
    for region_id, config in REGIONS_CONFIG.items():
        regions.append(
            RegionInfo(
                id=region_id,
                name=str(config["name"]),
                name_cn=str(config["name_cn"]),
                keywords=list(config["keywords"]),
                color=str(config["color"]),
                is_active=region_id in settings.REGIONS,
            )
        )
    return regions


@router.get("/hotspot", response_model=HotspotAnalysis)
async def get_current_hotspot():
    """获取当前最热地区（智能分析）"""
    return await analysis_service.get_current_hotspot()


@router.get("/analysis", response_model=List[HotspotAnalysis])
async def get_all_regions_analysis():
    """获取所有地区的热度分析"""
    return await analysis_service.analyze_all_regions()


@router.get("/{region_id}")
async def get_region_detail(region_id: str):
    """获取特定地区的详细信息"""
    if region_id not in REGIONS_CONFIG:
        return {"error": "Region not found"}

    config = REGIONS_CONFIG[region_id]
    analysis = await analysis_service.analyze_region(region_id)

    return {"id": region_id, **config, "analysis": analysis}
