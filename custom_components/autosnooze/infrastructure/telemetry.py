"""TelemetryDeck product telemetry for AutoSnooze."""

from __future__ import annotations

import hashlib
import logging
import uuid
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from aiohttp import ClientTimeout
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from ..const import (
    DOMAIN,
    VERSION,
)

_LOGGER = logging.getLogger(__name__)

EVENT_SCHEMA_VERSION = "1"
TELEMETRYDECK_APP_ID = "C7769C33-556B-40B1-9C4D-0982BE33DEDE"
TELEMETRYDECK_NAMESPACE = "com.mossyhome"
TELEMETRY_INGEST_URL = f"https://nom.telemetrydeck.com/v2/namespace/{TELEMETRYDECK_NAMESPACE}/"
TELEMETRY_STORAGE_KEY = f"{DOMAIN}.telemetry"
OPTION_TELEMETRY_ENABLED = "telemetry_enabled"
TELEMETRY_STORAGE_VERSION = 1
FLUSH_TIMEOUT_SECONDS = 3

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
ERROR_CODE_ALLOWLIST = frozenset(
    {
        "invalid_duration",
        "resume_time_past",
        "disable_after_resume",
        "confirmation_required",
        "save_failed",
        "notification_lead_too_long",
        "automation_state_failed",
        "unknown",
    }
)
TRANSLATION_KEY_TO_ERROR_CODE: dict[str, str] = {
    "confirm_required": "confirmation_required",
}

EVENT_SCHEMAS: dict[str, frozenset[str]] = {
    "integration_active": frozenset(),
    "card_viewed": frozenset({"card_type"}),
    "selection_feature_used": frozenset({"method"}),
    "duration_option_selected": frozenset({"method"}),
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
    "snooze_adjusted": frozenset({"delta_minutes", "direction"}),
    "snooze_ended": frozenset({"reason"}),
    "scheduled_snooze_cancelled": frozenset({"target_count", "minutes_before_start"}),
    "notification_used": frozenset({"trigger"}),
    "notification_cleared": frozenset({"target_count"}),
    "operation_failed": frozenset({"operation", "error_code", "strategy", "target_count"}),
    "confirmation_result": frozenset({"result"}),
}


def map_translation_key_to_error_code(translation_key: str | None) -> str:
    if not translation_key:
        return "unknown"
    mapped = TRANSLATION_KEY_TO_ERROR_CODE.get(translation_key, translation_key)
    if mapped in ERROR_CODE_ALLOWLIST:
        return mapped
    return "unknown"


def sanitize_event_properties(
    event: str,
    properties: dict[str, Any] | None,
    *,
    source: str,
    card_type: str | None = None,
) -> dict[str, str] | None:
    if event not in EVENT_SCHEMAS:
        return None
    if source not in SOURCES:
        return None

    allowed = EVENT_SCHEMAS[event]
    cleaned: dict[str, str] = {}
    for key, value in (properties or {}).items():
        if key not in allowed:
            continue
        cleaned[key] = _stringify(value)

    if card_type is not None:
        if card_type not in CARD_TYPES:
            return None
        cleaned["card_type"] = _stringify(card_type)

    if event == "card_viewed" and cleaned.get("card_type") not in CARD_TYPES:
        return None
    if event == "selection_feature_used" and cleaned.get("method") != "all":
        return None
    if event == "duration_option_selected" and cleaned.get("method") != "preset":
        return None
    if event == "snooze_created" and cleaned.get("strategy") not in SNOOZE_STRATEGIES:
        return None
    if event == "snooze_ended" and cleaned.get("reason") != "expired":
        return None
    if event == "notification_used" and cleaned.get("trigger") != "start":
        return None
    if event == "confirmation_result" and cleaned.get("result") != "confirmed":
        return None
    if event == "operation_failed" and cleaned.get("error_code") not in ERROR_CODE_ALLOWLIST:
        return None

    payload = {
        "autosnooze_version": VERSION,
        "home_assistant_version": _ha_version(),
        "event_schema_version": EVENT_SCHEMA_VERSION,
        "source": source,
        **cleaned,
    }
    return payload


