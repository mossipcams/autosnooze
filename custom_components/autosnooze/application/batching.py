"""Bounded concurrency helpers for application batch commands."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable

from homeassistant.core import HomeAssistant

BATCH_CONCURRENCY = 8

type SetAutomationState = Callable[[HomeAssistant, str, bool], Awaitable[bool]]


async def set_automation_state_bounded(
    semaphore: asyncio.Semaphore,
    set_state: SetAutomationState,
    hass: HomeAssistant,
    entity_id: str,
    *,
    enabled: bool,
) -> bool:
    """Apply one automation state change under the batch concurrency limit."""
    async with semaphore:
        return await set_state(hass, entity_id, enabled)


async def set_automation_states_bounded(
    set_state: SetAutomationState,
    hass: HomeAssistant,
    entity_ids: list[str],
    *,
    enabled: bool,
    should_apply: Callable[[str], bool] | None = None,
) -> dict[str, bool]:
    """Apply automation state changes with bounded concurrency."""
    ordered_ids = list(dict.fromkeys(entity_ids))
    if not ordered_ids:
        return {}

    semaphore = asyncio.Semaphore(BATCH_CONCURRENCY)
    results = await asyncio.gather(
        *(
            set_automation_state_bounded(semaphore, set_state, hass, entity_id, enabled=enabled)
            if should_apply is None or should_apply(entity_id)
            else asyncio.sleep(0, result=True)
            for entity_id in ordered_ids
        )
    )
    return dict(zip(ordered_ids, results, strict=True))
