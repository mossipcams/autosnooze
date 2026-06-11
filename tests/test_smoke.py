"""Release-gate smoke tests for the AutoSnooze Home Assistant integration."""

from __future__ import annotations

import importlib
from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.autosnooze.const import DOMAIN

SERVICES = {
    "adjust",
    "cancel",
    "cancel_all",
    "cancel_scheduled",
    "clear_notification",
    "pause",
    "pause_by_area",
    "pause_by_label",
}


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for smoke tests."""
    yield


@pytest.fixture
async def smoke_hass(hass: HomeAssistant):
    """Provide HA with only the integration's external dependencies faked."""
    resources = MagicMock()
    resources.async_items.return_value = []
    resources.async_create_item = AsyncMock()
    hass.data["lovelace"] = MagicMock(resources=resources)
    hass.http = MagicMock()
    hass.http.async_register_static_paths = AsyncMock()
    hass.config.components.update({"automation", "frontend", "http", "lovelace"})

    async def set_automation_state(call, state: str) -> None:
        entity_ids = call.data[ATTR_ENTITY_ID]
        for entity_id in entity_ids if isinstance(entity_ids, list) else [entity_ids]:
            current = hass.states.get(entity_id)
            hass.states.async_set(entity_id, state, current.attributes if current else {})

    async def turn_off_handler(call) -> None:
        await set_automation_state(call, "off")

    async def turn_on_handler(call) -> None:
        await set_automation_state(call, "on")

    turn_off = AsyncMock(side_effect=turn_off_handler)
    turn_on = AsyncMock(side_effect=turn_on_handler)
    hass.services.async_register("automation", "turn_off", turn_off)
    hass.services.async_register("automation", "turn_on", turn_on)
    yield hass, turn_off, turn_on


async def setup_entry(hass: HomeAssistant) -> MockConfigEntry:
    """Set up the minimal supported AutoSnooze config entry."""
    entry = MockConfigEntry(domain=DOMAIN, title="AutoSnooze", data={}, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def mock_storage(entry: MockConfigEntry) -> AsyncMock:
    """Replace storage writes with an observable HA storage boundary."""
    save = AsyncMock()
    entry.runtime_data.store.async_save = save
    return save


def domain_services(hass: HomeAssistant) -> set[str]:
    """Return the exact registered AutoSnooze service surface."""
    return set(hass.services.async_services().get(DOMAIN, {}))


def fake_resume_scheduler(unsub: MagicMock):
    """Return a scheduler fake that records the cancellation callback."""

    def schedule(_hass, data, entity_id, _resume_at):
        data.timers[entity_id] = unsub

    return schedule


def fake_disable_scheduler(unsub: MagicMock):
    """Return a scheduler fake that records the scheduled-disable cancellation callback."""

    def schedule(_hass, data, entity_id, _scheduled):
        data.scheduled_timers[entity_id] = unsub

    return schedule


async def test_import_and_minimal_setup_registers_core_surface(smoke_hass) -> None:
    """The integration imports, loads, and exposes its release-critical surface."""
    integration = importlib.import_module("custom_components.autosnooze")
    assert callable(integration.async_setup_entry)

    hass, _, _ = smoke_hass
    entry = await setup_entry(hass)

    assert entry.state is ConfigEntryState.LOADED
    assert entry.runtime_data.hass is hass
    sensor = hass.states.get("sensor.autosnooze_snoozed_automations")
    assert sensor is not None
    assert sensor.state == "0"
    assert sensor.attributes["paused"] == {}
    assert sensor.attributes["scheduled"] == {}
    assert domain_services(hass) == SERVICES


async def test_pause_service_changes_state_and_schedules_resume(smoke_hass) -> None:
    """A basic snooze disables an automation, records it, and schedules its resume."""
    hass, turn_off, turn_on = smoke_hass
    entry = await setup_entry(hass)
    save = mock_storage(entry)
    hass.states.async_set("automation.kitchen", "on", {"friendly_name": "Kitchen"})

    timer_unsub = MagicMock()
    with patch(
        "custom_components.autosnooze.services.schedule_resume", side_effect=fake_resume_scheduler(timer_unsub)
    ) as schedule:
        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: ["automation.kitchen"], "minutes": 5},
            blocking=True,
        )
        await hass.async_block_till_done()

    paused = entry.runtime_data.paused["automation.kitchen"]
    assert paused.entity_id == "automation.kitchen"
    assert paused.friendly_name == "Kitchen"
    assert (paused.days, paused.hours, paused.minutes) == (0, 0, 5)
    assert timedelta(minutes=4, seconds=50) < paused.resume_at - paused.paused_at <= timedelta(minutes=5)
    assert entry.runtime_data.timers == {"automation.kitchen": timer_unsub}
    schedule.assert_called_once_with(hass, entry.runtime_data, "automation.kitchen", paused.resume_at)
    turn_off.assert_awaited_once()
    assert turn_off.await_args.args[0].data == {ATTR_ENTITY_ID: "automation.kitchen"}
    turn_on.assert_not_awaited()
    assert hass.states.get("automation.kitchen").state == "off"
    sensor_state = hass.states.get("sensor.autosnooze_snoozed_automations")
    assert sensor_state.state == "1"
    assert set(sensor_state.attributes["paused"]) == {"automation.kitchen"}
    assert sensor_state.attributes["scheduled"] == {}
    save.assert_awaited_once()
    saved = save.await_args.args[0]
    assert set(saved) == {"paused", "scheduled"}
    assert saved["scheduled"] == {}
    assert set(saved["paused"]) == {"automation.kitchen"}
    saved_pause = saved["paused"]["automation.kitchen"]
    assert saved_pause["friendly_name"] == "Kitchen"
    assert saved_pause["resume_at"] == paused.resume_at.isoformat()
    assert saved_pause["paused_at"] == paused.paused_at.isoformat()
    assert (saved_pause["days"], saved_pause["hours"], saved_pause["minutes"]) == (0, 0, 5)


