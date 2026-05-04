"""Additional tests for services.py to improve coverage.

These tests focus on the automation filtering and pause logic.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.exceptions import ServiceValidationError
from unittest.mock import AsyncMock, MagicMock, patch
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from custom_components.autosnooze.runtime.state import AutomationPauseData

import pytest

from custom_components.autosnooze.application.pause import (
    _contains_guardrail_term,
    _is_critical_automation,
    get_automations_by_area,
    get_automations_by_label,
)

UTC = timezone.utc


def create_mock_entity(
    entity_id: str,
    domain: str = "automation",
    area_id: str | None = None,
    labels: set[str] | None = None,
) -> MagicMock:
    """Create a mock entity registry entry."""
    entity = MagicMock()
    entity.entity_id = entity_id
    entity.domain = domain
    entity.area_id = area_id
    entity.labels = labels or set()
    return entity


class TestGetAutomationsByArea:
    """Tests for get_automations_by_area function."""

    def test_returns_automations_in_area(self) -> None:
        """Test that automations in specified area are returned."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", area_id="living_room"),
            "automation.test2": create_mock_entity("automation.test2", area_id="bedroom"),
            "automation.test3": create_mock_entity("automation.test3", area_id="living_room"),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["living_room"])

        assert "automation.test1" in result
        assert "automation.test3" in result
        assert "automation.test2" not in result

    def test_returns_empty_list_when_no_matches(self) -> None:
        """Test that empty list is returned when no automations in area."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", area_id="bedroom"),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["living_room"])

        assert result == []

    def test_filters_non_automation_entities(self) -> None:
        """Test that non-automation entities are filtered out."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", area_id="living_room"),
            "light.test2": create_mock_entity("light.test2", domain="light", area_id="living_room"),
            "switch.test3": create_mock_entity("switch.test3", domain="switch", area_id="living_room"),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["living_room"])

        assert result == ["automation.test1"]

    def test_handles_multiple_areas(self) -> None:
        """Test that multiple areas can be searched."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", area_id="living_room"),
            "automation.test2": create_mock_entity("automation.test2", area_id="bedroom"),
            "automation.test3": create_mock_entity("automation.test3", area_id="kitchen"),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["living_room", "bedroom"])

        assert "automation.test1" in result
        assert "automation.test2" in result
        assert "automation.test3" not in result

    def test_handles_entities_without_area(self) -> None:
        """Test that entities without area_id are not matched."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", area_id=None),
            "automation.test2": create_mock_entity("automation.test2", area_id="living_room"),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["living_room"])

        assert result == ["automation.test2"]


