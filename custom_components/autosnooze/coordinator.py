"""Backward-compatibility re-exports for tests and legacy imports.

Production code must not import workflow logic from this module.
"""

from __future__ import annotations

from typing import Literal

from homeassistant.core import HomeAssistant

from .application.adjust import async_adjust_snooze, async_adjust_snooze_batch
from .application.notifications import (
    async_send_pre_resume_notification,
    build_pre_resume_notification,
    build_resume_batch_notification,
    build_resume_notification,
    build_started_batch_notification,
    build_started_notification,
    notify_resumed_automations,
    notify_started_automations,
    send_resume_notification,
)
from .application.restore import async_restore_stored
from .application.resume import async_resume as _application_async_resume
from .application.resume import async_resume_batch as _application_async_resume_batch
from .application.scheduled import (
    async_cancel_scheduled,
    async_cancel_scheduled_batch,
    async_execute_scheduled_disable,
)
from .domain.transitions import TransitionOutcome
from .runtime.adapters.automation_state import async_set_automation_state, get_friendly_name
from .runtime.adapters.persistence import async_save
from .runtime.adapters.timer_scheduling import schedule_disable, schedule_pre_resume_notification, schedule_resume
from .runtime.restore import validate_stored_data, validate_stored_entry
from .runtime.state import AutomationPauseData
from .runtime.timers import cancel_notification_timer, cancel_scheduled_timer, cancel_timer

ResumeReason = Literal["manual", "expired"]

# Legacy private names retained for notification contract tests.
_build_resume_notification = build_resume_notification
_build_resume_batch_notification = build_resume_batch_notification
_build_started_notification = build_started_notification
_build_started_batch_notification = build_started_batch_notification
_build_pre_resume_notification = build_pre_resume_notification
_send_resume_notification = send_resume_notification
_notify_resumed_automations = notify_resumed_automations
_notify_started_automations = notify_started_automations


async def async_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    *,
    reason: ResumeReason = "manual",
) -> None:
    """Compatibility wrapper around the application resume command."""
    expected_pause = data.paused.get(entity_id) if reason == "expired" else None
    result = await _application_async_resume(hass, data, entity_id, reason=reason)
    if (
        reason == "expired"
        and expected_pause is not None
        and result.entities
        and result.entities[0].outcome is TransitionOutcome.SUCCEEDED
    ):
        await notify_resumed_automations(
            hass,
            [expected_pause],
            reason=reason,
            save_succeeded=True,
        )


async def async_resume_batch(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    *,
    reason: ResumeReason = "manual",
) -> None:
    """Compatibility wrapper around the application batch resume command."""
    expected = {entity_id: data.paused[entity_id] for entity_id in entity_ids if entity_id in data.paused}
    result = await _application_async_resume_batch(hass, data, entity_ids, reason=reason)
    if reason != "expired":
        return
    resumed_items = [
        expected[entity.entity_id]
        for entity in result.entities
        if entity.outcome is TransitionOutcome.SUCCEEDED and entity.entity_id in expected
    ]
    if resumed_items:
        await notify_resumed_automations(
            hass,
            resumed_items,
            reason=reason,
            save_succeeded=True,
        )


async def async_load_stored(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Compatibility alias for the application restore command."""
    await async_restore_stored(hass, data)
