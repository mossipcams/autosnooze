"""Tests for TelemetryClient behavior."""

from __future__ import annotations

import hashlib
import asyncio
import logging
from queue import Queue
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.exceptions import ServiceValidationError
from posthog.utils import system_context

from custom_components.autosnooze.infrastructure.telemetry import (
    TelemetryClient,
    _filter_posthog_message,
    _silence_posthog_sdk_logs,
)


def test_posthog_wire_filter_removes_sdk_context() -> None:
    message = {
        "event": "integration_active",
        "properties": {
            "source": "startup",
            "$os": "Linux",
            "$python_version": "3.13.0",
            "$lib": "posthog-python",
            "$is_server": True,
        },
    }

    filtered = _filter_posthog_message(message)

    assert filtered is not None
    assert filtered["properties"] == {"source": "startup"}


def test_posthog_wire_filter_keeps_geoip_disable_flag() -> None:
    message = {
        "event": "snooze_created",
        "properties": {
            "source": "card",
            "strategy": "duration",
            "duration_minutes": 30,
            "target_count": 1,
            "$geoip_disable": True,
            "$os": "Linux",
            "$lib": "posthog-python",
            "$geoip_city_name": "Quincy",
        },
    }

    filtered = _filter_posthog_message(message)

    assert filtered is not None
    assert filtered["properties"]["$geoip_disable"] is True
    assert "$os" not in filtered["properties"]
    assert "$lib" not in filtered["properties"]
    assert "$geoip_city_name" not in filtered["properties"]


@pytest.mark.asyncio
async def test_async_unload_discards_queued_posthog_events_after_opt_out() -> None:
    class Consumer:
        def __init__(self) -> None:
            self.paused = False

        def pause(self) -> None:
            self.paused = True

    class Lane:
        def __init__(self) -> None:
            self.queue: Queue[dict[str, Any]] = Queue()
            self.consumers = [Consumer()]
            self.closed = False

        def close(self) -> None:
            self.closed = True

    class PostHog:
        def __init__(self) -> None:
            self.disabled = False
            self._analytics_lane = Lane()
            self._lanes = [self._analytics_lane]
            self.shutdown_called = False

        def shutdown(self) -> None:
            self.shutdown_called = True

    posthog = PostHog()
    posthog._analytics_lane.queue.put({"event": "queued_before_opt_out"})

    async def executor_job(callback: Any) -> None:
        callback()

    hass = MagicMock()
    hass.async_add_executor_job = executor_job
    client = TelemetryClient(
        hass,
        MagicMock(options={"telemetry_enabled": True}),
        MagicMock(),
        _posthog=posthog,
    )

    await client.async_unload()

    assert posthog._analytics_lane.closed is True
    assert posthog._analytics_lane.consumers[0].paused is True
    assert posthog._analytics_lane.queue.empty()
    assert posthog.shutdown_called is True


@pytest.fixture
def hass() -> MagicMock:
    mock = MagicMock()

    def run_executor_job(callback: Any) -> asyncio.Future[Any]:
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        try:
            future.set_result(callback())
        except Exception as exc:
            future.set_exception(exc)
        return future

    mock.async_add_executor_job = run_executor_job
    mock.async_create_task = MagicMock(side_effect=lambda coro: asyncio.create_task(coro))

    async def block_till_done() -> None:
        await asyncio.sleep(0)

    mock.async_block_till_done = block_till_done
    return mock


@pytest.fixture
def captured_captures():
    captures: list[dict[str, Any]] = []

    def record_capture(
        event: str,
        *,
        distinct_id: str | None = None,
        properties: dict[str, Any] | None = None,
        disable_geoip: bool | None = None,
        **_kwargs: Any,
    ) -> str:
        captures.append(
            {
                "event": event,
                "distinct_id": distinct_id,
                "properties": properties,
                "disable_geoip": disable_geoip,
            }
        )
        return "capture-id"

    mock_posthog = MagicMock()
    mock_posthog.capture = MagicMock(side_effect=record_capture)
    mock_posthog.disabled = False

    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.Posthog",
        return_value=mock_posthog,
    ):
        yield captures, mock_posthog


