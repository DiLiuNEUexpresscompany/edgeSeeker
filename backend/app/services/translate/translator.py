"""
Translation Service
Uses deep-translator to provide multi-language translation
Supports: Google Translate (free), MyMemory, DeepL (with API key)
"""

from deep_translator import GoogleTranslator, MyMemoryTranslator
from dataclasses import dataclass
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.core.proxy import get_proxy


@dataclass
class TranslationResult:
    original: str
    translated: str
    source_lang: str
    target_lang: str
    provider: str


# Thread pool for running sync translators in async context
_executor = ThreadPoolExecutor(max_workers=4)


class TranslationService:
    """Multi-provider translation service"""

    # Supported languages (common ones)
    SUPPORTED_LANGUAGES = {
        "en": "English",
        "zh-CN": "简体中文",
        "zh-TW": "繁體中文",
        "ja": "日本語",
        "ko": "한국어",
        "ru": "Русский",
        "ar": "العربية",
        "es": "Español",
        "fr": "Français",
        "de": "Deutsch",
        "pt": "Português",
        "it": "Italiano",
        "tr": "Türkçe",
        "uk": "Українська",
        "he": "עברית",
        "fa": "فارسی",
    }

    def __init__(self):
        self.cache: dict[str, str] = {}
        self.cache_limit = 1000

    def _get_cache_key(self, text: str, source: str, target: str) -> str:
        """Generate cache key"""
        return f"{source}:{target}:{hash(text)}"

    def _translate_sync(
        self,
        text: str,
        source: str = "auto",
        target: str = "en",
        provider: str = "google",
    ) -> TranslationResult:
        """Synchronous translation (runs in thread pool)"""

        # Check cache
        cache_key = self._get_cache_key(text, source, target)
        if cache_key in self.cache:
            return TranslationResult(
                original=text,
                translated=self.cache[cache_key],
                source_lang=source,
                target_lang=target,
                provider=f"{provider} (cached)",
            )

        # Get proxy
        proxy = get_proxy()
        proxies = {"http": proxy, "https": proxy} if proxy else None

        translated: str = text
        used_provider = provider

        try:
            if provider == "google":
                translator = GoogleTranslator(
                    source=source, target=target, proxies=proxies
                )
                result = translator.translate(text)
                translated = (
                    result
                    if isinstance(result, str)
                    else str(result[0])
                    if isinstance(result, list) and result
                    else text
                )
            elif provider == "mymemory":
                translator = MyMemoryTranslator(
                    source=source if source != "auto" else "en", target=target
                )
                result = translator.translate(text)
                translated = (
                    result
                    if isinstance(result, str)
                    else str(result[0])
                    if isinstance(result, list) and result
                    else text
                )
            else:
                # Default to Google
                translator = GoogleTranslator(
                    source=source, target=target, proxies=proxies
                )
                result = translator.translate(text)
                translated = (
                    result
                    if isinstance(result, str)
                    else str(result[0])
                    if isinstance(result, list) and result
                    else text
                )

        except Exception:
            # Fallback to MyMemory if Google fails
            if provider == "google":
                try:
                    translator = MyMemoryTranslator(
                        source=source if source != "auto" else "en", target=target
                    )
                    result = translator.translate(text)
                    translated = (
                        result
                        if isinstance(result, str)
                        else str(result[0])
                        if isinstance(result, list) and result
                        else text
                    )
                    used_provider = "mymemory (fallback)"
                except Exception:
                    # Return original if all fail
                    translated = text
                    used_provider = f"{provider} (failed)"
            else:
                translated = text
                used_provider = f"{provider} (failed)"

        # Cache result
        if translated != text and len(self.cache) < self.cache_limit:
            self.cache[cache_key] = translated

        return TranslationResult(
            original=text,
            translated=translated or text,
            source_lang=source,
            target_lang=target,
            provider=used_provider,
        )

    async def translate(
        self,
        text: str,
        source: str = "auto",
        target: str = "en",
        provider: str = "google",
    ) -> TranslationResult:
        """Async translation"""
        if not text or not text.strip():
            return TranslationResult(
                original=text,
                translated=text,
                source_lang=source,
                target_lang=target,
                provider="none",
            )

        # Run sync translator in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            _executor, self._translate_sync, text, source, target, provider
        )
        return result

    async def translate_batch(
        self,
        texts: list[str],
        source: str = "auto",
        target: str = "en",
        provider: str = "google",
    ) -> list[TranslationResult]:
        """Translate multiple texts"""
        tasks = [self.translate(text, source, target, provider) for text in texts]
        return await asyncio.gather(*tasks)

    def get_supported_languages(self) -> dict[str, str]:
        """Return supported languages"""
        return self.SUPPORTED_LANGUAGES


# Global instance
translation_service = TranslationService()
