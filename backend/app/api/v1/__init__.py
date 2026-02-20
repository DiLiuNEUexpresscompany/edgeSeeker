from fastapi import APIRouter
from . import news, social, markets, regions, hotspot, translate, semantic

api_router = APIRouter()

api_router.include_router(news.router, prefix="/news", tags=["news"])
api_router.include_router(social.router, prefix="/social", tags=["social"])
api_router.include_router(markets.router, prefix="/markets", tags=["markets"])
api_router.include_router(regions.router, prefix="/regions", tags=["regions"])
api_router.include_router(hotspot.router, prefix="/hotspot", tags=["hotspot"])
api_router.include_router(translate.router, prefix="/translate", tags=["translate"])
api_router.include_router(semantic.router, prefix="/semantic", tags=["semantic"])