@pytest.fixture
def telemetry_client(hass, captured_captures):
    _captures, _mock_posthog = captured_captures
    entry = MagicMock()
    entry.options = {"telemetry_enabled": True}
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"install_id": "test-install-uuid"})
    store.async_save = AsyncMock(return_value=None)
    hass.async_create_task = MagicMock()
    client = TelemetryClient(hass, entry, store)
    return client


@pytest.mark.asyncio
async def test_async_setup_silences_posthog_sdk_logger(telemetry_client) -> None:
    telemetry_client.hass.async_add_executor_job = AsyncMock()
    posthog_logger = logging.getLogger("posthog")
    original_level = posthog_logger.level

    try:
        await telemetry_client.async_setup()
        assert posthog_logger.getEffectiveLevel() == logging.CRITICAL
    finally:
        posthog_logger.setLevel(original_level)


def test_silence_posthog_sdk_logs_blocks_error_records() -> None:
    posthog_logger = logging.getLogger("posthog")
    original_level = posthog_logger.level
    handler = logging.Handler()
    handler.setLevel(logging.WARNING)
    handler.emit = MagicMock()
    posthog_logger.addHandler(handler)

    try:
        _silence_posthog_sdk_logs()
        posthog_logger.error("error uploading: boom")
        posthog_logger.warning("warning uploading: boom")
        handler.emit.assert_not_called()
    finally:
        posthog_logger.removeHandler(handler)
        posthog_logger.setLevel(original_level)


@pytest.mark.asyncio
async def test_track_capture_failure_does_not_log_warning_or_error(telemetry_client, captured_captures) -> None:
    _captures, mock_posthog = captured_captures
    telemetry_logger = logging.getLogger("custom_components.autosnooze.infrastructure.telemetry")
    handler = logging.Handler()
    handler.setLevel(logging.WARNING)
    handler.emit = MagicMock()
    telemetry_logger.addHandler(handler)

    try:
        await telemetry_client.async_setup()
        mock_posthog.capture.side_effect = RuntimeError("boom")
        telemetry_client.track("integration_active", {}, source="startup")
        handler.emit.assert_not_called()
    finally:
        telemetry_logger.removeHandler(handler)


@pytest.mark.asyncio
async def test_async_setup_preloads_posthog_system_context_in_executor(telemetry_client) -> None:
    telemetry_client.hass.async_add_executor_job = AsyncMock()

    await telemetry_client.async_setup()

    telemetry_client.hass.async_add_executor_job.assert_awaited_once_with(system_context)


@pytest.mark.asyncio
async def test_track_dispatches_posthog_capture_to_executor(telemetry_client, captured_captures) -> None:
    _captures, mock_posthog = captured_captures
    await telemetry_client.async_setup()
    capture_future = asyncio.get_running_loop().create_future()
    telemetry_client.hass.async_add_executor_job = MagicMock(return_value=capture_future)

    telemetry_client.track("wake_clicked", {"scope": "one"}, source="service")

    mock_posthog.capture.assert_not_called()
    capture = telemetry_client.hass.async_add_executor_job.call_args.args[0]
    capture_future.set_result(capture())
    await asyncio.sleep(0)
    mock_posthog.capture.assert_called_once()


@pytest.mark.asyncio
async def test_disabled_client_is_noop(telemetry_client, captured_captures) -> None:
    captures, mock_posthog = captured_captures
    telemetry_client.entry.options = {"telemetry_enabled": False}
    telemetry_client.hass.async_add_executor_job = AsyncMock()
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    telemetry_client.store.async_load.assert_not_awaited()
    telemetry_client.hass.async_add_executor_job.assert_not_awaited()
    assert telemetry_client._posthog is None
    assert captures == []
    mock_posthog.capture.assert_not_called()


