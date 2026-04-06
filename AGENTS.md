# Workflow

For any code change, follow this sequence:

## Step 1: Plan
- Break work into small tasks (5-15 min each)
- For each task, specify:
  * What test to write
  * What code to implement
  * How to verify it works
- Show the complete plan
- Stop and say: "Plan ready. Approve to proceed."
- Wait for approval

## Step 2: Execute with TDD
For each task after approval:
1. Write failing test -> run it -> show failure
2. Write minimal implementation -> run test -> show pass
3. Ask: "Task N done. Continue?" and wait for approval before moving on

## Architecture

All implementation, refactoring, and reviews must follow `architecture.md`.

- Treat `architecture.md` as the source of truth for module boundaries and dependency direction.
- Keep the repo aligned with the modular-monolith and slice architecture introduced in PR #329.
- Do not place orchestration in UI components when it belongs in feature or application modules.
- Do not introduce upward imports that violate the preferred layer flow described in `architecture.md`.
- Any intentional boundary exception should be treated as temporary and called out explicitly in the plan or review.

## Rules
- Never implement without a failing test first
- Never skip the approval step
- Never modify files in the `tests/` directory unless explicitly asked to
- Never delete or weaken test assertions
- When tests fail, fix the implementation, not the tests
