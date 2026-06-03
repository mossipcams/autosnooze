"""Service handlers for AutoSnooze integration."""

from __future__ import annotations

from datetime import datetime
import logging
import re

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import entity_registry as er  # noqa: F401 — tests patch services.er

from .const import (
    ADJUST_SCHEMA,
    CANCEL_SCHEMA,
    CRITICAL_AUTOMATION_TERMS,
    DOMAIN,
    PAUSE_BY_AREA_SCHEMA,
    PAUSE_BY_LABEL_SCHEMA,
    PAUSE_SCHEMA,
)
from .application import pause as pause_application
from .application.resume import (
    async_clear_notification_config_batch,
    async_handle_cancel_all_service,
    async_handle_cancel_service,
    async_handle_clear_notification_service,
)
from .application.scheduled import async_handle_cancel_scheduled_service
from .application.adjust import async_handle_adjust_service
from .domain.notifications import NOTIFICATION_TRIGGER_NONE, NotificationTrigger
from .coordinator import (
    _notify_started_automations,
    async_save,
    async_set_automation_state,
    schedule_disable,
    schedule_pre_resume_notification,
    schedule_resume,
)
from .models import ensure_utc_aware
from .runtime.state import AutomationPauseData

_LOGGER = logging.getLogger(__name__)


def _contains_guardrail_term(text: str, term: str) -> bool:
    """Check whether a term appears as a token/phrase in text."""
    escaped = re.escape(term.lower())
    return re.search(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])", text.lower()) is not None


def _is_critical_automation(entity_id: str, friendly_name: str) -> bool:
    """Detect whether automation appears to control critical infrastructure."""
    targets = [entity_id, friendly_name]
    return any(_contains_guardrail_term(target, term) for target in targets for term in CRITICAL_AUTOMATION_TERMS)


get_automations_by_area = pause_application.get_automations_by_area
get_automations_by_label = pause_application.get_automations_by_label
_validate_guardrails = pause_application.validate_guardrails


async def async_pause_automations(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    days: int = 0,
    hours: int = 0,
    minutes: int = 0,
    disable_at: datetime | None = None,
    resume_at_dt: datetime | None = None,
    notification_trigger: NotificationTrigger = NOTIFICATION_TRIGGER_NONE,
    notification_lead_minutes: int | None = None,
) -> None:
    """Service-layer pause seam preserved for direct callers and tests."""
    await pause_application.async_pause_automations(
        hass,
        data,
        entity_ids,
        days,
        hours,
        minutes,
        disable_at,
        resume_at_dt,
        notification_trigger,
        notification_lead_minutes,
        set_automation_state=lambda hass, entity_id, enabled: async_set_automation_state(
            hass,
            entity_id,
            enabled=enabled,
        ),
        save_data=async_save,
        notify_started_automations=lambda hass, paused_entries: _notify_started_automations(
            hass,
            paused_entries,
            save_succeeded=True,
        ),
        schedule_resume_callback=schedule_resume,
        schedule_disable_callback=schedule_disable,
        schedule_pre_resume_notification_callback=schedule_pre_resume_notification,
    )


async def async_clear_notification_config(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
) -> None:
    """Service-layer seam preserved for clearing paused notification config."""
    await async_clear_notification_config_batch(hass, data, entity_ids)


