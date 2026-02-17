"""Shared logging and error utilities for AutoSnooze integration."""

from __future__ import annotations

import logging
from time import perf_counter

from homeassistant.exceptions import ServiceValidationError

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


def _latency_bucket(latency_ms: float) -> str:
    if latency_ms < 10:
        return "lt_10ms"
    if latency_ms < 100:
        return "lt_100ms"
    if latency_ms < 1000:
        return "lt_1000ms"
    return "gte_1000ms"


def _log_command(command: str, outcome: str, started_at: float, *, operation_id: str = "n/a") -> None:
    latency_ms = (perf_counter() - started_at) * 1000
    _LOGGER.info(
        "autosnooze_command",
        extra={
            "operation_id": operation_id,
            "command": command,
            "outcome": outcome,
            "latency_bucket": _latency_bucket(latency_ms),
        },
    )


def _raise_save_failed() -> None:
    """Raise a translated service error for persistence failures."""
    raise ServiceValidationError(
        "Failed to persist autosnooze state",
        translation_domain=DOMAIN,
        translation_key="save_failed",
    )
