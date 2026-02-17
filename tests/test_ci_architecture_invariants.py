"""Architecture invariant checks for CI workflow wiring."""

from __future__ import annotations

from pathlib import Path


def _build_workflow_source() -> str:
    return (Path(__file__).parent.parent / ".github" / "workflows" / "build.yml").read_text(encoding="utf-8")


def test_build_workflow_enforces_generated_artifact_freshness() -> None:
    source = _build_workflow_source()
    assert "git diff --exit-code custom_components/autosnooze/www/autosnooze-card.js" in source


def test_build_workflow_runs_explicit_schema_contract_checks() -> None:
    source = _build_workflow_source()
    assert "tests/test_sensor_contract.py" in source
    assert "tests/test_paused_contract.spec.ts" in source


def test_orchestrator_module_is_not_present() -> None:
    orchestrator_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "orchestrator.py"
    assert not orchestrator_path.exists()


def test_domain_events_module_is_not_present() -> None:
    events_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "domain" / "events.py"
    assert not events_path.exists()


def test_domain_state_module_is_not_present() -> None:
    state_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "domain" / "state.py"
    assert not state_path.exists()


def test_repository_adapter_module_is_not_present() -> None:
    repository_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "repository.py"
    assert not repository_path.exists()


def test_scheduler_adapter_module_is_not_present() -> None:
    scheduler_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "scheduler.py"
    assert not scheduler_path.exists()