@pytest.mark.asyncio
async def test_client_hashes_install_id_for_distinct_id(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    assert len(captures) == 1
    assert captures[0]["distinct_id"] == hashlib.sha256(b"test-install-uuid").hexdigest()
    assert "clientUser" not in captures[0]
    assert "appID" not in captures[0]
    assert "payload" not in captures[0]


@pytest.mark.asyncio
async def test_install_id_never_in_properties(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track(
        "snooze_created",
        {
            "strategy": "duration",
            "input_method": "card",
            "duration_minutes": 30,
            "target_count": 1,
            "notification_trigger": "none",
            "notification_lead_minutes": 0,
            "confirmation_used": False,
        },
        source="card",
    )
    properties = captures[0]["properties"]
    assert properties is not None
    assert "test-install-uuid" not in str(properties)
    assert "install_id" not in properties


@pytest.mark.asyncio
async def test_capture_called_with_disable_geoip(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    assert captures[0]["disable_geoip"] is True


@pytest.mark.asyncio
async def test_every_event_includes_set_person_properties(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    telemetry_client.track("wake_clicked", {"scope": "one"}, source="card")
    for capture in captures:
        properties = capture["properties"]
        assert properties is not None
        assert "$set" in properties
        assert "$set_once" in properties
        assert "autosnooze_version" not in properties
        assert "home_assistant_version" not in properties
        assert "event_schema_version" not in properties
        assert properties["$set"]["event_schema_version"] == "4"
        assert properties["$set_once"]["initial_autosnooze_version"] == properties["$set"]["autosnooze_version"]
        assert properties["$set_once"]["initial_home_assistant_version"] == properties["$set"]["home_assistant_version"]


@pytest.mark.asyncio
async def test_card_supplied_set_rejects_event(telemetry_client, captured_captures) -> None:
    captures, mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track(
        "wake_clicked",
        {"scope": "one", "$set": {"autosnooze_version": "evil"}, "$set_once": {"initial_autosnooze_version": "evil"}},
        source="card",
    )
    assert captures == []
    mock_posthog.capture.assert_not_called()


@pytest.mark.asyncio
async def test_integration_active_throttled_once_per_day(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    telemetry_client.track("integration_active", {}, source="startup")
    assert len(captures) == 1


@pytest.mark.asyncio
async def test_card_viewed_throttled_once_per_day(hass, telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("card_viewed", {"card_type": "full"}, source="card", card_type="full")
    telemetry_client.track("card_viewed", {"card_type": "full"}, source="card", card_type="full")
    assert len(captures) == 1


def test_track_does_not_raise_when_sanitize_fails(telemetry_client) -> None:
    telemetry_client.track("not_real", {"entity_id": "automation.secret"}, source="card")


def test_track_does_not_raise_when_sanitize_raises(telemetry_client) -> None:
    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.sanitize_event_properties",
        side_effect=RuntimeError("boom"),
    ):
        telemetry_client.track("integration_active", {}, source="startup")


@pytest.mark.asyncio
async def test_invalid_daily_event_does_not_consume_throttle(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()

    telemetry_client.track("card_viewed", {}, source="card", card_type="invalid")
    telemetry_client.track("card_viewed", {"card_type": "full"}, source="card", card_type="full")

    assert len(captures) == 1
    assert captures[0]["event"] == "card_viewed"


@pytest.mark.asyncio
async def test_posthog_failure_does_not_consume_throttle(telemetry_client, captured_captures) -> None:
    captures, mock_posthog = captured_captures
    await telemetry_client.async_setup()
    mock_posthog.capture.side_effect = [RuntimeError("offline"), None]

    telemetry_client.track("integration_active", {}, source="startup")
    await telemetry_client.hass.async_block_till_done()
    telemetry_client.track("integration_active", {}, source="startup")
    await telemetry_client.hass.async_block_till_done()

    assert mock_posthog.capture.call_count == 2
    assert len(captures) == 0


@pytest.mark.asyncio
async def test_posthog_dropped_capture_does_not_consume_throttle(telemetry_client, captured_captures) -> None:
    _captures, mock_posthog = captured_captures
    await telemetry_client.async_setup()
    mock_posthog.capture.side_effect = [None, "capture-id"]

    telemetry_client.track("integration_active", {}, source="startup")
    await telemetry_client.hass.async_block_till_done()
    telemetry_client.track("integration_active", {}, source="startup")
    await telemetry_client.hass.async_block_till_done()
    telemetry_client.track("integration_active", {}, source="startup")
    await telemetry_client.hass.async_block_till_done()

    assert mock_posthog.capture.call_count == 2


@pytest.mark.asyncio
async def test_throttle_persistence_normalizes_corrupt_storage(telemetry_client) -> None:
    telemetry_client._install_id = "test-install-id"
    telemetry_client.store.async_load = AsyncMock(return_value="corrupt")
    telemetry_client.store.async_save = AsyncMock()

    await telemetry_client._persist_throttle_day("last_card_viewed_day", "2026-08-13")

    telemetry_client.store.async_save.assert_awaited_once_with(
        {
            "last_card_viewed_day": "2026-08-13",
            "install_id": telemetry_client._install_id,
        }
    )


@pytest.mark.asyncio
async def test_throttle_persistence_swallows_load_failure(telemetry_client) -> None:
    telemetry_client.store.async_load = AsyncMock(side_effect=OSError("offline"))

    await telemetry_client._persist_throttle_day("last_card_viewed_day", "2026-08-13")


@pytest.mark.asyncio
async def test_concurrent_throttle_persistence_preserves_both_keys(telemetry_client) -> None:
    stored: dict[str, Any] = {"install_id": telemetry_client._install_id}

    async def load() -> dict[str, Any]:
        return dict(stored)

    async def save(value: dict[str, Any]) -> None:
        stored.clear()
        stored.update(value)

    telemetry_client.store.async_load = load
    telemetry_client.store.async_save = save

    await asyncio.gather(
        telemetry_client._persist_throttle_day("last_card_viewed_day", "2026-08-13"),
        telemetry_client._persist_throttle_day("last_integration_active_day", "2026-08-13"),
    )

    assert stored == {
        "install_id": telemetry_client._install_id,
        "last_card_viewed_day": "2026-08-13",
        "last_integration_active_day": "2026-08-13",
    }


@pytest.mark.asyncio
async def test_capture_does_not_raise_on_posthog_failure(telemetry_client, captured_captures) -> None:
    _captures, mock_posthog = captured_captures
    await telemetry_client.async_setup()
    mock_posthog.capture.side_effect = RuntimeError("boom")
    telemetry_client.track("integration_active", {}, source="startup")


@pytest.mark.asyncio
async def test_async_setup_disables_on_storage_failure(telemetry_client, captured_captures) -> None:
    captures, mock_posthog = captured_captures
    telemetry_client.store.async_load = AsyncMock(side_effect=OSError("disk full"))
    await telemetry_client.async_setup()
    assert telemetry_client._disabled is True
    telemetry_client.track("integration_active", {}, source="startup")
    assert captures == []
    mock_posthog.capture.assert_not_called()


@pytest.mark.asyncio
async def test_async_unload_disables_client_and_blocks_track(telemetry_client, captured_captures) -> None:
    captures, mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    assert len(captures) == 1

    telemetry_client.hass.async_add_executor_job = AsyncMock()
    await telemetry_client.async_unload()
    assert mock_posthog.disabled is True
    telemetry_client.hass.async_add_executor_job.assert_called_with(mock_posthog.shutdown)
    assert telemetry_client._posthog is None

    telemetry_client.track("integration_active", {}, source="startup")
    assert len(captures) == 1


def _build_captured_posthog() -> tuple[list[dict[str, Any]], MagicMock]:
    captures: list[dict[str, Any]] = []

    def record_capture(
        event: str,
        *,
        distinct_id: str | None = None,
        properties: dict[str, Any] | None = None,
        disable_geoip: bool | None = None,
        **_kwargs: Any,
    ) -> str:
        captures.append(
            {
                "event": event,
                "distinct_id": distinct_id,
                "properties": properties,
                "disable_geoip": disable_geoip,
            }
        )
        return "capture-id"

    mock_posthog = MagicMock()
    mock_posthog.capture = MagicMock(side_effect=record_capture)
    mock_posthog.disabled = False
    return captures, mock_posthog


def _build_telemetry_hass() -> MagicMock:
    hass = MagicMock()
    hass.async_create_task = MagicMock()
    hass.async_add_executor_job = AsyncMock(return_value=None)
    return hass


@pytest.mark.asyncio
async def test_daily_throttle_held_while_capture_is_pending() -> None:
    """Second daily event must be dropped while the first capture is still in-flight."""
    captures, mock_posthog = _build_captured_posthog()
    hass = _build_telemetry_hass()
    entry = MagicMock()
    entry.options = {"telemetry_enabled": True}
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"install_id": "test-install-uuid"})
    store.async_save = AsyncMock(return_value=None)
    capture_started = asyncio.Event()
    release_capture = asyncio.Event()

    def schedule_capture(callback: Any) -> asyncio.Task[Any]:
        async def run() -> Any:
            capture_started.set()
            await release_capture.wait()
            return callback()

        return asyncio.create_task(run())

    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.Posthog",
        return_value=mock_posthog,
    ):
        telemetry_client = TelemetryClient(hass, entry, store)
        await telemetry_client.async_setup()
        telemetry_client.hass.async_add_executor_job = schedule_capture

        telemetry_client.track("integration_active", {}, source="startup")
        await asyncio.wait_for(capture_started.wait(), timeout=1)
        telemetry_client.track("integration_active", {}, source="startup")
        telemetry_client.track("card_viewed", {"card_type": "full"}, source="card", card_type="full")

        assert mock_posthog.capture.call_count == 0
        assert ("last_integration_active_day", "_last_integration_active_day") in telemetry_client._pending_throttles
        assert ("last_card_viewed_day", "_last_card_viewed_day") in telemetry_client._pending_throttles

        release_capture.set()
        pending = list(telemetry_client._pending_tasks)
        if pending:
            await asyncio.gather(*pending, return_exceptions=True)
        await asyncio.sleep(0)

    assert mock_posthog.capture.call_count == 2
    assert {capture["event"] for capture in captures} == {"integration_active", "card_viewed"}


@pytest.mark.asyncio
async def test_async_unload_waits_for_pending_executor_capture() -> None:
    """Unload must await in-flight executor captures before shutdown."""
    _captures, mock_posthog = _build_captured_posthog()
    hass = _build_telemetry_hass()
    entry = MagicMock()
    entry.options = {"telemetry_enabled": True}
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"install_id": "test-install-uuid"})
    store.async_save = AsyncMock(return_value=None)
    capture_started = asyncio.Event()
    unload_finished = asyncio.Event()

    def schedule_capture(callback: Any) -> asyncio.Task[Any]:
        async def run() -> Any:
            capture_started.set()
            await asyncio.sleep(0.05)
            return callback()

        return asyncio.create_task(run())

    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.Posthog",
        return_value=mock_posthog,
    ):
        telemetry_client = TelemetryClient(hass, entry, store)
        await telemetry_client.async_setup()
        telemetry_client.hass.async_add_executor_job = schedule_capture
        telemetry_client.track("wake_clicked", {"scope": "one"}, source="service")
        await asyncio.wait_for(capture_started.wait(), timeout=1)

        unload_task = asyncio.create_task(telemetry_client.async_unload())

        async def mark_unload_done() -> None:
            await unload_task
            unload_finished.set()

        waiter = asyncio.create_task(mark_unload_done())
        await asyncio.sleep(0.01)
        assert unload_finished.is_set() is False

        await asyncio.wait_for(unload_finished.wait(), timeout=1)
        await waiter

    mock_posthog.capture.assert_called_once()


