"""Tests for pause resume strategies: resume_at, resume_at_time, and resume_preset.

Home Assistant renders Jinja templates before a service call reaches the
integration, so AutoSnooze only needs to accept already-rendered datetime
strings for resume_at. These tests cover that, the new resume_at_time and
resume_preset strategies, and the exactly-one-strategy validation rule.
"""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
import voluptuous as vol
from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import ATTR_ENTITY_ID, SUN_EVENT_SUNRISE, SUN_EVENT_SUNSET
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.sun import get_astral_event_next
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.autosnooze import DOMAIN
from custom_components.autosnooze.application.pause import (
    next_local_time_occurrence,
    resolve_resume_at,
)
from custom_components.autosnooze.const import (
    PAUSE_BY_AREA_SCHEMA,
    PAUSE_BY_LABEL_SCHEMA,
    PAUSE_SCHEMA,
    RESUME_PRESET_END_OF_DAY,
    RESUME_PRESET_NEXT_MORNING,
    RESUME_PRESET_NEXT_SUNRISE,
    RESUME_PRESET_NEXT_SUNSET,
)

ENTITY = "automation.test_automation_1"

# =============================================================================
# Fixtures (mirrors test_integration.py setup)
# =============================================================================


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for all tests."""
    yield


@pytest.fixture(autouse=True)
async def mock_dependencies(hass: HomeAssistant):
    """Mock manifest dependencies (frontend, http, lovelace) for all tests."""
    mock_resources = MagicMock()
    mock_resources.async_items.return_value = []
    mock_resources.async_create_item = AsyncMock()
    mock_resources.async_update_item = AsyncMock()
    mock_lovelace = MagicMock()
    mock_lovelace.resources = mock_resources
    hass.data["lovelace"] = mock_lovelace

    if not hasattr(hass, "http") or hass.http is None:
        hass.http = MagicMock()
    hass.http.async_register_static_paths = AsyncMock()

    for dep in ["frontend", "http", "lovelace", "automation"]:
        hass.config.components.add(dep)

    async def mock_automation_service(call):
        pass

    hass.services.async_register("automation", "turn_on", mock_automation_service)
    hass.services.async_register("automation", "turn_off", mock_automation_service)
    hass.services.async_register("automation", "toggle", mock_automation_service)

    yield


@pytest.fixture
async def setup_integration(hass: HomeAssistant):
    """Set up the AutoSnooze integration with one mock automation."""
    entry = MockConfigEntry(domain=DOMAIN, title="AutoSnooze", data={}, unique_id=DOMAIN, version=1)
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    hass.states.async_set(ENTITY, "on", {"friendly_name": "Test Automation 1"})
    return hass.config_entries.async_get_entry(entry.entry_id)


# =============================================================================
# Schema validation
# =============================================================================


class TestResumeStrategySchema:
    """Schema-level validation of the resume strategy fields."""

    def test_resume_at_accepts_iso_datetime_string(self) -> None:
        """resume_at accepts an ISO datetime string with a UTC offset."""
        result = PAUSE_SCHEMA({ATTR_ENTITY_ID: [ENTITY], "resume_at": "2026-07-08T00:00:00-05:00"})
        expected = datetime(2026, 7, 8, 0, 0, tzinfo=timezone(timedelta(hours=-5)))
        assert result["resume_at"] == expected

    def test_resume_at_accepts_rendered_template_string(self) -> None:
        """resume_at accepts the string a rendered HA template would produce.

        Mirrors: "{{ (today_at('00:00') + timedelta(days=1)).isoformat() }}"
        """
        rendered = (dt_util.start_of_local_day() + timedelta(days=1)).isoformat()
        result = PAUSE_SCHEMA({ATTR_ENTITY_ID: [ENTITY], "resume_at": rendered})
        assert result["resume_at"] == dt_util.start_of_local_day() + timedelta(days=1)

    def test_resume_at_accepts_datetime_object(self) -> None:
        """resume_at keeps accepting plain datetime objects (backward compat)."""
        value = datetime(2026, 7, 8, 0, 0, tzinfo=timezone.utc)
        result = PAUSE_SCHEMA({ATTR_ENTITY_ID: [ENTITY], "resume_at": value})
        assert result["resume_at"] == value

    def test_resume_at_time_accepts_time_string(self) -> None:
        """resume_at_time parses an HH:MM:SS string into a time object."""
        result = PAUSE_SCHEMA({ATTR_ENTITY_ID: [ENTITY], "resume_at_time": "06:25:00"})
        assert result["resume_at_time"] == time(6, 25)

    def test_resume_preset_accepts_known_values(self) -> None:
        """Each documented preset passes schema validation."""
        for preset in (
            RESUME_PRESET_END_OF_DAY,
            RESUME_PRESET_NEXT_MORNING,
            RESUME_PRESET_NEXT_SUNRISE,
            RESUME_PRESET_NEXT_SUNSET,
        ):
            result = PAUSE_SCHEMA({ATTR_ENTITY_ID: [ENTITY], "resume_preset": preset})
            assert result["resume_preset"] == preset

    def test_unknown_preset_fails_validation(self) -> None:
        """Vague or unknown preset names are rejected."""
        for preset in ("tomorrow", "until_tomorrow", "tonight", "later", "soon"):
            with pytest.raises(vol.Invalid):
                PAUSE_SCHEMA({ATTR_ENTITY_ID: [ENTITY], "resume_preset": preset})

    def test_combining_resume_at_and_preset_fails(self) -> None:
        """resume_at and resume_preset are mutually exclusive."""
        with pytest.raises(vol.Invalid, match="exactly one resume strategy"):
            PAUSE_SCHEMA(
                {
                    ATTR_ENTITY_ID: [ENTITY],
                    "resume_at": "2026-07-08T00:00:00-05:00",
                    "resume_preset": RESUME_PRESET_END_OF_DAY,
                }
            )

    def test_combining_duration_and_resume_at_time_fails(self) -> None:
        """Duration fields and resume_at_time are mutually exclusive."""
        with pytest.raises(vol.Invalid, match="exactly one resume strategy"):
            PAUSE_SCHEMA({ATTR_ENTITY_ID: [ENTITY], "minutes": 30, "resume_at_time": "06:25:00"})

    def test_combining_resume_at_time_and_preset_fails(self) -> None:
        """resume_at_time and resume_preset are mutually exclusive."""
        with pytest.raises(vol.Invalid, match="exactly one resume strategy"):
            PAUSE_SCHEMA(
                {
                    ATTR_ENTITY_ID: [ENTITY],
                    "resume_at_time": "06:25:00",
                    "resume_preset": RESUME_PRESET_NEXT_MORNING,
                }
            )

    def test_duration_only_still_valid(self) -> None:
        """A plain duration call passes schema validation unchanged."""
        result = PAUSE_SCHEMA({ATTR_ENTITY_ID: [ENTITY], "minutes": 30})
        assert result["minutes"] == 30

    def test_pause_by_area_and_label_enforce_strategy_rule(self) -> None:
        """The strategy rule applies to pause_by_area and pause_by_label too."""
        with pytest.raises(vol.Invalid, match="exactly one resume strategy"):
            PAUSE_BY_AREA_SCHEMA({"area_id": "living_room", "hours": 2, "resume_preset": RESUME_PRESET_END_OF_DAY})
        with pytest.raises(vol.Invalid, match="exactly one resume strategy"):
            PAUSE_BY_LABEL_SCHEMA(
                {"label_id": "security", "resume_at_time": "06:25:00", "resume_preset": RESUME_PRESET_END_OF_DAY}
            )


# =============================================================================
# Strategy resolution
# =============================================================================


class TestResumeStrategyResolution:
    """Resolution of resume_at_time and resume_preset to absolute datetimes."""

    async def _use_new_york(self, hass: HomeAssistant) -> None:
        await hass.config.async_set_time_zone("America/New_York")

    async def test_end_of_day_resolves_to_next_local_midnight(
        self, hass: HomeAssistant, freezer: FrozenDateTimeFactory
    ) -> None:
        """end_of_day resolves to tomorrow 00:00:00 local time."""
        await self._use_new_york(hass)
        freezer.move_to("2026-07-07 15:00:00-04:00")

        resolved = resolve_resume_at(hass, {"resume_preset": RESUME_PRESET_END_OF_DAY})

        assert resolved == datetime(2026, 7, 8, 4, 0, tzinfo=timezone.utc)  # 00:00 EDT
        assert resolved.tzinfo == timezone.utc

    async def test_resume_at_time_resolves_to_today_when_upcoming(
        self, hass: HomeAssistant, freezer: FrozenDateTimeFactory
    ) -> None:
        """A time later today resolves to today."""
        await self._use_new_york(hass)
        freezer.move_to("2026-07-07 05:00:00-04:00")

        resolved = resolve_resume_at(hass, {"resume_at_time": time(6, 25)})

        assert resolved == datetime(2026, 7, 7, 10, 25, tzinfo=timezone.utc)  # 06:25 EDT today

    async def test_resume_at_time_resolves_to_tomorrow_when_passed(
        self, hass: HomeAssistant, freezer: FrozenDateTimeFactory
    ) -> None:
        """A time already passed today resolves to tomorrow."""
        await self._use_new_york(hass)
        freezer.move_to("2026-07-07 11:00:00-04:00")

        resolved = resolve_resume_at(hass, {"resume_at_time": time(6, 25)})

        assert resolved == datetime(2026, 7, 8, 10, 25, tzinfo=timezone.utc)  # 06:25 EDT tomorrow

    async def test_next_morning_resolves_to_next_8am_local(
        self, hass: HomeAssistant, freezer: FrozenDateTimeFactory
    ) -> None:
        """next_morning resolves to the next 08:00 local time."""
        await self._use_new_york(hass)

        freezer.move_to("2026-07-07 05:00:00-04:00")
        resolved = resolve_resume_at(hass, {"resume_preset": RESUME_PRESET_NEXT_MORNING})
        assert resolved == datetime(2026, 7, 7, 12, 0, tzinfo=timezone.utc)  # 08:00 EDT today

        freezer.move_to("2026-07-07 09:00:00-04:00")
        resolved = resolve_resume_at(hass, {"resume_preset": RESUME_PRESET_NEXT_MORNING})
        assert resolved == datetime(2026, 7, 8, 12, 0, tzinfo=timezone.utc)  # 08:00 EDT tomorrow

    async def test_next_sunrise_and_sunset_use_ha_sun_events(
        self, hass: HomeAssistant, freezer: FrozenDateTimeFactory
    ) -> None:
        """Sunrise/sunset presets resolve via Home Assistant's sun helpers."""
        freezer.move_to("2026-07-07 12:00:00+00:00")
        now = dt_util.utcnow()

        sunrise = resolve_resume_at(hass, {"resume_preset": RESUME_PRESET_NEXT_SUNRISE})
        sunset = resolve_resume_at(hass, {"resume_preset": RESUME_PRESET_NEXT_SUNSET})

        assert sunrise == get_astral_event_next(hass, SUN_EVENT_SUNRISE)
        assert sunset == get_astral_event_next(hass, SUN_EVENT_SUNSET)
        assert sunrise > now
        assert sunset > now

    async def test_resume_at_wins_passthrough(self, hass: HomeAssistant) -> None:
        """resume_at is returned as a UTC-normalized datetime."""
        value = datetime(2026, 7, 8, 0, 0, tzinfo=timezone(timedelta(hours=-5)))
        resolved = resolve_resume_at(hass, {"resume_at": value})
        assert resolved == value
        assert resolved.tzinfo == timezone.utc

    async def test_no_strategy_returns_none(self, hass: HomeAssistant) -> None:
        """Duration-only calls resolve to None (duration path handles them)."""
        assert resolve_resume_at(hass, {"days": 1}) is None

    async def test_unknown_preset_raises_guard_error(self, hass: HomeAssistant) -> None:
        """Direct callers with an invalid preset hit the defensive guard."""
        with pytest.raises(ServiceValidationError):
            resolve_resume_at(hass, {"resume_preset": "tomorrow"})

    async def test_next_local_time_occurrence_boundary(
        self, hass: HomeAssistant, freezer: FrozenDateTimeFactory
    ) -> None:
        """A target equal to the current time resolves to tomorrow, not now."""
        await self._use_new_york(hass)
        freezer.move_to("2026-07-07 06:25:00-04:00")

        resolved = next_local_time_occurrence(time(6, 25))

        assert resolved == datetime(2026, 7, 8, 10, 25, tzinfo=timezone.utc)