class TestGetAutomationsByLabel:
    """Tests for get_automations_by_label function."""

    def test_returns_automations_with_label(self) -> None:
        """Test that automations with specified label are returned."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels={"snooze", "important"}),
            "automation.test2": create_mock_entity("automation.test2", labels={"other"}),
            "automation.test3": create_mock_entity("automation.test3", labels={"snooze"}),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["snooze"])

        assert "automation.test1" in result
        assert "automation.test3" in result
        assert "automation.test2" not in result

    def test_returns_empty_list_when_no_matches(self) -> None:
        """Test that empty list is returned when no automations have label."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels={"other"}),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["snooze"])

        assert result == []

    def test_filters_non_automation_entities(self) -> None:
        """Test that non-automation entities are filtered out."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels={"snooze"}),
            "light.test2": create_mock_entity("light.test2", domain="light", labels={"snooze"}),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["snooze"])

        assert result == ["automation.test1"]

    def test_handles_multiple_labels(self) -> None:
        """Test that multiple labels can be searched (OR logic)."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels={"label1"}),
            "automation.test2": create_mock_entity("automation.test2", labels={"label2"}),
            "automation.test3": create_mock_entity("automation.test3", labels={"label3"}),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["label1", "label2"])

        assert "automation.test1" in result
        assert "automation.test2" in result
        assert "automation.test3" not in result

    def test_handles_entities_without_labels(self) -> None:
        """Test that entities without labels are not matched."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity(
                "automation.test1",
                labels=None,  # No labels
            ),
            "automation.test2": create_mock_entity(
                "automation.test2",
                labels=set(),  # Empty labels
            ),
            "automation.test3": create_mock_entity("automation.test3", labels={"snooze"}),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["snooze"])

        assert result == ["automation.test3"]

    def test_matches_any_label_in_list(self) -> None:
        """Test that entity with any matching label is returned."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels={"a", "b", "c"}),
        }

        with patch(
            "custom_components.autosnooze.application.pause.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["b"])

        assert result == ["automation.test1"]


class TestAsyncPauseAutomations:
    """Tests for async_pause_automations function."""

    @pytest.mark.asyncio
    async def test_schedule_mode_sets_disable_at_to_now_when_past(self) -> None:
        """Test that schedule mode sets disable_at appropriately for immediate disable."""
        from custom_components.autosnooze.application.pause import async_pause_automations
        from custom_components.autosnooze.runtime.state import AutomationPauseData

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        # disable_at is in the past (or now), so immediate disable with schedule mode marker
        disable_at = now - timedelta(hours=1)
        resume_at = now + timedelta(hours=2)

        with patch("custom_components.autosnooze.application.pause.schedule_resume"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                disable_at=disable_at,
                resume_at_dt=resume_at,
            )

        # Should be paused immediately with disable_at set (schedule mode marker)
        assert "automation.test" in data.paused
        paused = data.paused["automation.test"]
        # disable_at should be set (not None) to indicate schedule mode
        assert paused.disable_at is not None

    @pytest.mark.asyncio
    async def test_future_schedule_creates_scheduled_snooze(self) -> None:
        """Test that future schedule creates a scheduled snooze."""
        from custom_components.autosnooze.application.pause import async_pause_automations
        from custom_components.autosnooze.runtime.state import AutomationPauseData

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=1)  # Future
        resume_at = now + timedelta(hours=2)

        with patch("custom_components.autosnooze.application.pause.schedule_disable"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                disable_at=disable_at,
                resume_at_dt=resume_at,
            )

        # Should be in scheduled, not paused
        assert "automation.test" not in data.paused
        assert "automation.test" in data.scheduled

    @pytest.mark.asyncio
    async def test_immediate_pause_clears_existing_scheduled_snooze(self) -> None:
        """A fresh immediate pause should replace a pending scheduled snooze."""
        from custom_components.autosnooze.application.pause import async_pause_automations
        from custom_components.autosnooze.runtime.state import AutomationPauseData
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Scheduled",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )
        scheduled_unsub = MagicMock()
        data.scheduled_timers["automation.test"] = scheduled_unsub

        with patch("custom_components.autosnooze.application.pause.schedule_resume"):
            await async_pause_automations(mock_hass, data, ["automation.test"], hours=1)

        assert "automation.test" in data.paused
        assert "automation.test" not in data.scheduled
        scheduled_unsub.assert_called_once()

    @pytest.mark.asyncio
    async def test_future_schedule_clears_existing_active_pause(self) -> None:
        """A fresh future schedule should replace an active pause for the same entity."""
        from custom_components.autosnooze.application.pause import async_pause_automations
        from custom_components.autosnooze.runtime.state import AutomationPauseData
        from custom_components.autosnooze.models import PausedAutomation

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Paused",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )
        resume_unsub = MagicMock()
        data.timers["automation.test"] = resume_unsub

        state_calls: list[bool] = []

        async def record_state_change(*_args, enabled: bool) -> bool:
            state_calls.append(enabled)
            return True

        with (
            patch(
                "custom_components.autosnooze.application.pause.async_set_automation_state",
                side_effect=record_state_change,
            ),
            patch("custom_components.autosnooze.application.pause.schedule_disable"),
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                disable_at=now + timedelta(hours=1),
                resume_at_dt=now + timedelta(hours=2),
            )

        assert "automation.test" in data.scheduled
        assert "automation.test" not in data.paused
        resume_unsub.assert_called_once()
        assert state_calls == [True]

    @pytest.mark.asyncio
    async def test_failed_wake_keeps_active_pause_when_future_schedule_replaces_it(self) -> None:
        """A failed replacement wake must not strand the automation disabled."""
        from custom_components.autosnooze.application.pause import async_pause_automations
        from custom_components.autosnooze.runtime.state import AutomationPauseData
        from custom_components.autosnooze.models import PausedAutomation

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Paused",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )
        data.paused["automation.test"] = paused
        resume_unsub = MagicMock()
        data.timers["automation.test"] = resume_unsub

        state_calls: list[bool] = []

        async def fail_wake(*_args, enabled: bool) -> bool:
            state_calls.append(enabled)
            return False

        with (
            patch("custom_components.autosnooze.application.pause.async_set_automation_state", side_effect=fail_wake),
            patch("custom_components.autosnooze.application.pause.schedule_disable") as schedule_disable,
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                disable_at=now + timedelta(hours=1),
                resume_at_dt=now + timedelta(hours=2),
            )

        assert data.paused["automation.test"] is paused
        assert "automation.test" not in data.scheduled
        assert data.timers["automation.test"] is resume_unsub
        resume_unsub.assert_not_called()
        schedule_disable.assert_not_called()
        assert state_calls == [True]

    @pytest.mark.asyncio
    async def test_continues_on_failed_automation(self) -> None:
        """Test that other automations are still paused if one fails."""
        from custom_components.autosnooze.application.pause import async_pause_automations
        from custom_components.autosnooze.runtime.state import AutomationPauseData

        mock_hass = MagicMock()

        # First automation doesn't exist (state is None), second one does
        def get_state(entity_id):
            if entity_id == "automation.test1":
                return None  # Doesn't exist
            return MagicMock(attributes={"friendly_name": "Test 2"})

        mock_hass.states.get.side_effect = get_state

        # Service call fails for first, succeeds for second
        async def mock_call(domain, service, data, blocking=False):
            if data.get("entity_id") == "automation.test1":
                raise Exception("Failed")

        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with patch("custom_components.autosnooze.application.pause.schedule_resume"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test1", "automation.test2"],
                hours=1,
            )

        # test2 should be paused, test1 should not (failed to set state)
        assert "automation.test2" in data.paused

    @pytest.mark.asyncio
    async def test_notifies_listeners_after_pause(self) -> None:
        """Test that listeners are notified after pausing."""
        from custom_components.autosnooze.application.pause import async_pause_automations
        from custom_components.autosnooze.runtime.state import AutomationPauseData

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        listener = MagicMock()
        data.add_listener(listener)

        with patch("custom_components.autosnooze.application.pause.schedule_resume"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                hours=1,
            )

        listener.assert_called()

    @pytest.mark.asyncio
    async def test_releases_lock_before_waiting_on_turn_off_service(self) -> None:
        """Pause should not hold data.lock while awaiting automation turn-off."""
        from custom_components.autosnooze.application.pause import async_pause_automations
        from custom_components.autosnooze.runtime.state import AutomationPauseData

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        service_started = asyncio.Event()
        allow_service_finish = asyncio.Event()

        async def slow_turn_off(*_args, **_kwargs) -> bool:
            service_started.set()
            await allow_service_finish.wait()
            return True

        with patch(
            "custom_components.autosnooze.application.pause.async_set_automation_state", side_effect=slow_turn_off
        ):
            pause_task = asyncio.create_task(async_pause_automations(mock_hass, data, ["automation.test"], hours=1))

            await asyncio.wait_for(service_started.wait(), timeout=1)

            acquired_while_pause_in_flight = False
            try:
                await asyncio.wait_for(data.lock.acquire(), timeout=0.05)
                acquired_while_pause_in_flight = True
            finally:
                if acquired_while_pause_in_flight:
                    data.lock.release()

            allow_service_finish.set()
            await pause_task

        assert acquired_while_pause_in_flight is True