async def test_invalid_pause_fails_without_mutating_runtime(smoke_hass) -> None:
    """Invalid service input fails clearly and leaves no partial work behind."""
    hass, turn_off, turn_on = smoke_hass
    entry = await setup_entry(hass)
    save = mock_storage(entry)
    hass.states.async_set("automation.kitchen", "on", {"friendly_name": "Kitchen"})

    with pytest.raises(ServiceValidationError) as exc_info:
        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: ["automation.kitchen"], "minutes": 0},
            blocking=True,
        )

    assert entry.state is ConfigEntryState.LOADED
    assert exc_info.value.translation_key == "invalid_duration"
    assert entry.runtime_data.paused == {}
    assert entry.runtime_data.timers == {}
    assert entry.runtime_data.scheduled == {}
    assert entry.runtime_data.scheduled_timers == {}
    turn_off.assert_not_awaited()
    turn_on.assert_not_awaited()
    assert hass.states.get("automation.kitchen").state == "on"
    save.assert_not_awaited()
    sensor = hass.states.get("sensor.autosnooze_snoozed_automations")
    assert sensor.state == "0"
    assert sensor.attributes["paused"] == {}
    assert sensor.attributes["scheduled"] == {}


async def test_cancel_resumes_automation_and_cleans_runtime(smoke_hass) -> None:
    """A user can end a snooze and leave no timer or paused state behind."""
    hass, turn_off, turn_on = smoke_hass
    entry = await setup_entry(hass)
    save = mock_storage(entry)
    hass.states.async_set("automation.kitchen", "on", {"friendly_name": "Kitchen"})
    timer_unsub = MagicMock()

    with patch("custom_components.autosnooze.services.schedule_resume", side_effect=fake_resume_scheduler(timer_unsub)):
        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: ["automation.kitchen"], "minutes": 5},
            blocking=True,
        )

    save.reset_mock()
    await hass.services.async_call(
        DOMAIN,
        "cancel",
        {ATTR_ENTITY_ID: ["automation.kitchen"]},
        blocking=True,
    )
    await hass.async_block_till_done()

    assert entry.runtime_data.paused == {}
    assert entry.runtime_data.timers == {}
    timer_unsub.assert_called_once()
    turn_off.assert_awaited_once()
    turn_on.assert_awaited_once()
    assert turn_on.await_args.args[0].data == {ATTR_ENTITY_ID: "automation.kitchen"}
    assert hass.states.get("automation.kitchen").state == "on"
    sensor = hass.states.get("sensor.autosnooze_snoozed_automations")
    assert sensor.state == "0"
    assert sensor.attributes["paused"] == {}
    assert sensor.attributes["scheduled"] == {}
    save.assert_awaited_once_with({"paused": {}, "scheduled": {}})


