"""Contract tests for resume-feature ownership boundaries."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
RESUME_FEATURE_PATH = PROJECT_ROOT / "src" / "features" / "resume" / "index.ts"
SCHEDULED_SNOOZE_FEATURE_PATH = PROJECT_ROOT / "src" / "features" / "scheduled-snooze" / "index.ts"
CARD_PATH = PROJECT_ROOT / "src" / "components" / "autosnooze-card.ts"
ACTIONS_CONTROLLER_PATH = PROJECT_ROOT / "src" / "components" / "autosnooze-actions-controller.ts"


def test_actions_controller_shim_removed() -> None:
    """Wake/undo orchestration should not live in a legacy controller shim."""
    assert not ACTIONS_CONTROLLER_PATH.exists()


def test_card_delegates_resume_behavior_to_resume_feature() -> None:
    """The card should import resume feature helpers instead of a controller shim."""
    source = CARD_PATH.read_text(encoding="utf-8")

    assert "../features/resume/index.js" in source
    assert "runUndoFeature" in source
    assert "autosnooze-actions-controller" not in source


def test_scheduled_snooze_feature_uses_snooze_service_seams() -> None:
    """Scheduled-snooze orchestration should call snooze services directly."""
    source = SCHEDULED_SNOOZE_FEATURE_PATH.read_text(encoding="utf-8")

    assert "../../services/snooze.js" in source
    assert "adjustSnooze" in source
    assert "runAdjustFeature" in source
    assert "runCancelScheduledFeature" in source
    assert "autosnooze-actions-controller" not in source
    assert "runUndoAction" not in source


def test_resume_feature_remains_single_owner_of_undo_orchestration() -> None:
    """The resume feature should keep the actual undo orchestration implementation."""
    source = RESUME_FEATURE_PATH.read_text(encoding="utf-8")

    assert "Promise.allSettled" in source
    assert "const undoCall" in source