class TestContainsGuardrailTerm:
    """Tests for _contains_guardrail_term function."""

    def test_case_insensitive(self) -> None:
        """Matching should be case-insensitive."""
        assert _contains_guardrail_term("ALARM_PANEL", "alarm") is True
        assert _contains_guardrail_term("Smoke Detector", "smoke") is True

    def test_no_substring_match(self) -> None:
        """Term embedded in a larger word should NOT match."""
        assert _contains_guardrail_term("fireplace_toggle", "fire") is False
        assert _contains_guardrail_term("madagascar_lights", "gas") is False

    def test_multi_word_term(self) -> None:
        """Multi-word terms like 'carbon monoxide' should match."""
        assert _contains_guardrail_term("carbon monoxide detector", "carbon monoxide") is True


class TestIsCriticalAutomation:
    """Tests for _is_critical_automation function."""

    def test_detects_alarm_in_entity_id(self) -> None:
        """Alarm keyword in entity_id should trigger critical detection."""
        assert _is_critical_automation("automation.front_door_alarm", "Front Door") is True

    def test_detects_keyword_in_friendly_name(self) -> None:
        """Critical keyword in friendly_name should trigger detection."""
        assert _is_critical_automation("automation.some_thing", "Front Door Alarm") is True

    def test_non_critical_returns_false(self) -> None:
        """Non-critical automation should not trigger detection."""
        assert _is_critical_automation("automation.living_room_lights", "Living Room Lights") is False

    def test_no_substring_false_positive(self) -> None:
        """Words containing critical terms as substrings should NOT match."""
        assert _is_critical_automation("automation.fireplace_toggle", "Fireplace Toggle") is False
        assert _is_critical_automation("automation.madagascar_scene", "Madagascar Scene") is False

    def test_co_false_positive_not_in_terms(self) -> None:
        """'co' as standalone term should not be in CRITICAL_AUTOMATION_TERMS.

        'co_operative', 'co_ordinator' etc. contain 'co' at word boundaries
        and would false-positive. Only 'carbon monoxide' and 'co2' should match.
        """
        assert _is_critical_automation("automation.co_operative_lights", "Co-operative Lights") is False


