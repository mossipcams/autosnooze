# Retarget Tech Debt PR to Main

## Goal

Create a PR targeting `main` for the `ajax/tech-debt` work without disturbing the existing worktree scratch files.

## Task 1: Prepare isolated main-based branch

- Test to write: No product test; this is git setup only.
- Code to implement: Create a clean worktree/branch from `origin/main`, preserve the existing `ajax/tech-debt` branch, and keep local scratch files untouched.
- Verification: `git status --short --branch`, `git merge-base HEAD origin/main`, and branch/worktree listing show the new branch is based on `origin/main`.

## Task 2: Replay tech-debt changes with conflict analysis

- Test to write: No new test yet; first surface conflicts by applying/cherry-picking the existing tech-debt commit.
- Code to implement: Cherry-pick or 3-way apply commit `8df76ec` onto the new `origin/main` branch.
- Verification: Record conflicted files with `git diff --name-only --diff-filter=U`; inspect ancestor/PR/base stages for each conflicted file before resolving.

## Task 3: Resolve backend conflicts semantically

- Test to write: Use existing backend-focused tests as the guardrail; do not modify `tests/` unless explicitly approved.
- Code to implement: Resolve conflicts in Python application/service/coordinator files by preserving current-main notify-on-resume behavior and the tech-debt reductions where compatible.
- Verification: Run targeted symbol searches for touched backend functions and attempt `python3 -m pytest tests/ -q`; if blocked by missing Home Assistant, document the exact failure.

## Task 4: Resolve frontend conflicts semantically

- Test to write: Use existing frontend tests as the guardrail; do not add or weaken tests unless a specific unresolved behavior requires approval.
- Code to implement: Resolve conflicts in Lit components, feature modules, style modules, utility modules, and generated card bundle by preserving current-main features and the tech-debt reductions where compatible.
- Verification: Run `npm run typecheck`, `npm run typecheck:test`, `npm run lint:deps`, and `npm run test`.

## Task 5: Rebuild generated assets and commit

- Test to write: No new test; generated artifact refresh is validated by build and existing tests.
- Code to implement: Run the repo build if source changes require it, stage the resolved branch, and commit with a clear message.
- Verification: `git diff --check`, `git status --short`, `git diff --stat origin/main...HEAD`, and the verification commands from Task 4 pass or have documented environment-only failures.

## Task 6: Update PR to target main

- Test to write: No product test; this is GitHub PR metadata.
- Code to implement: Push the main-based branch and either retarget PR #412 to `main` or create a replacement PR targeting `main` if GitHub cannot retarget cleanly.
- Verification: `gh pr view --json baseRefName,headRefName,mergeStateStatus,statusCheckRollup,url` confirms base is `main`; CI/check state is reported.

## Safety Notes

- Do not rebase or rewrite the current dirty worktree in place.
- Keep the existing untracked scratch files untouched.
- Preserve valid behavior from both current `main` and the tech-debt branch; do not choose one side of conflicts mechanically.
- Produce a conflict impact report after resolution.
