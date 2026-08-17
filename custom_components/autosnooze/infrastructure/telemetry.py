"""PostHog product telemetry for AutoSnooze."""

from __future__ import annotations

import asyncio
import hashlib
import logging
import uuid
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime
from queue import Empty, Queue
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from posthog import Posthog
from posthog.utils import system_context

from ..const import (
    DOMAIN,
    VERSION,
)

_LOGGER = logging.getLogger(__name__)

EVENT_SCHEMA_VERSION = "3"
TELEMETRY_PLATFORMS = frozenset({"web", "mobile", "tablet"})
POSTHOG_PROJECT_API_KEY = "phc_onzUF6SgjU9kfmCJN5XWxQL5SkDrYEJzeyCBFK3Xzfvb"
POSTHOG_HOST = "https://us.i.posthog.com"
TELEMETRY_STORAGE_KEY = f"{DOMAIN}.telemetry"
OPTION_TELEMETRY_ENABLED = "telemetry_enabled"
TELEMETRY_STORAGE_VERSION = 1

SOURCES = frozenset({"card", "service", "timer", "startup"})
CARD_TYPES = frozenset({"full", "snoozed_only"})
SNOOZE_STRATEGIES = frozenset(
    {
        "duration",
        "resume_datetime",
        "resume_time",
        "end_of_day",
        "next_morning",
        "next_sunrise",
        "next_sunset",
        "scheduled_window",
    }
)
INPUT_METHODS = frozenset({"card", "service"})
DIRECTIONS = frozenset({"extend", "shorten"})
NOTIFICATION_TRIGGERS = frozenset({"none", "start", "about_to_end", "end"})
SNOOZE_END_REASONS = frozenset({"timer", "manual"})
OPERATIONS = frozenset({"pause", "adjust"})
WAKE_SCOPES = frozenset({"one", "all"})
ADJUST_SCOPES = frozenset({"one", "group"})
FILTER_TABS = frozenset({"all", "areas", "categories", "labels"})
ERROR_CODE_ALLOWLIST = frozenset(
    {
        "invalid_duration",
        "resume_time_past",
        "disable_after_resume",
        "confirmation_required",
        "save_failed",
        "notification_lead_too_long",
        "automation_state_failed",
        "not_automation",
        "invalid_resume_preset",
        "invalid_adjustment",
        "adjust_time_too_short",
        "unknown",
    }
)
TRANSLATION_KEY_TO_ERROR_CODE: dict[str, str] = {
    "confirm_required": "confirmation_required",
}
MAX_MINUTES = 10080
MAX_TARGET_COUNT = 500

EVENT_SCHEMAS: dict[str, frozenset[str]] = {
    "integration_active": frozenset(),
    "card_viewed": frozenset({"card_type"}),
    "selection_feature_used": frozenset({"target_count"}),
    "duration_option_selected": frozenset({"duration_minutes"}),
    "snooze_created": frozenset(
        {
            "strategy",
            "input_method",
            "duration_minutes",
            "target_count",
            "notification_trigger",
            "notification_lead_minutes",
            "confirmation_used",
        }
    ),
    "scheduled_snooze_created": frozenset(
        {
            "minutes_until_start",
            "planned_duration_minutes",
            "target_count",
            "resume_local_hour",
        }
    ),
    "scheduled_snooze_started": frozenset({"target_count", "planned_duration_minutes"}),
    "snooze_adjusted": frozenset({"delta_minutes", "direction", "target_count"}),
    "snooze_ended": frozenset({"reason"}),
    "scheduled_snooze_cancelled": frozenset({"target_count", "minutes_before_start"}),
    "notification_used": frozenset({"trigger"}),
    "notification_cleared": frozenset({"target_count"}),
    "operation_failed": frozenset({"operation", "error_code", "strategy", "target_count"}),
    "confirmation_result": frozenset({"target_count"}),
    "snooze_button_clicked": frozenset({"target_count", "schedule_mode", "until_tomorrow"}),
    "wake_clicked": frozenset({"scope"}),
    "adjust_opened": frozenset({"scope"}),
    "adjust_option_selected": frozenset({"direction", "delta_minutes"}),
    "scheduled_cancel_clicked": frozenset({"target_count"}),
    "filter_tab_selected": frozenset({"tab"}),
    "hide_snoozed_toggled": frozenset({"enabled"}),
    "schedule_mode_toggled": frozenset({"enabled"}),
    "until_tomorrow_selected": frozenset(),
    "custom_duration_toggled": frozenset({"enabled"}),
    "notification_options_changed": frozenset({"trigger", "enabled", "notification_lead_minutes"}),
    "confirmation_dismissed": frozenset({"target_count"}),
}