@pytest.mark.asyncio
async def test_async_unload_returns_on_hung_executor_capture_after_timeout() -> None:
    """Unload abandons a stuck in-flight capture after a bounded timeout."""
    _captures, mock_posthog = _build_captured_posthog()
    hass = _build_telemetry_hass()
    entry = MagicMock()
    entry.options = {"telemetry_enabled": True}
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"install_id": "test-install-uuid"})
    store.async_save = AsyncMock(return_value=None)
    capture_started = asyncio.Event()
    release_capture = asyncio.Event()

    def schedule_capture(callback: Any) -> asyncio.Task[Any]:
        async def run() -> Any:
            capture_started.set()
            await release_capture.wait()
            return callback()

        return asyncio.create_task(run())

    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.Posthog",
        return_value=mock_posthog,
    ):
        telemetry_client = TelemetryClient(hass, entry, store, unload_capture_timeout=0.05)
        await telemetry_client.async_setup()
        telemetry_client.hass.async_add_executor_job = schedule_capture
        telemetry_client.track("wake_clicked", {"scope": "one"}, source="service")
        await asyncio.wait_for(capture_started.wait(), timeout=1)

        telemetry_client.hass.async_add_executor_job = AsyncMock(return_value=None)
        await telemetry_client.async_unload()

    assert mock_posthog.disabled is True
    assert telemetry_client._posthog is None
    mock_posthog.capture.assert_not_called()
    release_capture.set()


