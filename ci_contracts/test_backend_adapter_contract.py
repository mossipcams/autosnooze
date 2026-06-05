"""Contract tests for backend adapter module boundaries."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ROOT = PROJECT_ROOT / "custom_components" / "autosnooze"
ADAPTERS_ROOT = BACKEND_ROOT / "runtime" / "adapters"
PORTS_PATH = BACKEND_ROOT / "runtime" / "ports.py"


def test_runtime_ports_are_split_by_adapter_responsibility() -> None:
    """HA state, timer scheduling, and persistence must not share one mixed adapter module."""
    assert (ADAPTERS_ROOT / "automation_state.py").exists()
    assert (ADAPTERS_ROOT / "timer_scheduling.py").exists()
    assert (ADAPTERS_ROOT / "persistence.py").exists()

    automation_state = (ADAPTERS_ROOT / "automation_state.py").read_text(encoding="utf-8")
    timer_scheduling = (ADAPTERS_ROOT / "timer_scheduling.py").read_text(encoding="utf-8")
    persistence = (ADAPTERS_ROOT / "persistence.py").read_text(encoding="utf-8")

    assert "async_set_automation_state" in automation_state
    assert "schedule_resume" in timer_scheduling
    assert "async_save" in persistence

    assert "schedule_resume" not in automation_state
    assert "async_set_automation_state" not in timer_scheduling
    assert "schedule_disable" not in persistence

    ports_source = PORTS_PATH.read_text(encoding="utf-8")
    assert "Backward-compatible re-exports" in ports_source
    assert "def async_set_automation_state" not in ports_source
    assert "def schedule_resume" not in ports_source
    assert "def async_save" not in ports_source
