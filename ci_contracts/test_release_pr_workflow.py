"""Contract tests for release PR workflow artifact refresh."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
RELEASE_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "release-please.yml"


def test_release_workflow_refreshes_generated_card_artifact_for_release_prs() -> None:
    """Release PRs must rebuild and push the generated card artifact."""
    assert RELEASE_WORKFLOW_PATH.exists(), "release-please workflow is missing"

    content = RELEASE_WORKFLOW_PATH.read_text()

    required_snippets = [
        "id: release",
        "steps.release.outputs.prs_created",
        "steps.release.outputs.pr",
        "headBranchName",
        "npm ci",
        "npm run build",
        "custom_components/autosnooze/www/autosnooze-card.js",
        "git push",
    ]

    missing = [snippet for snippet in required_snippets if snippet not in content]
    assert not missing, (
        "Release workflow must rebuild and push the generated card artifact for release PRs. "
        f"Missing snippets: {missing}"
    )
