"""
LLM Translation Service using Kimi K2
High-quality translation for news/social content
"""

import os
import asyncio
from typing import cast
from openai import OpenAI
from openai.types.chat import ChatCompletion
from dotenv import load_dotenv

load_dotenv()

# Kimi K2 configuration
KIMI_API_KEY = os.getenv("KIMI_API_KEY", "")
KIMI_BASE_URL = os.getenv("KIMI_BASE_URL", "https://api.moonshot.cn/v1")
KIMI_MODEL = os.getenv("KIMI_MODEL", "kimi-k2-turbo-preview")


class LLMTranslator:
    """LLM-based translation service using Kimi K2"""

    def __init__(self):
        self.client = None
        self.cache = {}  # Simple cache: {text_hash: translated_text}
        self._init_client()

    def _init_client(self):
        """Initialize OpenAI-compatible client"""
        if KIMI_API_KEY:
            self.client = OpenAI(
                api_key=KIMI_API_KEY,
                base_url=KIMI_BASE_URL,
            )

    def is_configured(self) -> bool:
        """Check if LLM is configured"""
        return bool(KIMI_API_KEY and self.client)

    def _get_cache_key(self, text: str, target: str) -> str:
        """Generate cache key"""
        return f"{target}:{hash(text)}"

    async def translate(self, text: str, target: str = "zh") -> str:
        """Translate a single text"""
        if not text or not text.strip():
            return text

        if not self.is_configured():
            return text

        # Check cache
        cache_key = self._get_cache_key(text, target)
        if cache_key in self.cache:
            return self.cache[cache_key]

        try:
            if not self.client:
                return text

            target_lang = "中文" if target in ["zh", "zh-CN", "zh-TW"] else "English"

            response = cast(
                ChatCompletion,
                await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model=KIMI_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": f"你是一个专业的新闻翻译专家。将以下内容翻译成{target_lang}。保持原文的语气和专业术语。只输出翻译结果，不要有任何解释。",
                        },
                        {"role": "user", "content": text},
                    ],
                    temperature=0.3,
                    max_tokens=2000,
                ),
            )

            if not response.choices or not response.choices[0].message.content:
                return text

            translated = response.choices[0].message.content.strip()

            # Cache the result
            self.cache[cache_key] = translated

            return translated

        except Exception as e:
            print(f"LLM translation error: {e}")
            return text

    async def translate_batch(self, texts: list[str], target: str = "zh") -> list[str]:
        """Translate multiple texts efficiently"""
        if not texts:
            return []

        if not self.is_configured():
            return texts

        # Filter out empty texts and check cache
        results = [""] * len(texts)
        to_translate = []
        to_translate_indices = []

        for i, text in enumerate(texts):
            if not text or not text.strip():
                results[i] = text
                continue

            cache_key = self._get_cache_key(text, target)
            if cache_key in self.cache:
                results[i] = self.cache[cache_key]
            else:
                to_translate.append(text)
                to_translate_indices.append(i)

        if not to_translate:
            return results

        # Batch translate (combine into one request for efficiency)
        try:
            if not self.client:
                return results

            target_lang = "中文" if target in ["zh", "zh-CN", "zh-TW"] else "English"

            # Format texts with markers for splitting later
            combined_text = "\n---SPLIT---\n".join(to_translate)

            response = cast(
                ChatCompletion,
                await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model=KIMI_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": f"""你是一个专业的新闻翻译专家。将以下内容翻译成{target_lang}。
规则：
1. 每段内容用 ---SPLIT--- 分隔
2. 保持原文的语气和专业术语
3. 只输出翻译结果，保持 ---SPLIT--- 分隔符
4. 不要添加任何解释或编号""",
                        },
                        {"role": "user", "content": combined_text},
                    ],
                    temperature=0.3,
                    max_tokens=8000,
                ),
            )

            if not response.choices or not response.choices[0].message.content:
                return results

            translated_combined = response.choices[0].message.content.strip()
            translated_parts = translated_combined.split("---SPLIT---")

            # Map results back
            for i, idx in enumerate(to_translate_indices):
                if i < len(translated_parts):
                    translated = translated_parts[i].strip()
                    results[idx] = translated
                    # Cache
                    cache_key = self._get_cache_key(to_translate[i], target)
                    self.cache[cache_key] = translated
                else:
                    results[idx] = to_translate[i]

        except Exception as e:
            print(f"LLM batch translation error: {e}")
            # Return original texts on error
            for i, idx in enumerate(to_translate_indices):
                results[idx] = to_translate[i]

        return results

    async def translate_dict(
        self, data: dict, fields: list[str], target: str = "zh"
    ) -> dict:
        """Translate specific fields in a dictionary"""
        texts = [data.get(field, "") for field in fields]
        translated = await self.translate_batch(texts, target)

        result = data.copy()
        for i, field in enumerate(fields):
            if field in result and translated[i]:
                result[field] = translated[i]

        return result

    async def translate_list(
        self, items: list[dict], fields: list[str], target: str = "zh"
    ) -> list[dict]:
        """Translate specific fields in a list of dictionaries"""
        if not items:
            return items

        # Collect all texts to translate
        all_texts = []
        for item in items:
            for field in fields:
                all_texts.append(item.get(field, ""))

        # Batch translate
        translated = await self.translate_batch(all_texts, target)

        # Map back to items
        results = []
        idx = 0
        for item in items:
            new_item = item.copy()
            for field in fields:
                if field in new_item and idx < len(translated):
                    new_item[field] = translated[idx]
                idx += 1
            results.append(new_item)

        return results

    def get_status(self) -> dict:
        """Get service status"""
        return {
            "configured": self.is_configured(),
            "provider": "Kimi K2",
            "model": KIMI_MODEL,
            "cache_size": len(self.cache),
        }


# Global instance
llm_translator = LLMTranslator()
