"""
Hotspot Detection API
Real-time geopolitical hotspot monitoring endpoints
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
import asyncio

from app.services.hotspot_detector import detector

router = APIRouter()


@router.get("/current")
async def get_current_hotspot():
    """Get the current hottest region"""
    # Update scores with real data
    await detector.update_scores()

    hotspot = detector.get_current_hotspot()
    if hotspot:
        return {
            "region_id": hotspot.region_id,
            "name": hotspot.name,
            "name_zh": hotspot.name_zh,
            "total_score": hotspot.total_score,
            "alert_level": hotspot.alert_level.value,
            "factors": hotspot.factors,
            "last_updated": hotspot.last_updated.isoformat(),
        }
    return {"error": "No hotspot data available"}


@router.get("/all")
async def get_all_regions():
    """Get all region scores"""
    # Update scores with real data
    await detector.update_scores()

    return {
        "current_hotspot": detector.current_hotspot,
        "regions": detector.get_all_scores(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/history")
async def get_history(limit: int = 20):
    """Get hotspot history"""
    return {
        "history": detector.get_history(limit),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time hotspot updates"""
    await websocket.accept()

    try:
        while True:
            # Update scores
            await detector.update_scores()

            # Send update
            data = {
                "type": "hotspot_update",
                "current_hotspot": detector.current_hotspot,
                "regions": detector.get_all_scores(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            await websocket.send_json(data)

            # Wait before next update
            await asyncio.sleep(30)  # Update every 30 seconds

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
