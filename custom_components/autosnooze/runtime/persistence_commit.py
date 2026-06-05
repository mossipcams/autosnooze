"""Commit runtime snapshots under lock and persist outside lock."""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING

from ..domain.transitions import RecoveryStatus
from . import ports as runtime_ports

if TYPE_CHECKING:
    from .state import AutomationPauseData

_LOGGER = logging.getLogger(__name__)
SaveData = Callable[["AutomationPauseData"], Awaitable[bool]]


@dataclass(frozen=True, slots=True)
class PersistenceSnapshot:
    """Immutable storage payload captured under the runtime lock."""

    paused: dict[str, dict[str, object]]
    scheduled: dict[str, dict[str, object]]


async def commit_snapshot(
    data: AutomationPauseData,
    *,
    lifecycle_generation: int,
    mutate: Callable[[], None],
) -> PersistenceSnapshot | None:
    """Apply a mutation under lock and capture an immutable persistence snapshot."""
    async with data.lock:
        if data.unloaded or data.lifecycle_generation != lifecycle_generation:
            return None
        mutate()
        data.bump_snapshot_version()
        return PersistenceSnapshot(
            paused=data.get_paused_dict(),
            scheduled=data.get_scheduled_dict(),
        )


async def persist_snapshot(
    data: AutomationPauseData,
    snapshot: PersistenceSnapshot,
    *,
    save_data: SaveData | None = None,
) -> bool:
    """Persist a captured snapshot without holding the runtime lock."""
    saver = save_data or runtime_ports.async_save
    data._pending_persistence_snapshot = snapshot
    try:
        return await saver(data)
    finally:
        data._pending_persistence_snapshot = None


async def mark_persistence_recovery(
    data: AutomationPauseData,
    entity_ids: list[str],
) -> None:
    """Mark affected entities as recovery-required after a failed persistence commit."""
    if not entity_ids:
        return
    async with data.lock:
        for entity_id in entity_ids:
            paused = data.paused.get(entity_id)
            if paused is not None:
                paused.recovery_status = RecoveryStatus.REQUIRED
            scheduled = data.scheduled.get(entity_id)
            if scheduled is not None and paused is None:
                _LOGGER.warning(
                    "Persistence failure for scheduled snooze %s; runtime state retained in memory",
                    entity_id,
                )


async def commit_and_persist(
    data: AutomationPauseData,
    *,
    lifecycle_generation: int,
    mutate: Callable[[], None],
    affected_entity_ids: list[str],
    save_data: SaveData | None = None,
    raise_on_failure: bool = True,
) -> bool:
    """Commit under lock, persist outside lock, and mark recovery on failure."""
    snapshot = await commit_snapshot(
        data,
        lifecycle_generation=lifecycle_generation,
        mutate=mutate,
    )
    if snapshot is None:
        return False

    if await persist_snapshot(data, snapshot, save_data=save_data):
        return True

    await mark_persistence_recovery(data, affected_entity_ids)
    if raise_on_failure:
        from ..logging_utils import _raise_save_failed

        _raise_save_failed()
    return False
