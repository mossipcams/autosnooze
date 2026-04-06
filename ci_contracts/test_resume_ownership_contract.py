"""Contract tests for resume-feature ownership boundaries."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ACTIONS_CONTROLLER_PATH = PROJECT_ROOT / "src" / "components" / "autosnooze-actions-controller.ts"
RESUME_FEATURE_PATH = PROJECT_ROOT / "src" / "features" / "resume" / "index.ts"
SCHEDULED_SNOOZE_FEATURE_PATH = PROJECT_ROOT / "src" / "features" / "scheduled-snooze" / "index.ts"


def test_actions_controller_delegates_resume_behavior_to_resume_feature() -> None:
    """Wake/undo orchestration should live in the resume feature, not the controller."""
    source = ACTIONS_CONTROLLER_PATH.read_text(encoding="utf-8")

    assert "../features/resume/index.js" in source
    assert "runWakeFeature" in source
    assert "runWakeAllFeature" in source
    assert "runUndoFeature" in source
    assert "Promise.allSettled" not in source
    assert "const undoCall" not in source


def test_scheduled_snooze_feature_only_uses_controller_for_adjust_and_cancel() -> None:
    """Scheduled-snooze orchestration may keep using the controller for legacy adjust/cancel helpers."""
    source = SCHEDULED_SNOOZE_FEATURE_PATH.read_text(encoding="utf-8")

    assert "runAdjustAction" in source
    assert "runCancelScheduledAction" in source
    assert "runWakeAction" not in source
    assert "runWakeAllAction" not in source
    assert "runUndoAction" not in source


def test_resume_feature_remains_single_owner_of_undo_orchestration() -> None:
    """The resume feature should keep the actual undo orchestration implementation."""
    source = RESUME_FEATURE_PATH.read_text(encoding="utf-8")

    assert "Promise.allSettled" in source
    assert "const undoCall" in source