def _stringify(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def _ha_version() -> str:
    try:
        from homeassistant.const import __version__ as ha_version

        return ha_version
    except Exception:
        return "unknown"


@dataclass
class TelemetryClient:
    """Fire-and-forget TelemetryDeck client."""

    hass: HomeAssistant
    entry: ConfigEntry
    store: Store
    _install_id: str | None = None
    _queue: list[dict[str, Any]] = field(default_factory=list)
    _last_card_viewed_day: str | None = None
    _disabled: bool = False
    _flush_scheduled: bool = False

    def is_enabled(self) -> bool:
        if self._disabled:
            return False
        return bool(self.entry.options.get(OPTION_TELEMETRY_ENABLED, True))

    async def async_setup(self) -> None:
        stored = await self.store.async_load() or {}
        install_id = stored.get("install_id")
        if not isinstance(install_id, str) or not install_id:
            install_id = str(uuid.uuid4())
            stored["install_id"] = install_id
            await self.store.async_save(stored)
        self._install_id = install_id
        last_day = stored.get("last_card_viewed_day")
        self._last_card_viewed_day = last_day if isinstance(last_day, str) else None

    def async_unload(self) -> None:
        self._disabled = True
        self._queue.clear()

    def track(
        self,
        event: str,
        properties: dict[str, Any] | None,
        *,
        source: str,
        card_type: str | None = None,
    ) -> None:
        try:
            if not self.is_enabled():
                return
            if event == "card_viewed" and not self._should_emit_card_viewed():
                return

            payload = sanitize_event_properties(event, properties, source=source, card_type=card_type)
            if payload is None:
                return

            client_user = self._client_user_hash()
            if client_user is None:
                return

            self._queue.append(
                {
                    "appID": TELEMETRYDECK_APP_ID,
                    "clientUser": client_user,
                    "type": event,
                    "payload": payload,
                }
            )
            self.hass.async_create_task(self.async_flush())
        except Exception:
            _LOGGER.debug("Telemetry track failed", exc_info=True)

    def sanitize(
        self, event: str, properties: dict[str, Any] | None, *, source: str, card_type: str | None = None
    ) -> dict[str, str] | None:
        return sanitize_event_properties(event, properties, source=source, card_type=card_type)

    async def async_flush(self) -> None:
        if self._flush_scheduled:
            return
        self._flush_scheduled = True
        try:
            try:
                while self.is_enabled() and self._queue:
                    batch = self._queue[:]
                    self._queue.clear()
                    await self._post_batch(batch)
            except Exception:
                _LOGGER.debug("Telemetry flush failed", exc_info=True)
        finally:
            self._flush_scheduled = False

    def track_operation_failed(
        self,
        operation: str,
        error: ServiceValidationError,
        *,
        source: str = "service",
        strategy: str = "",
        target_count: int = 0,
    ) -> None:
        self.track(
            "operation_failed",
            {
                "operation": operation,
                "error_code": map_translation_key_to_error_code(getattr(error, "translation_key", None)),
                "strategy": strategy,
                "target_count": target_count,
            },
            source=source,
        )

    def _client_user_hash(self) -> str | None:
        if not self._install_id:
            return None
        return hashlib.sha256(self._install_id.encode("utf-8")).hexdigest()

    def _should_emit_card_viewed(self) -> bool:
        today = dt_util.utcnow().strftime("%Y-%m-%d")
        if self._last_card_viewed_day == today:
            return False
        self._last_card_viewed_day = today
        self.hass.async_create_task(self._persist_card_viewed_day(today))
        return True

    async def _persist_card_viewed_day(self, day: str) -> None:
        stored = await self.store.async_load() or {}
        stored["last_card_viewed_day"] = day
        if self._install_id:
            stored.setdefault("install_id", self._install_id)
        try:
            await self.store.async_save(stored)
        except Exception:
            _LOGGER.debug("Failed to persist card_viewed throttle day", exc_info=True)

    async def _post_batch(self, batch: list[dict[str, Any]]) -> None:
        session = async_get_clientsession(self.hass)
        try:
            async with session.post(
                TELEMETRY_INGEST_URL,
                json=batch,
                timeout=ClientTimeout(total=FLUSH_TIMEOUT_SECONDS),
            ) as response:
                if response.status >= 400:
                    _LOGGER.debug("TelemetryDeck ingest returned %s", response.status)
        except Exception:
            _LOGGER.debug("TelemetryDeck ingest failed", exc_info=True)


def track_if_enabled(
    data: Any,
    event: str,
    properties: dict[str, Any] | None,
    *,
    source: str,
    card_type: str | None = None,
) -> None:
    client = getattr(data, "telemetry", None)
    if client is not None:
        client.track(event, properties, source=source, card_type=card_type)


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


def track_validation_failure(
    data: Any,
    operation: str,
    error: ServiceValidationError,
    *,
    source: str = "service",
    strategy: str = "",
    target_count: int = 0,
) -> None:
    client = getattr(data, "telemetry", None)
    if client is None:
        return
    client.track_operation_failed(
        operation,
        error,
        source=source,
        strategy=strategy,
        target_count=target_count,
    )
