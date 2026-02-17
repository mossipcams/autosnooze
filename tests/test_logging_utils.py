"""Tests for shared logging utility functions."""

from __future__ import annotations


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
    from time import perf_counter

    from custom_components.autosnooze.logging_utils import _log_command

    caplog.set_level(logging.INFO, logger="custom_components.autosnooze.logging_utils")
    started_at = perf_counter()
    _log_command("pause", "success", started_at)

    record = next(r for r in caplog.records if r.message == "autosnooze_command")
    assert record.command == "pause"
    assert record.outcome == "success"
    assert record.operation_id == "n/a"
    assert record.latency_bucket in {"lt_10ms", "lt_100ms", "lt_1000ms", "gte_1000ms"}


def test_raise_save_failed_raises_with_correct_translation_key() -> None:
    import pytest
    from homeassistant.exceptions import ServiceValidationError

    from custom_components.autosnooze.logging_utils import _raise_save_failed

    with pytest.raises(ServiceValidationError) as exc_info:
        _raise_save_failed()
    assert exc_info.value.translation_key == "save_failed"
