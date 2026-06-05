"""Persistence helpers for AutoSnooze."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from inspect import isawaitable

from ..const import MAX_SAVE_RETRIES, SAVE_RETRY_DELAYS, TRANSIENT_ERRORS
from ..runtime.state import AutomationPauseData

_LOGGER = logging.getLogger(__name__)


def _build_save_payload(data: AutomationPauseData) -> dict[str, dict[str, dict[str, object]]]:
    pending_snapshot = data._pending_persistence_snapshot
    if pending_snapshot is not None:
        return {
            "paused": pending_snapshot.paused,
            "scheduled": pending_snapshot.scheduled,
        }
    return {
        "paused": data.get_paused_dict(),
        "scheduled": data.get_scheduled_dict(),
    }


async def _write_save_payload(
    data: AutomationPauseData,
    *,
    sleep: Callable[[float], Awaitable[object]] = asyncio.sleep,
) -> bool:
    if data.store is None:
        return True

    save_data = _build_save_payload(data)

    for attempt, delay in enumerate(SAVE_RETRY_DELAYS, start=1):
        try:
            result = data.store.async_save(save_data)
            if isawaitable(result):
                await result
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
        result = data.store.async_save(save_data)
        if isawaitable(result):
            await result
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


async def async_save(
    data: AutomationPauseData,
    *,
    sleep: Callable[[float], Awaitable[object]] = asyncio.sleep,
    coalesce: bool = False,
) -> bool:
    """Save snoozed automations to storage with retry logic."""
    if not coalesce:
        return await _write_save_payload(data, sleep=sleep)

    if data._save_in_flight:
        data._pending_followup_save = True
        return True

    data._save_in_flight = True
    try:
        result = await _write_save_payload(data, sleep=sleep)
        while data._pending_followup_save:
            data._pending_followup_save = False
            result = await _write_save_payload(data, sleep=sleep) and result
        return result
    finally:
        data._save_in_flight = False


async def async_save_coalesced(data: AutomationPauseData) -> bool:
    """Coalesce overlapping save requests and flush the latest snapshot."""
    return await async_save(data, coalesce=True)
