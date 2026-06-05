"""Persistence adapter for runtime state."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable

from ...infrastructure.storage import async_save as infrastructure_async_save
from ..state import AutomationPauseData


async def async_save(
    data: AutomationPauseData,
    *,
    sleep: Callable[[float], Awaitable[object]] = asyncio.sleep,
) -> bool:
    """Save runtime state to storage with retry logic."""
    return await infrastructure_async_save(data, sleep=sleep)
