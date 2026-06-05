"""Contract tests for resume-feature ownership boundaries."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
CARD_PATH = PROJECT_ROOT / "src" / "components" / "autosnooze-card.ts"
CARD_CONTROLLER_PATH = PROJECT_ROOT / "src" / "features" / "card-controller" / "index.ts"
RESUME_FEATURE_PATH = PROJECT_ROOT / "src" / "features" / "resume" / "index.ts"
SCHEDULED_SNOOZE_FEATURE_PATH = PROJECT_ROOT / "src" / "features" / "scheduled-snooze" / "index.ts"
ACTIONS_CONTROLLER_PATH = PROJECT_ROOT / "src" / "components" / "autosnooze-actions-controller.ts"


def test_card_delegates_resume_behavior_through_card_controller() -> None:
    """The card should bind events while its feature-owned controller composes resume workflows."""
    card_source = CARD_PATH.read_text(encoding="utf-8")
    controller_source = CARD_CONTROLLER_PATH.read_text(encoding="utf-8")

    assert "../features/card-controller/index.js" in card_source
    assert "../features/resume/index.js" not in card_source
    assert "runWakeFeature" in controller_source
    assert "runWakeAllFeature" in controller_source
    assert "runUndoFeature" in controller_source
    assert "Promise.allSettled" not in card_source
    assert "const undoCall" not in card_source


def test_legacy_actions_controller_removed() -> None:
    """The redundant actions-controller facade was removed; the card uses features directly."""
    assert not ACTIONS_CONTROLLER_PATH.exists()


def test_scheduled_snooze_feature_owns_adjust_and_cancel_actions() -> None:
    """Scheduled-snooze orchestration lives in the scheduled-snooze feature module."""
    source = SCHEDULED_SNOOZE_FEATURE_PATH.read_text(encoding="utf-8")

    assert "runAdjustFeature" in source
    assert "runAdjustActionFeature" in source
    assert "runCancelScheduledFeature" in source
    assert "runCancelScheduledActionFeature" in source
    assert "runWakeFeature" not in source
    assert "runWakeAllFeature" not in source
    assert "runUndoFeature" not in source


def test_resume_feature_remains_single_owner_of_undo_orchestration() -> None:
    """The resume feature should keep the actual undo orchestration implementation."""
    source = RESUME_FEATURE_PATH.read_text(encoding="utf-8")

    assert "Promise.allSettled" in source
    assert "const undoCall" in source