async def test_future_snooze_can_be_scheduled_and_canceled(smoke_hass) -> None:
    """A future snooze registers one schedule and can be removed cleanly."""
    hass, turn_off, turn_on = smoke_hass
    entry = await setup_entry(hass)
    save = mock_storage(entry)
    hass.states.async_set("automation.kitchen", "on", {"friendly_name": "Kitchen"})
    timer_unsub = MagicMock()
    disable_at = dt_util.utcnow() + timedelta(minutes=10)
    resume_at = disable_at + timedelta(minutes=20)

    with patch(
        "custom_components.autosnooze.services.schedule_disable", side_effect=fake_disable_scheduler(timer_unsub)
    ) as schedule:
        await hass.services.async_call(
            DOMAIN,
            "pause",
            {
                ATTR_ENTITY_ID: ["automation.kitchen"],
                "disable_at": disable_at.isoformat(),
                "resume_at": resume_at.isoformat(),
            },
            blocking=True,
        )

    scheduled = entry.runtime_data.scheduled["automation.kitchen"]
    assert scheduled.disable_at == disable_at
    assert scheduled.resume_at == resume_at
    assert entry.runtime_data.paused == {}
    assert entry.runtime_data.scheduled_timers == {"automation.kitchen": timer_unsub}
    schedule.assert_called_once_with(hass, entry.runtime_data, "automation.kitchen", scheduled)
    turn_off.assert_not_awaited()
    turn_on.assert_not_awaited()
    assert hass.states.get("automation.kitchen").state == "on"
    sensor = hass.states.get("sensor.autosnooze_snoozed_automations")
    assert sensor.state == "0"
    assert sensor.attributes["paused"] == {}
    assert set(sensor.attributes["scheduled"]) == {"automation.kitchen"}
    save.assert_awaited_once()
    saved = save.await_args.args[0]
    assert saved["paused"] == {}
    assert set(saved["scheduled"]) == {"automation.kitchen"}
    saved_schedule = saved["scheduled"]["automation.kitchen"]
    assert saved_schedule["friendly_name"] == "Kitchen"
    assert saved_schedule["disable_at"] == disable_at.isoformat()
    assert saved_schedule["resume_at"] == resume_at.isoformat()

    save.reset_mock()
    await hass.services.async_call(
        DOMAIN,
        "cancel_scheduled",
        {ATTR_ENTITY_ID: ["automation.kitchen"]},
        blocking=True,
    )

    assert entry.runtime_data.scheduled == {}
    assert entry.runtime_data.scheduled_timers == {}
    timer_unsub.assert_called_once()
    assert hass.states.get("sensor.autosnooze_snoozed_automations").attributes["scheduled"] == {}
    save.assert_awaited_once_with({"paused": {}, "scheduled": {}})


