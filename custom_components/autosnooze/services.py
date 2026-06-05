"""Service handlers for AutoSnooze integration."""

from __future__ import annotations

from datetime import datetime
import logging

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from .application import pause as pause_application
from .domain.notifications import NOTIFICATION_TRIGGER_NONE, NotificationTrigger
from .application.adjust import async_handle_adjust_service
from .application.notifications import notify_started_automations
from .application.pause import (
    async_handle_pause_by_area_service,
    async_handle_pause_by_label_service,
    async_handle_pause_service,
)
from .application.resume import (
    async_clear_notification_config_batch,
    async_handle_cancel_all_service,
    async_handle_cancel_service,
    async_handle_clear_notification_service,
)
from .application.scheduled import async_handle_cancel_scheduled_service
from .const import ADJUST_SCHEMA, CANCEL_SCHEMA, DOMAIN, PAUSE_BY_AREA_SCHEMA, PAUSE_BY_LABEL_SCHEMA, PAUSE_SCHEMA
from .domain.transitions import TransitionResult
from .runtime.adapters.automation_state import async_set_automation_state
from .runtime.adapters.persistence import async_save
from .runtime.adapters.timer_scheduling import schedule_disable, schedule_pre_resume_notification, schedule_resume
from .runtime.state import AutomationPauseData
from .service_responses import transition_result_to_service_response

_LOGGER = logging.getLogger(__name__)

get_automations_by_area = pause_application.get_automations_by_area
get_automations_by_label = pause_application.get_automations_by_label
_validate_guardrails = pause_application.validate_guardrails
_contains_guardrail_term = pause_application._contains_guardrail_term
_is_critical_automation = pause_application._is_critical_automation


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
) -> TransitionResult:
    """Service-layer pause seam preserved for direct callers and tests."""
    return await pause_application.async_pause_automations(
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
        notify_started_automations=lambda hass, paused_entries: notify_started_automations(
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


def _service_response_from_result(
    call: ServiceCall,
    result: TransitionResult | None,
) -> dict[str, object] | None:
    if not call.return_response or result is None:
        return None
    return transition_result_to_service_response(result)


def register_services(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Register integration services."""

    async def handle_pause(call: ServiceCall) -> dict[str, object] | None:
        result = await async_handle_pause_service(hass, data, call)
        return _service_response_from_result(call, result)

    async def handle_cancel(call: ServiceCall) -> dict[str, object] | None:
        result = await async_handle_cancel_service(hass, data, call)
        return _service_response_from_result(call, result)

    async def handle_cancel_all(call: ServiceCall) -> dict[str, object] | None:
        result = await async_handle_cancel_all_service(hass, data)
        return _service_response_from_result(call, result)

    async def handle_pause_by_area(call: ServiceCall) -> None:
        await async_handle_pause_by_area_service(hass, data, call)

    async def handle_pause_by_label(call: ServiceCall) -> None:
        await async_handle_pause_by_label_service(hass, data, call)

    async def handle_cancel_scheduled(call: ServiceCall) -> None:
        await async_handle_cancel_scheduled_service(hass, data, call)

    async def handle_clear_notification(call: ServiceCall) -> None:
        await async_handle_clear_notification_service(hass, data, call)

    async def handle_adjust(call: ServiceCall) -> None:
        await async_handle_adjust_service(hass, data, call)

    hass.services.async_register(
        DOMAIN,
        "pause",
        handle_pause,
        schema=PAUSE_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        "cancel",
        handle_cancel,
        schema=CANCEL_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        "cancel_all",
        handle_cancel_all,
        supports_response=SupportsResponse.OPTIONAL,
    )
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
