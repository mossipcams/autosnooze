"""Contract tests for resume-feature ownership boundaries."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
CARD_PATH = PROJECT_ROOT / "src" / "components" / "autosnooze-card.ts"
RESUME_FEATURE_PATH = PROJECT_ROOT / "src" / "features" / "resume" / "index.ts"
SCHEDULED_SNOOZE_FEATURE_PATH = PROJECT_ROOT / "src" / "features" / "scheduled-snooze" / "index.ts"
ACTIONS_CONTROLLER_PATH = PROJECT_ROOT / "src" / "components" / "autosnooze-actions-controller.ts"


def test_card_delegates_resume_behavior_to_resume_feature() -> None:
    """Wake/undo orchestration should live in the resume feature, not the card component."""
    source = CARD_PATH.read_text(encoding="utf-8")

    assert "../features/resume/index.js" in source
    assert "runWakeFeature" in source
    assert "runWakeAllFeature" in source
    assert "runUndoFeature" in source
    assert "Promise.allSettled" not in source
    assert "const undoCall" not in source


def test_legacy_actions_controller_removed() -> None:
    """The redundant actions-controller facade was removed; the card uses features directly."""
    assert not ACTIONS_CONTROLLER_PATH.exists()


def test_scheduled_snooze_feature_owns_adjust_and_cancel_actions() -> None:
    """Scheduled-snooze orchestration lives in the scheduled-snooze feature module."""
    source = SCHEDULED_SNOOZE_FEATURE_PATH.read_text(encoding="utf-8")

    assert "runAdjustFeature" in source
    assert "runCancelScheduledFeature" in source
    assert "runAdjustActionFeature" not in source
    assert "runCancelScheduledActionFeature" not in source
    assert "runWakeFeature" not in source
    assert "runWakeAllFeature" not in source
    assert "runUndoFeature" not in source


def test_frontend_features_do_not_export_duplicate_action_aliases() -> None:
    """Feature APIs should name each use case once."""
    feature_sources = [
        path.read_text(encoding="utf-8") for path in sorted((PROJECT_ROOT / "src" / "features").glob("*/index.ts"))
    ]
    assert all("ActionFeature" not in source for source in feature_sources)


def test_resume_feature_remains_single_owner_of_undo_orchestration() -> None:
    """The resume feature should keep the actual undo orchestration implementation."""
    source = RESUME_FEATURE_PATH.read_text(encoding="utf-8")

    assert "Promise.allSettled" in source
    assert "const undoCall" in source