async def test_setup_recovers_active_storage_and_discards_expired(smoke_hass) -> None:
    """Setup restores only active persisted work and schedules it exactly once."""
    now = dt_util.utcnow()
    stored = {
        "paused": {
            "automation.active": {
                "friendly_name": "Active",
                "resume_at": (now + timedelta(minutes=30)).isoformat(),
                "paused_at": now.isoformat(),
            },
            "automation.expired": {
                "friendly_name": "Expired",
                "resume_at": (now - timedelta(minutes=1)).isoformat(),
                "paused_at": (now - timedelta(hours=1)).isoformat(),
            },
        },
        "scheduled": {
            "automation.future": {
                "friendly_name": "Future",
                "disable_at": (now + timedelta(minutes=10)).isoformat(),
                "resume_at": (now + timedelta(minutes=40)).isoformat(),
            },
        },
    }
    hass, turn_off, turn_on = smoke_hass
    hass.states.async_set("automation.active", "off", {"friendly_name": "Active"})
    hass.states.async_set("automation.expired", "off", {"friendly_name": "Expired"})
    hass.states.async_set("automation.future", "on", {"friendly_name": "Future"})
    timer_unsubs = [MagicMock(), MagicMock()]
    load = AsyncMock(return_value=stored)
    save = AsyncMock()

    with (
        patch("custom_components.autosnooze.Store.async_load", load),
        patch("custom_components.autosnooze.Store.async_save", save),
        patch(
            "custom_components.autosnooze.runtime.ports.async_track_point_in_time", side_effect=timer_unsubs
        ) as track,
    ):
        entry = await setup_entry(hass)

    assert set(entry.runtime_data.paused) == {"automation.active"}
    assert set(entry.runtime_data.scheduled) == {"automation.future"}
    assert set(entry.runtime_data.timers) == {"automation.active"}
    assert set(entry.runtime_data.scheduled_timers) == {"automation.future"}
    assert entry.runtime_data.paused["automation.active"].friendly_name == "Active"
    assert entry.runtime_data.scheduled["automation.future"].disable_at == now + timedelta(minutes=10)
    load.assert_awaited_once()
    assert [call.args[2] for call in track.call_args_list] == [
        now + timedelta(minutes=30),
        now + timedelta(minutes=10),
    ]
    assert entry.runtime_data.timers == {"automation.active": timer_unsubs[0]}
    assert entry.runtime_data.scheduled_timers == {"automation.future": timer_unsubs[1]}
    turn_on.assert_awaited_once()
    assert turn_on.await_args.args[0].data == {ATTR_ENTITY_ID: "automation.expired"}
    turn_off.assert_awaited_once()
    assert turn_off.await_args.args[0].data == {ATTR_ENTITY_ID: "automation.active"}
    assert hass.states.get("automation.active").state == "off"
    assert hass.states.get("automation.expired").state == "on"
    assert hass.states.get("automation.future").state == "on"
    sensor = hass.states.get("sensor.autosnooze_snoozed_automations")
    assert sensor.state == "1"
    assert set(sensor.attributes["paused"]) == {"automation.active"}
    assert set(sensor.attributes["scheduled"]) == {"automation.future"}
    save.assert_awaited_once()
    saved = save.await_args.args[0]
    assert set(saved["paused"]) == {"automation.active"}
    assert saved["paused"]["automation.active"]["friendly_name"] == "Active"
    assert saved["paused"]["automation.active"]["resume_at"] == (now + timedelta(minutes=30)).isoformat()
    assert set(saved["scheduled"]) == {"automation.future"}
    assert saved["scheduled"]["automation.future"]["friendly_name"] == "Future"
    assert saved["scheduled"]["automation.future"]["disable_at"] == (now + timedelta(minutes=10)).isoformat()
    assert saved["scheduled"]["automation.future"]["resume_at"] == (now + timedelta(minutes=40)).isoformat()


async def test_unload_reload_cleans_up_without_duplicates(smoke_hass) -> None:
    """Unload/reload removes callbacks and restores exactly one core surface."""
    hass, _, _ = smoke_hass
    entry = await setup_entry(hass)
    hass.states.async_set("automation.kitchen", "on", {"friendly_name": "Kitchen"})

    timer_unsub = MagicMock()
    with patch("custom_components.autosnooze.services.schedule_resume", side_effect=fake_resume_scheduler(timer_unsub)):
        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: ["automation.kitchen"], "minutes": 5},
            blocking=True,
        )

    old_data = entry.runtime_data
    assert old_data.timers["automation.kitchen"] is timer_unsub
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()

    assert old_data.unloaded
    assert old_data.timers == {}
    assert old_data.scheduled_timers == {}
    assert old_data.notification_timers == {}
    assert old_data.listeners == []
    timer_unsub.assert_called_once()
    assert domain_services(hass) == set()
    assert hass.states.get("sensor.autosnooze_snoozed_automations").state == "unavailable"

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    assert entry.state is ConfigEntryState.LOADED
    assert entry.runtime_data is not old_data
    assert set(entry.runtime_data.paused) == {"automation.kitchen"}
    assert set(entry.runtime_data.timers) == {"automation.kitchen"}
    assert len([state for state in hass.states.async_all() if state.entity_id.startswith("sensor.autosnooze")]) == 1
    registry = er.async_get(hass)
    assert len([entity for entity in registry.entities.values() if entity.platform == DOMAIN]) == 1
    assert domain_services(hass) == SERVICES
    sensor = hass.states.get("sensor.autosnooze_snoozed_automations")
    assert sensor.state == "1"
    assert set(sensor.attributes["paused"]) == {"automation.kitchen"}