class TestUnloadGuards:
    """Tests for service no-op behavior when integration is unloaded."""

    @pytest.mark.asyncio
    async def test_async_pause_automations_noops_when_unloaded(self) -> None:
        """Pause entrypoint should skip all work when data.unloaded is True."""
        from custom_components.autosnooze.runtime.state import AutomationPauseData
        from custom_components.autosnooze.application.pause import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.unloaded = True

        with patch(
            "custom_components.autosnooze.application.pause.async_set_automation_state", new_callable=AsyncMock
        ) as set_state:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                hours=1,
            )

        set_state.assert_not_called()
        mock_store.async_save.assert_not_called()
        assert data.paused == {}
        assert data.scheduled == {}

    @pytest.mark.asyncio
    async def test_pause_service_handler_noops_when_unloaded(self) -> None:
        """Registered pause handler should return early when integration is unloaded."""
        from custom_components.autosnooze.runtime.state import AutomationPauseData
        from custom_components.autosnooze.services import register_services

        mock_hass = MagicMock()
        handlers: dict[str, object] = {}
        mock_hass.services.async_register = lambda _domain, name, handler, schema=None: handlers.setdefault(
            name, handler
        )

        data = AutomationPauseData(store=MagicMock())
        data.unloaded = True
        register_services(mock_hass, data)

        pause_handler = handlers["pause"]
        call = MagicMock()
        call.data = {ATTR_ENTITY_ID: ["automation.test"], "hours": 1}

        with (
            patch("custom_components.autosnooze.application.pause._validate_guardrails") as validate_guardrails,
            patch(
                "custom_components.autosnooze.application.pause.async_pause_automations", new_callable=AsyncMock
            ) as pause_automations,
        ):
            await pause_handler(call)

        validate_guardrails.assert_not_called()
        pause_automations.assert_not_called()

    @pytest.mark.asyncio
    async def test_pause_by_area_handler_noops_when_unloaded(self) -> None:
        """pause_by_area should skip lookup/validation/pause when unloaded."""
        from custom_components.autosnooze.runtime.state import AutomationPauseData
        from custom_components.autosnooze.services import register_services

        mock_hass = MagicMock()
        handlers: dict[str, object] = {}
        mock_hass.services.async_register = lambda _domain, name, handler, schema=None: handlers.setdefault(
            name, handler
        )

        data = AutomationPauseData(store=MagicMock())
        data.unloaded = True
        register_services(mock_hass, data)

        pause_by_area_handler = handlers["pause_by_area"]
        call = MagicMock()
        call.data = {"area_id": "living_room", "hours": 1}

        with (
            patch(
                "custom_components.autosnooze.application.pause.get_automations_by_area",
                return_value=["automation.test"],
            ) as get_by_area,
            patch("custom_components.autosnooze.application.pause._validate_guardrails") as validate_guardrails,
            patch(
                "custom_components.autosnooze.application.pause.async_pause_automations", new_callable=AsyncMock
            ) as pause_automations,
        ):
            await pause_by_area_handler(call)

        get_by_area.assert_not_called()
        validate_guardrails.assert_not_called()
        pause_automations.assert_not_called()


