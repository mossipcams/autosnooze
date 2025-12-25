"""Fixtures for AutoSnooze tests."""

from __future__ import annotations

import os
from collections.abc import Generator
from dataclasses import dataclass
from datetime import timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.config_entries import ConfigEntry
from homeassistant.util import dt as dt_util
import homeassistant.components.http as http_module

# Set timezone for Home Assistant tests
os.environ.setdefault("TZ", "UTC")

# Import fixtures from pytest-homeassistant-custom-component
# These provide a properly mocked Home Assistant environment for testing
pytest_plugins = ["pytest_homeassistant_custom_component"]

# Patch StaticPathConfig for HA 2024.3.3 compatibility
# This class was added in a later version of Home Assistant
if not hasattr(http_module, "StaticPathConfig"):

    @dataclass
    class StaticPathConfig:
        """Stub for StaticPathConfig (added in HA 2024.4+)."""

        url_path: str
        path: str
        cache_headers: bool = True

    # Inject into the http module
    http_module.StaticPathConfig = StaticPathConfig

# Patch ConfigEntry to be subscriptable for HA 2024.3.3 compatibility
# In newer HA versions, ConfigEntry supports generic typing
if not hasattr(ConfigEntry, "__class_getitem__"):
    ConfigEntry.__class_getitem__ = classmethod(lambda cls, item: cls)

# Patch dt_util.get_default_time_zone for HA 2024.3.3 compatibility
if not hasattr(dt_util, "get_default_time_zone"):
    dt_util.get_default_time_zone = lambda: timezone.utc


@pytest.fixture
def mock_store() -> MagicMock:
    """Create a mock Home Assistant Store for testing persistence."""
    store = MagicMock()
    store.async_load = AsyncMock(return_value=None)
    store.async_save = AsyncMock(return_value=None)
    return store


@pytest.fixture
def mock_automation_entity() -> MagicMock:
    """Create a mock automation entity for testing."""
    entity = MagicMock()
    entity.entity_id = "automation.test_automation"
    entity.domain = "automation"
    entity.state = "on"
    entity.attributes = {"friendly_name": "Test Automation"}
    return entity


@pytest.fixture
def mock_hass_with_automations(hass: Any) -> Any:
    """Create a hass fixture with mock automation entities."""
    # Add mock states for automations
    hass.states.async_set(
        "automation.test_automation_1",
        "on",
        {"friendly_name": "Test Automation 1"},
    )
    hass.states.async_set(
        "automation.test_automation_2",
        "on",
        {"friendly_name": "Test Automation 2"},
    )
    return hass
