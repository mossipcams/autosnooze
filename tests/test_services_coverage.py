"""Additional tests for services.py to improve coverage.

These tests focus on the automation filtering and pause logic.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze.services import (
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
            "custom_components.autosnooze.services.er.async_get",
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
            "custom_components.autosnooze.services.er.async_get",
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
            "custom_components.autosnooze.services.er.async_get",
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
            "custom_components.autosnooze.services.er.async_get",
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
            "custom_components.autosnooze.services.er.async_get",
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
            "custom_components.autosnooze.services.er.async_get",
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
            "custom_components.autosnooze.services.er.async_get",
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
            "custom_components.autosnooze.services.er.async_get",
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
            "custom_components.autosnooze.services.er.async_get",
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
            "custom_components.autosnooze.services.er.async_get",
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
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["b"])

        assert result == ["automation.test1"]


class TestAsyncPauseAutomations:
    """Tests for async_pause_automations function."""

    @pytest.mark.asyncio
    async def test_schedule_mode_sets_disable_at_to_now_when_past(self) -> None:
        """Test that schedule mode sets disable_at appropriately for immediate disable."""
        from custom_components.autosnooze.services import async_pause_automations
        from custom_components.autosnooze.models import AutomationPauseData

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

        with patch("custom_components.autosnooze.services.schedule_resume"):
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
        from custom_components.autosnooze.services import async_pause_automations
        from custom_components.autosnooze.models import AutomationPauseData

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=1)  # Future
        resume_at = now + timedelta(hours=2)

        with patch("custom_components.autosnooze.services.schedule_disable"):
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
    async def test_continues_on_failed_automation(self) -> None:
        """Test that other automations are still paused if one fails."""
        from custom_components.autosnooze.services import async_pause_automations
        from custom_components.autosnooze.models import AutomationPauseData

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

        with patch("custom_components.autosnooze.services.schedule_resume"):
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
        from custom_components.autosnooze.services import async_pause_automations
        from custom_components.autosnooze.models import AutomationPauseData

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        listener = MagicMock()
        data.add_listener(listener)

        with patch("custom_components.autosnooze.services.schedule_resume"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                hours=1,
            )

        listener.assert_called()


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