class TestServiceHandlerContracts:
    """Service handler contract tests for call inputs and side effects."""

    def _register_handlers(self) -> tuple[MagicMock, "AutomationPauseData", dict[str, object]]:
        from custom_components.autosnooze.runtime.state import AutomationPauseData
        from custom_components.autosnooze.services import register_services

        mock_hass = MagicMock()
        handlers: dict[str, object] = {}
        mock_hass.services.async_register = lambda _domain, name, handler, schema=None: handlers.setdefault(
            name, handler
        )
        data = AutomationPauseData(store=MagicMock())
        register_services(mock_hass, data)
        return mock_hass, data, handlers

    @pytest.mark.asyncio
    async def test_pause_handler_forwards_contract_fields(self) -> None:
        """pause forwards full payload and guardrail confirm flag."""
        mock_hass, data, handlers = self._register_handlers()
        pause_handler = handlers["pause"]

        disable_at = datetime(2030, 1, 1, 10, 0, tzinfo=UTC)
        resume_at = datetime(2030, 1, 1, 12, 0, tzinfo=UTC)
        call = MagicMock()
        call.data = {
            ATTR_ENTITY_ID: ["automation.a", "automation.b"],
            "days": 1,
            "hours": 2,
            "minutes": 3,
            "disable_at": disable_at,
            "resume_at": resume_at,
            "confirm": True,
        }

        with (
            patch("custom_components.autosnooze.application.pause._validate_guardrails") as validate_guardrails,
            patch(
                "custom_components.autosnooze.application.pause.async_pause_automations",
                new_callable=AsyncMock,
            ) as pause_automations,
        ):
            await pause_handler(call)

        validate_guardrails.assert_called_once_with(
            mock_hass,
            ["automation.a", "automation.b"],
            confirm=True,
        )
        pause_automations.assert_called_once_with(
            mock_hass,
            data,
            ["automation.a", "automation.b"],
            1,
            2,
            3,
            disable_at,
            resume_at,
        )

    @pytest.mark.asyncio
    async def test_pause_handler_calls_pause_automations_directly(self) -> None:
        """pause service entrypoint should call pause implementation directly."""
        mock_hass, data, handlers = self._register_handlers()
        pause_handler = handlers["pause"]

        disable_at = datetime(2030, 1, 1, 10, 0, tzinfo=UTC)
        resume_at = datetime(2030, 1, 1, 12, 0, tzinfo=UTC)
        call = MagicMock()
        call.data = {
            ATTR_ENTITY_ID: ["automation.a"],
            "days": 1,
            "hours": 2,
            "minutes": 3,
            "disable_at": disable_at,
            "resume_at": resume_at,
            "confirm": False,
        }

        with (
            patch("custom_components.autosnooze.application.pause._validate_guardrails") as validate_guardrails,
            patch(
                "custom_components.autosnooze.application.pause.async_pause_automations",
                new_callable=AsyncMock,
            ) as pause_automations,
        ):
            await pause_handler(call)

        validate_guardrails.assert_called_once_with(mock_hass, ["automation.a"], confirm=False)
        pause_automations.assert_called_once_with(
            mock_hass,
            data,
            ["automation.a"],
            1,
            2,
            3,
            disable_at,
            resume_at,
        )

    @pytest.mark.asyncio
    async def test_cancel_handler_filters_unknown_and_batches_valid(self) -> None:
        """cancel should only batch-resume paused automations."""
        mock_hass, data, handlers = self._register_handlers()
        cancel_handler = handlers["cancel"]

        now = datetime.now(UTC)
        data.paused["automation.exists"] = MagicMock(
            entity_id="automation.exists",
            friendly_name="Exists",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )

        call = MagicMock()
        call.data = {ATTR_ENTITY_ID: ["automation.exists", "automation.unknown"]}

        with patch(
            "custom_components.autosnooze.application.resume.async_resume_batch",
            new_callable=AsyncMock,
        ) as batch_resume:
            await cancel_handler(call)

        batch_resume.assert_called_once_with(mock_hass, data, ["automation.exists"])

    @pytest.mark.asyncio
    async def test_cancel_all_batches_every_paused_automation(self) -> None:
        """cancel_all should wake all paused entities in one batch call."""
        mock_hass, data, handlers = self._register_handlers()
        cancel_all_handler = handlers["cancel_all"]

        now = datetime.now(UTC)
        data.paused["automation.a"] = MagicMock(entity_id="automation.a", resume_at=now, paused_at=now)
        data.paused["automation.b"] = MagicMock(entity_id="automation.b", resume_at=now, paused_at=now)

        with patch(
            "custom_components.autosnooze.application.resume.async_resume_batch",
            new_callable=AsyncMock,
        ) as batch_resume:
            await cancel_all_handler(MagicMock())

        batch_resume.assert_called_once()
        assert set(batch_resume.call_args.args[2]) == {"automation.a", "automation.b"}

    @pytest.mark.asyncio
    async def test_cancel_scheduled_filters_unknown_and_batches_valid(self) -> None:
        """cancel_scheduled should only cancel known scheduled entities."""
        mock_hass, data, handlers = self._register_handlers()
        cancel_scheduled_handler = handlers["cancel_scheduled"]

        now = datetime.now(UTC)
        data.scheduled["automation.scheduled"] = MagicMock(
            entity_id="automation.scheduled",
            disable_at=now + timedelta(minutes=5),
            resume_at=now + timedelta(hours=1),
        )

        call = MagicMock()
        call.data = {ATTR_ENTITY_ID: ["automation.scheduled", "automation.unknown"]}

        with patch(
            "custom_components.autosnooze.application.scheduled.async_cancel_scheduled_batch",
            new_callable=AsyncMock,
        ) as batch_cancel:
            await cancel_scheduled_handler(call)

        batch_cancel.assert_called_once_with(mock_hass, data, ["automation.scheduled"])

    @pytest.mark.asyncio
    async def test_adjust_handler_rejects_zero_delta(self) -> None:
        """adjust should fail fast when no delta is provided."""
        _mock_hass, _data, handlers = self._register_handlers()
        adjust_handler = handlers["adjust"]

        call = MagicMock()
        call.data = {ATTR_ENTITY_ID: ["automation.a"], "days": 0, "hours": 0, "minutes": 0}

        with pytest.raises(ServiceValidationError) as exc_info:
            await adjust_handler(call)

        assert exc_info.value.translation_key == "invalid_adjustment"

    @pytest.mark.asyncio
    async def test_adjust_handler_forwards_timedelta_batch_call(self) -> None:
        """adjust should pass entity ids and a computed delta to batch adjust."""
        mock_hass, data, handlers = self._register_handlers()
        adjust_handler = handlers["adjust"]

        call = MagicMock()
        call.data = {ATTR_ENTITY_ID: ["automation.a", "automation.b"], "hours": 1, "minutes": -30}

        with patch(
            "custom_components.autosnooze.application.adjust.async_adjust_snooze_batch",
            new_callable=AsyncMock,
        ) as batch_adjust:
            await adjust_handler(call)

        batch_adjust.assert_called_once_with(
            mock_hass,
            data,
            ["automation.a", "automation.b"],
            timedelta(hours=1, minutes=-30),
        )


class TestSaveFailurePropagation:
    """Tests that failed persistence is surfaced to service callers."""

    @pytest.mark.asyncio
    async def test_pause_raises_when_save_fails(self) -> None:
        """Pause should raise ServiceValidationError when async_save returns False."""
        from custom_components.autosnooze.runtime.state import AutomationPauseData
        from custom_components.autosnooze.application.pause import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})

        data = AutomationPauseData(store=MagicMock())

        with (
            patch(
                "custom_components.autosnooze.application.pause.async_set_automation_state",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("custom_components.autosnooze.application.pause.schedule_resume"),
            patch(
                "custom_components.autosnooze.application.pause.async_save", new_callable=AsyncMock, return_value=False
            ),
            pytest.raises(ServiceValidationError) as exc_info,
        ):
            await async_pause_automations(mock_hass, data, ["automation.test"], hours=1)

        assert exc_info.value.translation_key == "save_failed"
