"""Tests for shared logging utility functions."""

from __future__ import annotations

import pytest


@pytest.mark.parametrize(
    ("latency_ms", "expected"),
    [
        (0.0, "lt_10ms"),
        (9.999, "lt_10ms"),
        (10.0, "lt_100ms"),
        (99.999, "lt_100ms"),
        (100.0, "lt_1000ms"),
        (999.999, "lt_1000ms"),
        (1000.0, "gte_1000ms"),
    ],
)
def test_latency_bucket_boundaries(latency_ms: float, expected: str) -> None:
    from custom_components.autosnooze.logging_utils import _latency_bucket

    assert _latency_bucket(latency_ms) == expected


def test_latency_bucket_less_than_10ms() -> None:
    from custom_components.autosnooze.logging_utils import _latency_bucket

    assert _latency_bucket(5.0) == "lt_10ms"


def test_latency_bucket_less_than_100ms() -> None:
    from custom_components.autosnooze.logging_utils import _latency_bucket

    assert _latency_bucket(50.0) == "lt_100ms"


def test_latency_bucket_less_than_1000ms() -> None:
    from custom_components.autosnooze.logging_utils import _latency_bucket

    assert _latency_bucket(500.0) == "lt_1000ms"


def test_log_command_emits_structured_fields(caplog) -> None:
    import logging
    from unittest.mock import patch

    from custom_components.autosnooze.logging_utils import _log_command

    caplog.set_level(logging.INFO, logger="custom_components.autosnooze.logging_utils")
    with patch("custom_components.autosnooze.logging_utils.perf_counter", return_value=25.05):
        _log_command("pause", "success", 25.0, operation_id="op-123")

    record = next(r for r in caplog.records if r.message == "autosnooze_command")
    assert record.command == "pause"
    assert record.outcome == "success"
    assert record.operation_id == "op-123"
    assert record.latency_bucket == "lt_100ms"


def test_log_command_default_operation_id_and_bucket_boundary(caplog) -> None:
    import logging
    from unittest.mock import patch

    from custom_components.autosnooze.logging_utils import _log_command

    caplog.set_level(logging.INFO, logger="custom_components.autosnooze.logging_utils")
    with patch("custom_components.autosnooze.logging_utils.perf_counter", return_value=26.0):
        _log_command("resume", "failed", 25.0005)

    record = next(r for r in caplog.records if r.message == "autosnooze_command")
    assert record.operation_id == "n/a"
    assert record.command == "resume"
    assert record.outcome == "failed"
    assert record.latency_bucket == "lt_1000ms"


def test_raise_save_failed_raises_with_correct_translation_key() -> None:
    import pytest
    from homeassistant.exceptions import ServiceValidationError

    from custom_components.autosnooze.logging_utils import _raise_save_failed

    with pytest.raises(ServiceValidationError) as exc_info:
        _raise_save_failed()
    assert str(exc_info.value) == "Failed to persist autosnooze state"
    assert exc_info.value.translation_domain == "autosnooze"
    assert exc_info.value.translation_key == "save_failed"
