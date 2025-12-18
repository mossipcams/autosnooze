"""Fixtures for AutoSnooze tests."""
from __future__ import annotations

from collections.abc import Generator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
import os

import pytest

# Set timezone for Home Assistant tests
os.environ.setdefault("TZ", "UTC")

# Import fixtures from pytest-homeassistant-custom-component
# These provide a properly mocked Home Assistant environment for testing
pytest_plugins = ["pytest_homeassistant_custom_component"]


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
