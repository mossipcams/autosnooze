"""Persistence helpers for AutoSnooze."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable

from ..const import MAX_SAVE_RETRIES, SAVE_RETRY_DELAYS, TRANSIENT_ERRORS
from ..runtime.state import AutomationPauseData

_LOGGER = logging.getLogger(__name__)


async def async_save(
    data: AutomationPauseData,
    *,
    sleep: Callable[[float], Awaitable[object]] = asyncio.sleep,
) -> bool:
    """Save snoozed automations to storage with retry logic."""
    if data.store is None:
        return True

    save_data = {
        "paused": data.get_paused_dict(),
        "scheduled": data.get_scheduled_dict(),
    }

    last_error = None
    for attempt in range(MAX_SAVE_RETRIES + 1):
        try:
            await data.store.async_save(save_data)
            return True
        except TRANSIENT_ERRORS as err:
            last_error = err
            if attempt < MAX_SAVE_RETRIES:
                delay = SAVE_RETRY_DELAYS[attempt]
                _LOGGER.warning(
                    "Save attempt %d failed, retrying in %.1fs: %s",
                    attempt + 1,
                    delay,
                    err,
                )
                await sleep(delay)
        except Exception as err:
            _LOGGER.error("Failed to save data: %s", err)
            return False

    _LOGGER.error(
        "Failed to save data after %d attempts: %s",
        MAX_SAVE_RETRIES + 1,
        last_error,
    )
    return False
