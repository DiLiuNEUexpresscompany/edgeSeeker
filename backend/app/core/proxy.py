"""
Proxy configuration for external API requests
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Proxy URL from environment
PROXY_URL = os.getenv("PROXY_URL", "")

# Services that should use proxy (to bypass rate limits/blocks)
PROXY_ENABLED_SERVICES = [
    "yahoo_finance",
    "bluesky",
]


def get_proxy():
    """Get proxy URL for aiohttp requests"""
    return PROXY_URL if PROXY_URL else None
