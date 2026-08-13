"""Contract tests for PR title conventional-commit classification."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pr_title_classification import classify


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PR_TITLE_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "pr-title.yml"


@pytest.mark.parametrize(
    ("title", "expected"),
    [
        ("fix: accept null optionals", "patch"),
        ("feat: add telemetry", "minor"),
        ("feat!: rename pause API", "breaking-minor"),
        ("feat(card)!: breaking", "breaking-minor"),
        ("refactor: extract helper", "none"),
        ("chore(deps): bump foo", "none"),
        ("docs: fix typo", "none"),
        ("test: add coverage", "none"),
        ("ci: test HA floor", "none"),
        ("chore(main): release 0.2.30", "none"),
    ],
)
def test_classify_valid_titles(title: str, expected: str) -> None:
    assert classify(title) == expected


@pytest.mark.parametrize(
    "title",
    [
        "Fix the import",
        "",
        "wip: stuff",
    ],
)
def test_classify_invalid_titles(title: str) -> None:
    with pytest.raises(ValueError):
        classify(title)


def test_pr_title_workflow_exists_and_validates_titles() -> None:
    """PR title workflow must run the classifier on pull_request events."""
    assert PR_TITLE_WORKFLOW_PATH.exists(), "pr-title workflow is missing"

    content = PR_TITLE_WORKFLOW_PATH.read_text(encoding="utf-8")

    required_snippets = [
        "pull_request:",
        "opened",
        "edited",
        "synchronize",
        "reopened",
        "PR_TITLE: ${{ github.event.pull_request.title }}",
        "ci_contracts/pr_title_classification.py",
    ]

    missing = [snippet for snippet in required_snippets if snippet not in content]
    assert not missing, f"PR title workflow is missing required snippets: {missing}"