@pytest.mark.asyncio
async def test_track_after_unload_does_not_dispatch_executor_job() -> None:
    """Post-unload track calls must not enqueue new executor work."""
    captures, mock_posthog = _build_captured_posthog()
    hass = _build_telemetry_hass()
    entry = MagicMock()
    entry.options = {"telemetry_enabled": True}
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"install_id": "test-install-uuid"})
    store.async_save = AsyncMock(return_value=None)

    def schedule_capture(callback: Any) -> asyncio.Task[Any]:
        async def run() -> Any:
            return callback()

        return asyncio.create_task(run())

    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.Posthog",
        return_value=mock_posthog,
    ):
        telemetry_client = TelemetryClient(hass, entry, store)
        await telemetry_client.async_setup()
        telemetry_client.hass.async_add_executor_job = schedule_capture
        telemetry_client.track("integration_active", {}, source="startup")
        await asyncio.gather(*telemetry_client._pending_tasks, return_exceptions=True)

        executor = AsyncMock()
        telemetry_client.hass.async_add_executor_job = executor
        await telemetry_client.async_unload()
        executor.reset_mock()

        telemetry_client.track("integration_active", {}, source="startup")
        telemetry_client.track("card_viewed", {"card_type": "full"}, source="card", card_type="full")

    executor.assert_not_awaited()
    assert len(captures) == 1
    mock_posthog.capture.assert_called_once()


