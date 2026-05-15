"""Persistence helpers for AutoSnooze."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable

from ..const import MAX_SAVE_RETRIES, SAVE_RETRY_DELAYS, TRANSIENT_ERRORS
from ..models import AutomationPauseData

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

    for attempt, delay in enumerate(SAVE_RETRY_DELAYS, start=1):
        try:
            await data.store.async_save(save_data)
            return True
        except TRANSIENT_ERRORS as err:
            _LOGGER.warning(
                "Save attempt %d failed, retrying in %.1fs: %s",
                attempt,
                delay,
                err,
            )
            await sleep(delay)
        except Exception as err:
            _LOGGER.error("Failed to save data: %s", err)
            return False

    try:
        await data.store.async_save(save_data)
        return True
    except TRANSIENT_ERRORS as err:
        _LOGGER.error(
            "Failed to save data after %d attempts: %s",
            MAX_SAVE_RETRIES + 1,
            err,
        )
        return False
    except Exception as err:
        _LOGGER.error("Failed to save data: %s", err)
        return False
