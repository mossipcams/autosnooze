"""Dependabot configuration contracts."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEPENDABOT_PATH = ROOT / ".github" / "dependabot.yml"


def test_dependabot_only_uses_labels_that_exist_on_the_repo() -> None:
    """Keep Dependabot from commenting that configured labels are missing."""
    config = DEPENDABOT_PATH.read_text(encoding="utf-8")

    assert '- "javascript"' not in config
    assert '- "python"' not in config
    assert '- "dependencies"' in config
    assert '- "github-actions"' in config
