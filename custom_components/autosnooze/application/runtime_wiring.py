"""Entry-scoped runtime callback wiring for AutoSnooze."""

from __future__ import annotations

from datetime import datetime

from homeassistant.core import HomeAssistant

from ..domain.transitions import TransitionOutcome
from ..models import PausedAutomation
from ..runtime.state import AutomationPauseData, ResumeReason
from . import notifications
from .resume import async_resume, async_resume_batch


async def _deadline_resume_callback(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    *,
    reason: ResumeReason = "expired",
) -> None:
    """Run one batch resume for every entity sharing a deadline."""
    expected_pauses = {
        entity_id: data.paused[entity_id]
        for entity_id in entity_ids
        if entity_id in data.paused
    }
    result = await async_resume_batch(hass, data, entity_ids, reason=reason)
    if reason != "expired":
        return
    resumed_items = [
        expected_pauses[entity.entity_id]
        for entity in result.entities
        if entity.outcome is TransitionOutcome.SUCCEEDED and entity.entity_id in expected_pauses
    ]
    if resumed_items:
        await notifications.notify_resumed_automations(
            hass,
            resumed_items,
            reason=reason,
            save_succeeded=True,
        )


async def _timer_resume_callback(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    *,
    reason: ResumeReason = "expired",
) -> None:
    """Run application resume and emit expiry notifications when configured."""
    expected_pause = data.paused.get(entity_id)
    result = await async_resume(hass, data, entity_id, reason=reason)
    if (
        reason == "expired"
        and expected_pause is not None
        and result.entities
        and result.entities[0].outcome is TransitionOutcome.SUCCEEDED
    ):
        await notifications.notify_resumed_automations(
            hass,
            [expected_pause],
            reason=reason,
            save_succeeded=True,
        )


async def _started_notification_callback(
    hass: HomeAssistant,
    started_items: list[PausedAutomation],
) -> None:
    await notifications.notify_started_automations(hass, started_items, save_succeeded=True)


async def _scheduled_disable_callback(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
) -> None:
    from .scheduled import async_execute_scheduled_disable

    await async_execute_scheduled_disable(hass, data, entity_id, resume_at)


def wire_runtime_callbacks(data: AutomationPauseData) -> None:
    """Attach per-entry timer and restore callbacks."""
    data.resume_callback = _timer_resume_callback
    data.deadline_resume_callback = _deadline_resume_callback
    data.scheduled_disable_callback = _scheduled_disable_callback
    data.notification_callback = notifications.async_send_pre_resume_notification
    data.started_notification_callback = _started_notification_callback


def create_entry_data(store, hass: HomeAssistant) -> AutomationPauseData:
    """Create runtime data with entry-scoped callbacks."""
    data = AutomationPauseData(store=store, hass=hass)
    wire_runtime_callbacks(data)
    return data
