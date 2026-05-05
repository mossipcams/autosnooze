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
        "workflow_dispatch:",
        "push:",
        "branches:",
        "- main",
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


def test_release_workflow_reports_required_build_check_for_bot_authored_release_prs() -> None:
    """Release PRs created with GITHUB_TOKEN still need the required build check."""
    assert RELEASE_WORKFLOW_PATH.exists(), "release-please workflow is missing"

    content = RELEASE_WORKFLOW_PATH.read_text()

    required_snippets = [
        "actions: write",
        "gh workflow run build.yml --ref \"$BRANCH_NAME\"",
        "Generated artifact already up to date.",
        "Dispatch required Build workflow for release PR",
        "GH_TOKEN: ${{ github.token }}",
    ]

    missing = [snippet for snippet in required_snippets if snippet not in content]
    assert not missing, (
        "Release PR commits authored by github-actions[bot] do not automatically trigger pull_request "
        "workflows, so release-please must explicitly dispatch build.yml for the release PR branch. "
        f"Missing snippets: {missing}"
    )


def test_release_workflow_syncs_existing_release_pr_after_main_updates() -> None:
    """An already-open release PR must be kept current when later PRs merge."""
    assert RELEASE_WORKFLOW_PATH.exists(), "release-please workflow is missing"

    content = RELEASE_WORKFLOW_PATH.read_text()

    required_snippets = [
        "sync-existing-release-pr",
        "github.event_name == 'push'",
        "autorelease: pending",
        "gh pr list",
        "startsWith(steps.pr.outputs.branch, 'release-please--branches--main--components--')",
        "gh pr update-branch \"$PR_NUMBER\"",
        "gh workflow run build.yml --ref \"$BRANCH_NAME\"",
    ]

    missing = [snippet for snippet in required_snippets if snippet not in content]
    assert not missing, (
        "Release Please can leave an existing release PR branch stale when new non-release-note PRs "
        "merge into main. The release workflow must find the open Release Please PR, update its "
        "branch from main, and dispatch the required build check. "
        f"Missing snippets: {missing}"
    )


def test_synced_release_pr_refreshes_generated_artifact_after_branch_update() -> None:
    """A synced release PR must rebuild artifacts after pulling in newer main code."""
    assert RELEASE_WORKFLOW_PATH.exists(), "release-please workflow is missing"

    content = RELEASE_WORKFLOW_PATH.read_text()

    required_snippets = [
        "Checkout synced release PR branch",
        "Rebuild synced generated card artifact",
        "Commit synced generated card artifact",
        "Synced generated artifact already up to date.",
        "custom_components/autosnooze/www/autosnooze-card.js.map",
    ]

    missing = [snippet for snippet in required_snippets if snippet not in content]
    assert not missing, (
        "When a stale release PR branch is updated from main, generated frontend artifacts must be "
        "rebuilt on that updated branch before the required build check is dispatched. "
        f"Missing snippets: {missing}"
    )


def test_release_workflow_passes_repo_to_gh_before_checkout() -> None:
    """GitHub CLI calls before checkout cannot rely on local repository discovery."""
    assert RELEASE_WORKFLOW_PATH.exists(), "release-please workflow is missing"

    content = RELEASE_WORKFLOW_PATH.read_text()

    required_snippets = [
        "--repo \"$GITHUB_REPOSITORY\"",
        "gh pr list \\",
        "gh pr update-branch \"$PR_NUMBER\" --repo \"$GITHUB_REPOSITORY\"",
    ]

    missing = [snippet for snippet in required_snippets if snippet not in content]
    assert not missing, (
        "Release workflow jobs that run gh before actions/checkout must pass the repository "
        "explicitly, otherwise gh fails with 'not a git repository'. "
        f"Missing snippets: {missing}"
    )