@pytest.mark.asyncio
async def test_capture_exception_does_not_break_track_caller() -> None:
    """Executor capture failures must stay contained inside telemetry."""
    _captures, mock_posthog = _build_captured_posthog()
    hass = _build_telemetry_hass()
    entry = MagicMock()
    entry.options = {"telemetry_enabled": True}
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"install_id": "test-install-uuid"})
    store.async_save = AsyncMock(return_value=None)
    mock_posthog.capture.side_effect = RuntimeError("posthog offline")

    def schedule_capture(callback: Any) -> asyncio.Task[Any]:
        async def run() -> Any:
            return callback()

        return asyncio.create_task(run())

    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.Posthog",
        return_value=mock_posthog,
    ):
        telemetry_client = TelemetryClient(hass, entry, store)
        await telemetry_client.async_setup()
        telemetry_client.hass.async_add_executor_job = schedule_capture

        telemetry_client.track("wake_clicked", {"scope": "all"}, source="card")
        await asyncio.gather(*telemetry_client._pending_tasks, return_exceptions=True)

        telemetry_client.track("wake_clicked", {"scope": "one"}, source="card")
        await asyncio.gather(*telemetry_client._pending_tasks, return_exceptions=True)

    assert mock_posthog.capture.call_count == 2


@pytest.mark.asyncio
async def test_track_operation_failed_omits_invalid_strategy(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    error = ServiceValidationError("nope")
    error.translation_key = "invalid_duration"

    telemetry_client.track_operation_failed("pause", error, strategy="", target_count=2)
    properties = captures[0]["properties"]
    assert properties is not None
    assert properties["operation"] == "pause"
    assert properties["error_code"] == "invalid_duration"
    assert properties["target_count"] == 2
    assert "strategy" not in properties

    telemetry_client.track_operation_failed("pause", error, strategy="duration", target_count=1)
    assert captures[1]["properties"]["strategy"] == "duration"
