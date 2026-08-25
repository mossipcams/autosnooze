"""HA card API contract: live service catalog and v1 sensor payloads."""

from __future__ import annotations

import json
import re
from datetime import timedelta
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import yaml
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from custom_components.autosnooze.const import (
    DOMAIN,
    PAUSE_SCHEMA,
    SENSOR_SCHEMA_VERSION,
)
from custom_components.autosnooze.services import SERVICE_NAMES

from tests.test_smoke import fake_resume_scheduler, setup_entry

REPO_ROOT = Path(__file__).resolve().parent.parent
SERVICES_YAML_PATH = REPO_ROOT / "custom_components/autosnooze/services.yaml"
TRANSLATIONS_PATH = REPO_ROOT / "custom_components/autosnooze/translations/en.json"
SERVICES_FIXTURE_PATH = Path(__file__).parent / "fixtures/services-schema.json"
SNOOZE_TS_PATH = REPO_ROOT / "src/services/snooze.ts"
TELEMETRY_TS_PATH = REPO_ROOT / "src/services/telemetry.ts"

SENSOR_ENTITY_ID = "sensor.autosnooze_snoozed_automations"
ENTITY_ONE = "automation.test_automation_1"

PAUSE_FAMILY = ("pause", "pause_by_area", "pause_by_label")
DIRECT_ENTITY_SERVICES = ("cancel", "clear_notification", "cancel_scheduled", "adjust")
PAUSE_TARGET_FIELDS = {
    "pause_by_area": "area_id",
    "pause_by_label": "label_id",
}
PAUSE_OPTIONAL_FIELDS = frozenset(
    {
        "days",
        "hours",
        "minutes",
        "disable_at",
        "resume_at",
        "resume_at_time",
        "resume_preset",
        "notification_trigger",
        "notification_lead_minutes",
        "confirm",
    }
)
HA_UI_ONLY_SERVICES = frozenset({"pause_by_area", "pause_by_label"})
CALL_SERVICE_RE = re.compile(r"""callService\(\s*['"]autosnooze['"]\s*,\s*['"]([^'"]+)['"]""")


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for HA contract tests."""
    yield


@pytest.fixture
async def contract_hass(hass: HomeAssistant):
    """HA with integration external dependencies faked (minimal smoke pattern)."""
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
    hass.services.async_register("homeassistant", "turn_off", turn_off)
    hass.services.async_register("homeassistant", "turn_on", turn_on)
    mock_posthog = MagicMock(disabled=False, capture=MagicMock(), shutdown=MagicMock())
    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.Posthog",
        return_value=mock_posthog,
    ):
        yield hass, turn_off, turn_on


def _load_services_yaml() -> dict[str, Any]:
    return yaml.safe_load(SERVICES_YAML_PATH.read_text(encoding="utf-8"))


def _load_services_fixture() -> dict[str, Any]:
    return json.loads(SERVICES_FIXTURE_PATH.read_text(encoding="utf-8"))


def _frontend_service_names() -> set[str]:
    names: set[str] = set()
    for path in (SNOOZE_TS_PATH, TELEMETRY_TS_PATH):
        names.update(CALL_SERVICE_RE.findall(path.read_text(encoding="utf-8")))
    return names


def _assert_v1_sensor(
    sensor,
    *,
    expected_paused_count: int,
    entity_id: str | None = None,
    paused_checks: dict[str, Any] | None = None,
) -> None:
    assert sensor is not None
    attrs = sensor.attributes
    assert attrs["schema_version"] == SENSOR_SCHEMA_VERSION
    assert "paused" in attrs
    assert "scheduled" in attrs
    assert "paused_automations" not in attrs
    assert "scheduled_snoozes" not in attrs
    assert sensor.state == str(expected_paused_count)
    if entity_id is not None:
        assert entity_id in attrs["paused"]
        entry = attrs["paused"][entity_id]
        assert entry.get("resume_at")
        assert entry.get("paused_at")
        if paused_checks:
            for key, expected in paused_checks.items():
                assert entry[key] == expected, f"{entity_id}.{key}"


# ---------------------------------------------------------------------------
# Task 1 — Live HA service catalog contract
# ---------------------------------------------------------------------------


def test_services_yaml_keys_match_service_names() -> None:
    yaml_keys = set(_load_services_yaml())
    assert yaml_keys == set(SERVICE_NAMES)


@pytest.mark.parametrize("service_name", PAUSE_FAMILY)
def test_pause_family_yaml_includes_schema_optional_fields(service_name: str) -> None:
    services = _load_services_yaml()
    fields = set(services[service_name]["fields"])
    if service_name in PAUSE_TARGET_FIELDS:
        assert PAUSE_TARGET_FIELDS[service_name] in fields
    missing = PAUSE_OPTIONAL_FIELDS - fields
    assert not missing, f"{service_name} missing yaml fields: {sorted(missing)}"


def test_services_fixture_keys_match_yaml() -> None:
    yaml_services = _load_services_yaml()
    fixture = _load_services_fixture()
    assert set(fixture["services"]) == set(yaml_services)


@pytest.mark.parametrize("service_name", DIRECT_ENTITY_SERVICES)
def test_direct_entity_services_support_automations_and_input_booleans(service_name: str) -> None:
    domains = ["automation", "input_boolean"]
    yaml_domains = _load_services_yaml()[service_name]["fields"]["entity_id"]["selector"]["entity"]["domain"]
    fixture_domains = _load_services_fixture()["services"][service_name]["fields"]["entity_id"]["selector"]["entity"][
        "domain"
    ]
    assert yaml_domains == domains
    assert fixture_domains == domains


def test_pause_target_supports_direct_domains_while_discovery_stays_automation_only() -> None:
    services = _load_services_yaml()
    fixture = _load_services_fixture()
    assert services["pause"]["target"]["entity"] == [{"domain": ["automation", "input_boolean"]}]
    assert fixture["services"]["pause"]["target"]["entity"] == [{"domain": ["automation", "input_boolean"]}]
    assert "entity_id" not in services["pause"]["fields"]
    assert "entity_id" not in fixture["services"]["pause"]["fields"]
    assert services["pause_by_area"]["target"]["entity"] == [{"domain": "automation"}]
    assert services["pause_by_label"]["target"]["entity"] == [{"domain": "automation"}]


def test_resume_state_contract_is_exposed_only_on_direct_pause_service() -> None:
    """Resume-state choices belong to direct service calls, not card discovery flows."""
    expected_values = ["previous", "on", "off"]
    services = _load_services_yaml()
    field = services["pause"]["fields"]["resume_state"]
    fixture_field = _load_services_fixture()["services"]["pause"]["fields"]["resume_state"]
    translations = json.loads(TRANSLATIONS_PATH.read_text(encoding="utf-8"))

    assert PAUSE_SCHEMA({ATTR_ENTITY_ID: ["input_boolean.mode"], "minutes": 5})["resume_state"] == "previous"
    assert field["default"] == "previous"
    assert [option["value"] for option in field["selector"]["select"]["options"]] == expected_values
    assert [option["value"] for option in fixture_field["selector"]["select"]["options"]] == expected_values
    assert "resume_state" in translations["services"]["pause"]["fields"]
    assert "resume_state" not in services["pause_by_area"]["fields"]
    assert "resume_state" not in services["pause_by_label"]["fields"]


@pytest.mark.parametrize("service_name", PAUSE_FAMILY)
def test_services_fixture_pause_family_field_keys_match_yaml(service_name: str) -> None:
    yaml_fields = set(_load_services_yaml()[service_name]["fields"])
    fixture_fields = set(_load_services_fixture()["services"][service_name]["fields"])
    assert fixture_fields == yaml_fields


def test_frontend_callers_cover_service_names_except_ha_ui_only() -> None:
    frontend_names = _frontend_service_names()
    backend_names = set(SERVICE_NAMES)
    uncovered = backend_names - frontend_names - HA_UI_ONLY_SERVICES
    assert not uncovered, f"Frontend missing callers for: {sorted(uncovered)}"
    unexpected = frontend_names - backend_names
    assert not unexpected, f"Frontend calls unknown services: {sorted(unexpected)}"


# ---------------------------------------------------------------------------
# Task 2 — Card-shaped pause → HA bus → v1 sensor
# ---------------------------------------------------------------------------


async def _pause_and_read_sensor(hass: HomeAssistant, payload: dict[str, Any]):
    timer_unsub = MagicMock()
    with patch(
        "custom_components.autosnooze.application.pause.schedule_resume",
        side_effect=fake_resume_scheduler(timer_unsub),
    ):
        await hass.services.async_call(DOMAIN, "pause", payload, blocking=True)
        await hass.async_block_till_done()
    return hass.states.get(SENSOR_ENTITY_ID)


@pytest.fixture
async def paused_setup(contract_hass):
    """Loaded integration with one automation ready to snooze."""
    hass, turn_off, turn_on = contract_hass
    await setup_entry(hass)
    hass.states.async_set(ENTITY_ONE, "on", {"friendly_name": "Test Automation 1"})
    return hass, turn_off, turn_on


async def test_card_duration_payload_publishes_v1_sensor(paused_setup) -> None:
    hass, turn_off, _ = paused_setup
    payload = {
        ATTR_ENTITY_ID: [ENTITY_ONE],
        "days": 0,
        "hours": 1,
        "minutes": 0,
    }
    PAUSE_SCHEMA(payload)

    sensor = await _pause_and_read_sensor(hass, payload)
    _assert_v1_sensor(sensor, expected_paused_count=1, entity_id=ENTITY_ONE)
    turn_off.assert_awaited_once()
    assert hass.states.get(ENTITY_ONE).state == "off"


async def test_card_scheduled_resume_at_payload_immediate_pause_in_v1_sensor(paused_setup) -> None:
    hass, turn_off, _ = paused_setup
    resume_at = (dt_util.utcnow() + timedelta(hours=2)).isoformat()
    payload = {ATTR_ENTITY_ID: [ENTITY_ONE], "resume_at": resume_at}

    sensor = await _pause_and_read_sensor(hass, payload)
    _assert_v1_sensor(sensor, expected_paused_count=1, entity_id=ENTITY_ONE)
    assert sensor.attributes["paused"][ENTITY_ONE]["resume_at"] == resume_at
    turn_off.assert_awaited_once()
    assert hass.states.get(ENTITY_ONE).state == "off"


async def test_card_notification_payload_includes_trigger_in_v1_sensor(paused_setup) -> None:
    """Card sends duration split across hours/minutes (90m → 1h30m; raw minutes>59 fails schema)."""
    hass, _, _ = paused_setup
    payload = {
        ATTR_ENTITY_ID: [ENTITY_ONE],
        "days": 0,
        "hours": 1,
        "minutes": 30,
        "notification_trigger": "about_to_end",
        "notification_lead_minutes": 30,
    }
    PAUSE_SCHEMA(payload)

    sensor = await _pause_and_read_sensor(hass, payload)
    _assert_v1_sensor(
        sensor,
        expected_paused_count=1,
        entity_id=ENTITY_ONE,
        paused_checks={"notification_trigger": "about_to_end"},
    )


async def test_ha_ui_resume_preset_payload_publishes_v1_sensor(paused_setup) -> None:
    hass, turn_off, _ = paused_setup
    payload = {ATTR_ENTITY_ID: [ENTITY_ONE], "resume_preset": "end_of_day"}

    sensor = await _pause_and_read_sensor(hass, payload)
    _assert_v1_sensor(sensor, expected_paused_count=1, entity_id=ENTITY_ONE)
    turn_off.assert_awaited_once()


# ---------------------------------------------------------------------------
# Task 3 — Partial HA turn_off when entity missing from states
# ---------------------------------------------------------------------------


async def test_pause_skips_missing_entity_without_raising(contract_hass) -> None:
    hass, turn_off, _ = contract_hass
    await setup_entry(hass)
    existing = "automation.test_automation_1"
    missing = "automation.test_automation_2"
    hass.states.async_set(existing, "on", {"friendly_name": "Exists"})

    timer_unsub = MagicMock()
    with patch(
        "custom_components.autosnooze.application.pause.schedule_resume",
        side_effect=fake_resume_scheduler(timer_unsub),
    ):
        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: [existing, missing], "minutes": 5},
            blocking=True,
        )
        await hass.async_block_till_done()

    sensor = hass.states.get(SENSOR_ENTITY_ID)
    _assert_v1_sensor(sensor, expected_paused_count=1, entity_id=existing)
    assert missing not in sensor.attributes["paused"]
    assert hass.states.get(existing).state == "off"
    turn_off.assert_awaited_once()