REQUIRED_EVENT_PROPERTIES = {
    event: properties - ({"strategy"} if event == "operation_failed" else set())
    for event, properties in EVENT_SCHEMAS.items()
}

_POSTHOG_SET_KEYS = frozenset(
    {
        "autosnooze_version",
        "home_assistant_version",
        "event_schema_version",
    }
)
_POSTHOG_SET_ONCE_KEYS = frozenset(
    {
        "initial_autosnooze_version",
        "initial_home_assistant_version",
    }
)


def map_translation_key_to_error_code(translation_key: str | None) -> str:
    if not translation_key:
        return "unknown"
    mapped = TRANSLATION_KEY_TO_ERROR_CODE.get(translation_key, translation_key)
    if mapped in ERROR_CODE_ALLOWLIST:
        return mapped
    return "unknown"


def _validate_enum(value: Any, allowed: frozenset[str]) -> str | None:
    if isinstance(value, str) and value in allowed:
        return value
    return None


def _validate_bool(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if value in ("true", "false"):
        return value == "true"
    return None


def _validate_int(value: Any, *, min_value: int = 0, max_value: int) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        number = value
    elif isinstance(value, str) and value.isdigit():
        number = int(value)
    else:
        return None
    if min_value <= number <= max_value:
        return number
    return None


def _validate_property(key: str, value: Any) -> Any | None:
    validators: dict[str, Any] = {
        "strategy": lambda v: _validate_enum(v, SNOOZE_STRATEGIES),
        "input_method": lambda v: _validate_enum(v, INPUT_METHODS),
        "notification_trigger": lambda v: _validate_enum(v, NOTIFICATION_TRIGGERS),
        "trigger": lambda v: _validate_enum(v, NOTIFICATION_TRIGGERS),
        "reason": lambda v: _validate_enum(v, SNOOZE_END_REASONS),
        "direction": lambda v: _validate_enum(v, DIRECTIONS),
        "operation": lambda v: _validate_enum(v, OPERATIONS),
        "error_code": lambda v: _validate_enum(v, ERROR_CODE_ALLOWLIST),
        "card_type": lambda v: _validate_enum(v, CARD_TYPES),
        "scope": lambda v: _validate_enum(v, WAKE_SCOPES | ADJUST_SCOPES),
        "tab": lambda v: _validate_enum(v, FILTER_TABS),
        "confirmation_used": _validate_bool,
        "enabled": _validate_bool,
        "schedule_mode": _validate_bool,
        "until_tomorrow": _validate_bool,
        "duration_minutes": lambda v: _validate_int(v, max_value=MAX_MINUTES),
        "notification_lead_minutes": lambda v: _validate_int(v, max_value=MAX_MINUTES),
        "minutes_until_start": lambda v: _validate_int(v, max_value=MAX_MINUTES),
        "planned_duration_minutes": lambda v: _validate_int(v, max_value=MAX_MINUTES),
        "minutes_before_start": lambda v: _validate_int(v, max_value=MAX_MINUTES),
        "delta_minutes": lambda v: _validate_int(v, min_value=1, max_value=MAX_MINUTES),
        "target_count": lambda v: _validate_int(v, max_value=MAX_TARGET_COUNT),
        "resume_local_hour": lambda v: _validate_int(v, max_value=23),
    }
    validator = validators.get(key)
    if validator is None:
        return None
    return validator(value)


def sanitize_event_properties(
    event: str,
    properties: dict[str, Any] | None,
    *,
    source: str,
    card_type: str | None = None,
    platform: str | None = None,
) -> dict[str, Any] | None:
    if event not in EVENT_SCHEMAS:
        return None
    if source not in SOURCES:
        return None
    if platform is not None and platform not in TELEMETRY_PLATFORMS:
        return None
    if properties is not None and not isinstance(properties, dict):
        return None

    allowed = EVENT_SCHEMAS[event]
    cleaned: dict[str, Any] = {}
    for key, value in (properties or {}).items():
        if key not in allowed:
            return None
        validated = _validate_property(key, value)
        if validated is None:
            return None
        cleaned[key] = validated

    if card_type is not None:
        validated_card_type = _validate_enum(card_type, CARD_TYPES)
        if validated_card_type is None:
            return None
        cleaned["card_type"] = validated_card_type

    if not REQUIRED_EVENT_PROPERTIES[event].issubset(cleaned):
        return None

    if event == "card_viewed" and cleaned.get("card_type") not in CARD_TYPES:
        return None
    if event == "snooze_created" and cleaned.get("strategy") not in SNOOZE_STRATEGIES:
        return None
    if event == "operation_failed" and cleaned.get("error_code") not in ERROR_CODE_ALLOWLIST:
        return None
    if event == "wake_clicked" and cleaned.get("scope") not in WAKE_SCOPES:
        return None
    if event == "adjust_opened" and cleaned.get("scope") not in ADJUST_SCOPES:
        return None

    payload = {
        "source": source,
        **cleaned,
    }
    if platform is not None:
        payload["platform"] = platform
    return payload


def _filter_posthog_message(message: dict[str, Any]) -> dict[str, Any] | None:
    """Keep only AutoSnooze properties after PostHog SDK enrichment."""
    event = message.get("event")
    properties = message.get("properties")
    if not isinstance(event, str) or event not in EVENT_SCHEMAS or not isinstance(properties, dict):
        return None

    allowed = {"source", "platform", *EVENT_SCHEMAS[event], "$set", "$set_once", "$geoip_disable"}
    filtered: dict[str, Any] = {}
    for key, value in properties.items():
        if key not in allowed:
            continue
        if key == "$geoip_disable":
            if value is True:
                filtered[key] = True
            continue
        if key == "$set":
            if isinstance(value, dict):
                filtered[key] = {k: v for k, v in value.items() if k in _POSTHOG_SET_KEYS}
            continue
        if key == "$set_once":
            if isinstance(value, dict):
                filtered[key] = {k: v for k, v in value.items() if k in _POSTHOG_SET_ONCE_KEYS}
            continue
        filtered[key] = value

    return {**message, "properties": filtered}


def _discard_posthog_queues(client: Posthog) -> None:
    """Drop buffered events before disabling and shutting down PostHog."""
    lanes = getattr(client, "_lanes", None)
    if not isinstance(lanes, (list, tuple)):
        lane = getattr(client, "_analytics_lane", None)
        lanes = [lane] if lane is not None else []

    for lane in lanes:
        if lane is None:
            continue
        close = getattr(lane, "close", None)
        if callable(close):
            close()
        for consumer in getattr(lane, "consumers", ()):
            pause = getattr(consumer, "pause", None)
            if callable(pause):
                pause()
        queue = getattr(lane, "queue", None)
        if not isinstance(queue, Queue):
            continue
        while True:
            try:
                queue.get_nowait()
            except Empty:
                break
            else:
                queue.task_done()


def _ha_version() -> str:
    try:
        from homeassistant.const import __version__ as ha_version

        return ha_version
    except Exception:
        return "unknown"


def _silence_posthog_sdk_logs() -> None:
    """ponytail: hides all PostHog SDK logs including debug; upgrade path is a dedicated Filter if we need SDK debug in HA."""
    logging.getLogger("posthog").setLevel(logging.CRITICAL)


def _load_stored_day(stored: dict[str, Any], key: str) -> str | None:
    value = stored.get(key)
    return value if isinstance(value, str) else None


@dataclass
class TelemetryClient:
    """Fire-and-forget PostHog client."""

    hass: HomeAssistant
    entry: ConfigEntry
    store: Store
    _install_id: str | None = None
    _posthog: Posthog | None = None
    _last_card_viewed_day: str | None = None
    _last_integration_active_day: str | None = None
    _disabled: bool = False
    _persistence_lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    _persistence_tasks: set[asyncio.Future[Any]] = field(default_factory=set)

    def is_enabled(self) -> bool:
        if self._disabled:
            return False
        return bool(self.entry.options.get(OPTION_TELEMETRY_ENABLED, True))

    async def async_setup(self) -> None:
        if not self.is_enabled():
            return
        try:
            _silence_posthog_sdk_logs()
            stored = await self.store.async_load() or {}
            install_id = stored.get("install_id")
            if not isinstance(install_id, str) or not install_id:
                install_id = str(uuid.uuid4())
                stored["install_id"] = install_id
                await self.store.async_save(stored)
            self._install_id = install_id
            self._last_card_viewed_day = _load_stored_day(stored, "last_card_viewed_day")
            self._last_integration_active_day = _load_stored_day(stored, "last_integration_active_day")
            await self.hass.async_add_executor_job(system_context)
            self._posthog = Posthog(
                POSTHOG_PROJECT_API_KEY,
                host=POSTHOG_HOST,
                disable_geoip=True,
                enable_exception_autocapture=False,
                enable_local_evaluation=False,
                sync_mode=False,
                before_send=_filter_posthog_message,
            )
        except Exception:
            _LOGGER.debug("Telemetry storage unavailable; disabling telemetry", exc_info=True)
            self._disabled = True
            self._install_id = None
            self._last_card_viewed_day = None
            self._last_integration_active_day = None
            self._posthog = None

    async def async_unload(self) -> None:
        self._disabled = True
        if self._persistence_tasks:
            await asyncio.gather(*self._persistence_tasks, return_exceptions=True)
        client = self._posthog
        self._posthog = None
        if client is None:
            return
        client.disabled = True
        try:
            _discard_posthog_queues(client)
            await self.hass.async_add_executor_job(client.shutdown)
        except Exception:
            _LOGGER.debug("Telemetry PostHog shutdown failed", exc_info=True)

    def track(
        self,
        event: str,
        properties: dict[str, Any] | None,
        *,
        source: str,
        card_type: str | None = None,
        platform: str | None = None,
    ) -> None:
        try:
            if not self.is_enabled():
                return
            throttle: tuple[str, str] | None = None
            if event == "card_viewed":
                throttle = ("last_card_viewed_day", "_last_card_viewed_day")
            elif event == "integration_active":
                throttle = ("last_integration_active_day", "_last_integration_active_day")
            if throttle is not None and not self._should_emit_once_per_utc_day(*throttle):
                return

            payload = sanitize_event_properties(
                event,
                properties,
                source=source,
                card_type=card_type,
                platform=platform,
            )
            if payload is None:
                return

            distinct_id = self._distinct_id()
            if distinct_id is None or self._posthog is None:
                return

            payload = {
                **payload,
                "$set": {
                    "autosnooze_version": VERSION,
                    "home_assistant_version": _ha_version(),
                    "event_schema_version": EVENT_SCHEMA_VERSION,
                },
                "$set_once": {
                    "initial_autosnooze_version": VERSION,
                    "initial_home_assistant_version": _ha_version(),
                },
            }

            capture_id = self._posthog.capture(
                event,
                distinct_id=distinct_id,
                properties=payload,
                disable_geoip=True,
            )
            if throttle is not None and capture_id is not None:
                self._record_emitted_once_per_utc_day(*throttle)
        except Exception:
            _LOGGER.debug("Telemetry track failed", exc_info=True)

    def track_operation_failed(
        self,
        operation: str,
        error: ServiceValidationError,
        *,
        source: str = "service",
        strategy: str = "",
        target_count: int = 0,
    ) -> None:
        properties: dict[str, Any] = {
            "operation": operation,
            "error_code": map_translation_key_to_error_code(getattr(error, "translation_key", None)),
            "target_count": target_count,
        }
        if strategy in SNOOZE_STRATEGIES:
            properties["strategy"] = strategy
        self.track(
            "operation_failed",
            properties,
            source=source,
        )

    def _distinct_id(self) -> str | None:
        if not self._install_id:
            return None
        return hashlib.sha256(self._install_id.encode("utf-8")).hexdigest()

    def _should_emit_once_per_utc_day(self, storage_key: str, cached_attr: str) -> bool:
        today = dt_util.utcnow().strftime("%Y-%m-%d")
        last_day = getattr(self, cached_attr)
        return last_day != today

    def _record_emitted_once_per_utc_day(self, storage_key: str, cached_attr: str) -> None:
        today = dt_util.utcnow().strftime("%Y-%m-%d")
        setattr(self, cached_attr, today)
        coroutine = self._persist_throttle_day(storage_key, today)
        try:
            task = self.hass.async_create_task(coroutine)
        except Exception:
            coroutine.close()
            return
        if isinstance(task, asyncio.Future):
            self._persistence_tasks.add(task)
            task.add_done_callback(self._persistence_tasks.discard)
        else:
            coroutine.close()

    async def _persist_throttle_day(self, storage_key: str, day: str) -> None:
        try:
            async with self._persistence_lock:
                stored = await self.store.async_load()
                if not isinstance(stored, dict):
                    stored = {}
                stored[storage_key] = day
                if self._install_id:
                    stored.setdefault("install_id", self._install_id)
                await self.store.async_save(stored)
        except Exception:
            _LOGGER.debug("Failed to persist telemetry throttle day", exc_info=True)


def track_if_enabled(
    data: Any,
    event: str,
    properties: dict[str, Any] | None,
    *,
    source: str,
    card_type: str | None = None,
    platform: str | None = None,
) -> None:
    client = getattr(data, "telemetry", None)
    if client is not None:
        client.track(event, properties, source=source, card_type=card_type, platform=platform)


def input_method_from_call(call: ServiceCall) -> str:
    context = call.context
    if context is not None and getattr(context, "user_id", None):
        return "card"
    return "service"


def resolve_pause_strategy(
    call_data: Mapping[str, Any],
    *,
    use_scheduled: bool,
    resume_at_dt: datetime | None,
    days: int,
    hours: int,
    minutes: int,
) -> str:
    if use_scheduled:
        return "scheduled_window"
    preset = call_data.get("resume_preset")
    if preset in SNOOZE_STRATEGIES:
        return str(preset)
    if call_data.get("resume_at") is not None or resume_at_dt is not None:
        return "resume_datetime"
    if call_data.get("resume_at_time") is not None:
        return "resume_time"
    if days or hours or minutes:
        return "duration"
    return "duration"


def duration_minutes_for_pause(
    *,
    now: datetime,
    resume_at: datetime,
    days: int,
    hours: int,
    minutes: int,
) -> int:
    if days or hours or minutes:
        return int(days * 1440 + hours * 60 + minutes)
    return max(int((resume_at - now).total_seconds() // 60), 0)


def track_pause_success(
    data: Any,
    *,
    call_data: Mapping[str, Any],
    input_method: str,
    confirm: bool,
    paused_count: int,
    scheduled_count: int,
    notification_trigger: str,
    notification_lead_minutes: int | None,
    now: datetime,
    disable_at: datetime | None,
    resume_at: datetime,
    use_scheduled: bool,
    resume_at_dt: datetime | None,
    days: int,
    hours: int,
    minutes: int,
    source: str = "service",
) -> None:
    if paused_count > 0:
        track_if_enabled(
            data,
            "snooze_created",
            {
                "strategy": resolve_pause_strategy(
                    call_data,
                    use_scheduled=False,
                    resume_at_dt=resume_at_dt,
                    days=days,
                    hours=hours,
                    minutes=minutes,
                ),
                "input_method": input_method,
                "duration_minutes": duration_minutes_for_pause(
                    now=now,
                    resume_at=resume_at,
                    days=days,
                    hours=hours,
                    minutes=minutes,
                ),
                "target_count": paused_count,
                "notification_trigger": notification_trigger,
                "notification_lead_minutes": notification_lead_minutes or 0,
                "confirmation_used": confirm,
            },
            source=source,
        )

    if scheduled_count > 0 and disable_at is not None:
        track_if_enabled(
            data,
            "scheduled_snooze_created",
            {
                "minutes_until_start": max(int((disable_at - now).total_seconds() // 60), 0),
                "planned_duration_minutes": max(int((resume_at - disable_at).total_seconds() // 60), 0),
                "target_count": scheduled_count,
                "resume_local_hour": dt_util.as_local(resume_at).hour,
            },
            source=source,
        )
