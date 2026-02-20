"""
Markets API
Financial markets and prediction markets endpoints
Supports lang=zh for automatic LLM translation
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timezone

from app.services.markets.stocks_service import stocks_service
from app.services.markets.alpaca_service import alpaca_service
from app.services.markets.commodities_service import commodities_service
from app.services.markets.polymarket import polymarket_service
from app.services.translate.llm_translator import llm_translator

router = APIRouter()


def utc_now() -> str:
    """Get current UTC time as ISO string"""
    return datetime.now(timezone.utc).isoformat()


# ========== Prediction Markets ==========


@router.get("/predictions")
async def get_predictions(
    region: str | None = Query(None, description="Filter by region"),
    limit: int = Query(30, ge=1, le=100),
    force_refresh: bool = Query(False),
    lang: Optional[str] = Query(
        None, description="Language: zh for Chinese translation"
    ),
):
    """Get prediction market data from Polymarket"""
    if region:
        markets = await polymarket_service.fetch_by_region(region)
    else:
        markets = await polymarket_service.fetch_all(force=force_refresh)

    markets = markets[:limit]

    items = [
        {
            "id": m.id,
            "question": m.question,
            "outcome_yes": round(m.outcome_yes * 100, 1),
            "outcome_no": round(m.outcome_no * 100, 1),
            "volume": m.volume,
            "volume_24h": m.volume_24h,
            "liquidity": m.liquidity,
            "region": m.region,
            "change_24h": round(m.change_24h, 1),
            "end_date": m.end_date.isoformat() if m.end_date else None,
            "slug": m.slug,
            "history": m.history or [],
        }
        for m in markets
    ]

    # Translate if lang=zh
    if lang in ["zh", "zh-CN", "zh-TW"] and llm_translator.is_configured():
        items = await llm_translator.translate_list(
            items, fields=["question"], target=lang
        )

    return {
        "count": len(items),
        "items": items,
        "lang": lang,
        "timestamp": utc_now(),
    }


@router.get("/predictions/{market_id}")
async def get_prediction_detail(
    market_id: str,
    lang: Optional[str] = Query(None, description="Language: zh for Chinese translation"),
):
    """Get single prediction market with price history"""
    market = await polymarket_service.fetch_market_with_history(market_id)

    if not market:
        return {"error": "Market not found"}

    result = {
        "id": market.id,
        "question": market.question,
        "outcome_yes": round(market.outcome_yes * 100, 1),
        "outcome_no": round(market.outcome_no * 100, 1),
        "volume": market.volume,
        "volume_24h": market.volume_24h,
        "liquidity": market.liquidity,
        "region": market.region,
        "change_24h": round(market.change_24h, 1),
        "end_date": market.end_date.isoformat() if market.end_date else None,
        "slug": market.slug,
        "history": market.history or [],
        "timestamp": utc_now(),
    }

    # Translate if lang=zh
    if lang in ["zh", "zh-CN", "zh-TW"] and llm_translator.is_configured():
        result = await llm_translator.translate_dict(result, fields=["question"], target=lang)

    return result


@router.get("/predictions/volatility")
async def get_prediction_volatility():
    """Get prediction volatility for all regions"""
    await polymarket_service.fetch_all()

    volatilities = {}
    for region in [
        "iran",
        "israel-palestine",
        "russia-ukraine",
        "taiwan-strait",
        "korea",
    ]:
        volatilities[region] = round(
            polymarket_service.get_prediction_volatility(region), 1
        )

    return {"volatilities": volatilities, "timestamp": utc_now()}


# ========== Stocks (Alpaca) ==========


@router.get("/stocks/defense")
async def get_defense_stocks(force_refresh: bool = Query(False)):
    """Get defense sector stock data via Yahoo Finance"""
    stocks = await stocks_service.fetch_defense_stocks(force=force_refresh)

    return {
        "count": len(stocks),
        "items": [
            {
                "symbol": s.symbol,
                "name": s.name,
                "price": s.price,
                "change": s.change,
                "change_percent": s.change_percent,
                "volume": s.volume,
                "market_cap": s.market_cap,
                "category": s.category,
                "history": s.history,
            }
            for s in stocks
        ],
        "timestamp": utc_now(),
    }


# ========== Crypto (Alpaca - No API Key Required) ==========


@router.get("/crypto")
async def get_crypto(force_refresh: bool = Query(False)):
    """Get cryptocurrency prices via Alpaca (free, no API key)"""
    cryptos = await alpaca_service.fetch_crypto(force=force_refresh)

    return {
        "count": len(cryptos),
        "items": [
            {
                "symbol": c.symbol,
                "name": c.name,
                "price": c.price,
                "change": c.change,
                "change_percent": c.change_percent,
                "volume": c.volume,
                "history": c.history,
            }
            for c in cryptos
        ],
        "timestamp": utc_now(),
    }


# ========== Commodities (Yahoo Finance) ==========


@router.get("/commodities")
async def get_commodities(force_refresh: bool = Query(False)):
    """Get commodity prices (oil, gold, etc.) via Yahoo Finance"""
    commodities = await commodities_service.fetch_commodities(force=force_refresh)

    return {
        "count": len(commodities),
        "items": [
            {
                "symbol": c.symbol,
                "name": c.name,
                "price": c.price,
                "change": c.change,
                "change_percent": c.change_percent,
                "history": c.history,
            }
            for c in commodities
        ],
        "timestamp": utc_now(),
    }


# ========== Market Movement ==========


@router.get("/movement")
async def get_market_movement():
    """Get market movement scores for all regions"""
    await commodities_service.fetch_commodities()

    movements = {}
    for region in [
        "iran",
        "israel-palestine",
        "russia-ukraine",
        "taiwan-strait",
        "korea",
    ]:
        movements[region] = round(commodities_service.get_market_movement(region), 1)

    return {"movements": movements, "timestamp": utc_now()}


# ========== All Markets Data ==========


@router.get("/all")
async def get_all_market_data(force_refresh: bool = Query(False)):
    """Get all market data in one call"""
    stocks = await stocks_service.fetch_defense_stocks(force=force_refresh)
    cryptos = await alpaca_service.fetch_crypto(force=force_refresh)
    commodities = await commodities_service.fetch_commodities(force=force_refresh)
    predictions = await polymarket_service.fetch_all(force=force_refresh)

    return {
        "defense_stocks": [
            {
                "symbol": s.symbol,
                "name": s.name,
                "price": s.price,
                "change": s.change,
                "change_percent": s.change_percent,
                "volume": s.volume,
                "history": s.history,
            }
            for s in stocks
        ],
        "crypto": [
            {
                "symbol": c.symbol,
                "name": c.name,
                "price": c.price,
                "change": c.change,
                "change_percent": c.change_percent,
                "history": c.history,
            }
            for c in cryptos
        ],
        "commodities": [
            {
                "symbol": c.symbol,
                "name": c.name,
                "price": c.price,
                "change": c.change,
                "change_percent": c.change_percent,
                "history": c.history,
            }
            for c in commodities
        ],
        "predictions_count": len(predictions),
        "timestamp": utc_now(),
    }
