"""Contracts for keeping regression tests behavior-oriented."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent


def test_lovelace_registration_tests_do_not_parse_function_source() -> None:
    """Lovelace retry behavior tests should exercise behavior instead of source text."""
    offenders: list[str] = []
    brittle_markers = [
        'source.find("async def _async_register_lovelace_resource"',
        'source.find("async def async_setup_entry"',
        'source.find("async def _async_register_static_path"',
        '"retry_count < LOVELACE_REGISTER_MAX_RETRIES" in source',
        '"await _async_register_lovelace_resource(hass, retry_count + 1)" in source',
    ]

    for path in [
        PROJECT_ROOT / "tests" / "test_init.py",
        PROJECT_ROOT / "tests" / "test_frontend_registration.py",
    ]:
        source = path.read_text(encoding="utf-8")
        if any(marker in source for marker in brittle_markers):
            offenders.append(str(path.relative_to(PROJECT_ROOT)))

    assert offenders == [], (
        f"Lovelace registration retry tests should assert behavior, not implementation strings. Offenders: {offenders}"
    )


def test_card_controller_tests_do_not_access_private_card_members() -> None:
    """New controller tests should use public feature contracts instead of private card fields."""
    source = (PROJECT_ROOT / "tests" / "test_card_controller.spec.ts").read_text(encoding="utf-8")
    private_card_access = [
        "card._snooze(",
        "card._cancelScheduled(",
        "card._handleAdjustTimeEvent(",
        "card._adjustModalResumeAt",
        "card._labelRegistry",
    ]

    offenders = [marker for marker in private_card_access if marker in source]
    assert offenders == [], (
        "Card controller tests should assert controller/view-model behavior, not private card members. "
        f"Offenders: {offenders}"
    )


def test_frontend_architecture_tests_do_not_assert_dependency_cruiser_source_text() -> None:
    """Frontend architecture tests should validate parsed config behavior, not brittle source substrings."""
    offenders: list[str] = []
    brittle_markers = [
        "_dependency_cruiser_source",
        '_read(".dependency-cruiser.cjs")',
        "rule_pattern.search(source)",
        " in source",
    ]

    for path in [
        PROJECT_ROOT / "tests" / "test_architecture_feature_boundaries.py",
        PROJECT_ROOT / "tests" / "test_pr329_frontend_boundaries.py",
    ]:
        source = path.read_text(encoding="utf-8")
        if any(marker in source for marker in brittle_markers):
            offenders.append(str(path.relative_to(PROJECT_ROOT)))

    assert offenders == [], (
        "Frontend architecture tests should inspect parsed dependency-cruiser rules and import behavior. "
        f"Offenders: {offenders}"
    )