def register_services(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Register integration services."""

    async def handle_pause(call: ServiceCall) -> None:
        """Handle snooze service call."""
        if data.unloaded:
            return

        entity_ids = call.data[ATTR_ENTITY_ID]
        confirm = call.data.get("confirm", False)
        days = call.data.get("days", 0)
        hours = call.data.get("hours", 0)
        minutes = call.data.get("minutes", 0)
        disable_at = ensure_utc_aware(call.data.get("disable_at"))
        resume_at_dt = ensure_utc_aware(call.data.get("resume_at"))
        notification_trigger = call.data.get("notification_trigger", NOTIFICATION_TRIGGER_NONE)
        notification_lead_minutes = call.data.get("notification_lead_minutes")

        _validate_guardrails(hass, entity_ids, confirm=confirm)
        await async_pause_automations(
            hass,
            data,
            entity_ids,
            days,
            hours,
            minutes,
            disable_at,
            resume_at_dt,
            notification_trigger,
            notification_lead_minutes,
        )

    async def handle_cancel(call: ServiceCall) -> None:
        """Handle wake service call (FR-10: Early Wake Up)."""
        await async_handle_cancel_service(hass, data, call)

    async def handle_cancel_all(_call: ServiceCall) -> None:
        """Handle wake all service call."""
        await async_handle_cancel_all_service(hass, data)

    async def handle_pause_by_area(call: ServiceCall) -> None:
        """Handle pause by area service call."""
        if data.unloaded:
            return

        area_value = call.data["area_id"]
        area_ids = [area_value] if isinstance(area_value, str) else area_value
        entity_ids = get_automations_by_area(hass, area_ids)
        if not entity_ids:
            _LOGGER.warning("No automations found in area(s): %s", area_ids)
            return

        _validate_guardrails(hass, entity_ids, confirm=call.data.get("confirm", False))
        await async_pause_automations(
            hass,
            data,
            entity_ids,
            call.data.get("days", 0),
            call.data.get("hours", 0),
            call.data.get("minutes", 0),
            ensure_utc_aware(call.data.get("disable_at")),
            ensure_utc_aware(call.data.get("resume_at")),
            call.data.get("notification_trigger", NOTIFICATION_TRIGGER_NONE),
            call.data.get("notification_lead_minutes"),
        )

    async def handle_pause_by_label(call: ServiceCall) -> None:
        """Handle pause by label service call."""
        if data.unloaded:
            return

        label_value = call.data["label_id"]
        label_ids = [label_value] if isinstance(label_value, str) else label_value
        entity_ids = get_automations_by_label(hass, label_ids)
        if not entity_ids:
            _LOGGER.warning("No automations found with label(s): %s", label_ids)
            return

        _validate_guardrails(hass, entity_ids, confirm=call.data.get("confirm", False))
        await async_pause_automations(
            hass,
            data,
            entity_ids,
            call.data.get("days", 0),
            call.data.get("hours", 0),
            call.data.get("minutes", 0),
            ensure_utc_aware(call.data.get("disable_at")),
            ensure_utc_aware(call.data.get("resume_at")),
            call.data.get("notification_trigger", NOTIFICATION_TRIGGER_NONE),
            call.data.get("notification_lead_minutes"),
        )

    async def handle_cancel_scheduled(call: ServiceCall) -> None:
        """Handle cancel scheduled snooze service call."""
        await async_handle_cancel_scheduled_service(hass, data, call)

    async def handle_clear_notification(call: ServiceCall) -> None:
        """Handle clear notification config service call."""
        await async_handle_clear_notification_service(hass, data, call)

    async def handle_adjust(call: ServiceCall) -> None:
        """Handle adjust snooze service call."""
        await async_handle_adjust_service(hass, data, call)

    hass.services.async_register(DOMAIN, "pause", handle_pause, schema=PAUSE_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel", handle_cancel, schema=CANCEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_all", handle_cancel_all)
    hass.services.async_register(DOMAIN, "pause_by_area", handle_pause_by_area, schema=PAUSE_BY_AREA_SCHEMA)
    hass.services.async_register(DOMAIN, "pause_by_label", handle_pause_by_label, schema=PAUSE_BY_LABEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_scheduled", handle_cancel_scheduled, schema=CANCEL_SCHEMA)
    hass.services.async_register(
        DOMAIN,
        "clear_notification",
        handle_clear_notification,
        schema=CANCEL_SCHEMA,
    )
    hass.services.async_register(DOMAIN, "adjust", handle_adjust, schema=ADJUST_SCHEMA)
