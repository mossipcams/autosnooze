# Critical Guardrail Plan (TDD)

## Goal
Add a default confirmation guardrail for critical automations without requiring the `autosnooze_confirm` label, while preserving existing label-based behavior.

## Scope
- Backend guardrail evaluation in `custom_components/autosnooze/services.py`
- Service/help text updates in `custom_components/autosnooze/services.yaml`
- Error/UX copy updates for confirm-required context
- Integration tests in `tests/test_integration.py`

## TDD Slices

1. Add failing tests for default critical detection
- `pause` requires `confirm=true` when automation is critical by name/id (no label)
- `pause_by_area` requires `confirm=true` when matched set includes a critical automation
- `pause_by_label` requires `confirm=true` when matched set includes a critical automation

2. Implement backend behavior
- Extend guardrail predicate to treat critical infrastructure keywords as requiring confirmation.
- Keep `autosnooze_confirm` as an explicit override that still requires confirmation.
- Preserve existing successful path when `confirm=true`.

3. Update service descriptions
- Clarify `confirm` now applies to labeled or critical automations.

4. Run targeted tests
- Run guardrail-focused integration tests first.
- Run broader related suites only if needed.

## Critical Detection Heuristic (initial)
Use case-insensitive keyword matching against automation `entity_id` and `friendly_name` from state.

Initial keyword set:
- `alarm`, `security`, `siren`, `lock`, `smoke`, `co`, `carbon monoxide`, `leak`, `flood`, `fire`, `gas`

Notes:
- This is intentionally conservative and user-visible through behavior.
- Future iteration can add explicit config overrides (`require_confirm_*`).