# =============================================================================
# End-to-end service behavior
# =============================================================================


class TestPauseServiceResumeStrategies:
    """Full service-call flow for the new resume strategies."""

    async def test_pause_with_resume_preset_end_of_day(
        self, hass: HomeAssistant, setup_integration, freezer: FrozenDateTimeFactory
    ) -> None:
        """Pausing with end_of_day snoozes until the next local midnight."""
        await hass.config.async_set_time_zone("America/New_York")
        freezer.move_to("2026-07-07 15:00:00-04:00")

        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: [ENTITY], "resume_preset": "end_of_day"},
            blocking=True,
        )

        paused = setup_integration.runtime_data.paused[ENTITY]
        assert paused.resume_at == datetime(2026, 7, 8, 4, 0, tzinfo=timezone.utc)

    async def test_pause_with_resume_at_time_upcoming_today(
        self, hass: HomeAssistant, setup_integration, freezer: FrozenDateTimeFactory
    ) -> None:
        """Pausing with an upcoming resume_at_time resumes later today."""
        await hass.config.async_set_time_zone("America/New_York")
        freezer.move_to("2026-07-07 05:00:00-04:00")

        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: [ENTITY], "resume_at_time": "06:25:00"},
            blocking=True,
        )

        paused = setup_integration.runtime_data.paused[ENTITY]
        assert paused.resume_at == datetime(2026, 7, 7, 10, 25, tzinfo=timezone.utc)

    async def test_pause_with_resume_at_time_already_passed(
        self, hass: HomeAssistant, setup_integration, freezer: FrozenDateTimeFactory
    ) -> None:
        """Pausing with a passed resume_at_time resumes tomorrow."""
        await hass.config.async_set_time_zone("America/New_York")
        freezer.move_to("2026-07-07 11:00:00-04:00")

        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: [ENTITY], "resume_at_time": "06:25:00"},
            blocking=True,
        )

        paused = setup_integration.runtime_data.paused[ENTITY]
        assert paused.resume_at == datetime(2026, 7, 8, 10, 25, tzinfo=timezone.utc)

    async def test_pause_with_rendered_template_style_resume_at(self, hass: HomeAssistant, setup_integration) -> None:
        """A rendered-template-style ISO string works end to end."""
        rendered = (dt_util.start_of_local_day() + timedelta(days=1)).isoformat()

        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: [ENTITY], "resume_at": rendered},
            blocking=True,
        )

        paused = setup_integration.runtime_data.paused[ENTITY]
        assert paused.resume_at == dt_util.as_utc(dt_util.start_of_local_day() + timedelta(days=1))

    async def test_pause_with_duration_still_works(self, hass: HomeAssistant, setup_integration) -> None:
        """Existing duration-based pause behavior is unchanged."""
        before = dt_util.utcnow()

        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: [ENTITY], "hours": 2},
            blocking=True,
        )

        paused = setup_integration.runtime_data.paused[ENTITY]
        assert timedelta(hours=1, minutes=59) < paused.resume_at - before <= timedelta(hours=2, seconds=5)

    async def test_pause_service_rejects_combined_strategies(self, hass: HomeAssistant, setup_integration) -> None:
        """The service call itself rejects multiple resume strategies."""
        with pytest.raises(vol.Invalid):
            await hass.services.async_call(
                DOMAIN,
                "pause",
                {
                    ATTR_ENTITY_ID: [ENTITY],
                    "resume_at": "2026-07-08T00:00:00-05:00",
                    "resume_preset": "end_of_day",
                },
                blocking=True,
            )
        assert ENTITY not in setup_integration.runtime_data.paused

    async def test_pause_service_rejects_unknown_preset(self, hass: HomeAssistant, setup_integration) -> None:
        """The service call rejects vague preset names."""
        with pytest.raises(vol.Invalid):
            await hass.services.async_call(
                DOMAIN,
                "pause",
                {ATTR_ENTITY_ID: [ENTITY], "resume_preset": "tomorrow"},
                blocking=True,
            )
        assert ENTITY not in setup_integration.runtime_data.paused
