"""Tests for extracted runtime state container."""

from __future__ import annotations

from unittest.mock import MagicMock


def test_runtime_state_module_exposes_automation_pause_data() -> None:
    """Runtime state module owns the runtime container."""
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    data = AutomationPauseData(store=MagicMock())
    assert data.paused == {}
    assert data.scheduled == {}
    assert data.unloaded is False
