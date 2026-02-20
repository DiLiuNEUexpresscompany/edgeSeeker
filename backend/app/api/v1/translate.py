"""
Translation API endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.translate.translator import translation_service


router = APIRouter()


class TranslateRequest(BaseModel):
    text: str
    source: str = "auto"
    target: str = "zh-CN"
    provider: str = "google"


class TranslateBatchRequest(BaseModel):
    texts: list[str]
    source: str = "auto"
    target: str = "zh-CN"
    provider: str = "google"


@router.post("/translate")
async def translate_text(request: TranslateRequest):
    """Translate a single text"""
    if not request.text:
        raise HTTPException(status_code=400, detail="Text is required")

    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 chars)")

    result = await translation_service.translate(
        text=request.text,
        source=request.source,
        target=request.target,
        provider=request.provider,
    )

    return {
        "original": result.original,
        "translated": result.translated,
        "source": result.source_lang,
        "target": result.target_lang,
        "provider": result.provider,
    }


@router.post("/translate/batch")
async def translate_batch(request: TranslateBatchRequest):
    """Translate multiple texts"""
    if not request.texts:
        raise HTTPException(status_code=400, detail="Texts array is required")

    if len(request.texts) > 50:
        raise HTTPException(status_code=400, detail="Too many texts (max 50)")

    # Filter out empty texts and check length
    texts = [t for t in request.texts if t and len(t) <= 5000]

    results = await translation_service.translate_batch(
        texts=texts,
        source=request.source,
        target=request.target,
        provider=request.provider,
    )

    return {
        "translations": [
            {
                "original": r.original,
                "translated": r.translated,
            }
            for r in results
        ],
        "source": request.source,
        "target": request.target,
        "provider": results[0].provider if results else request.provider,
    }


@router.get("/translate/languages")
async def get_languages():
    """Get supported languages"""
    return {"languages": translation_service.get_supported_languages()}
