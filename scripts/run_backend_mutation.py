#!/usr/bin/env python3
"""Run backend mutmut mutants without mutmut's forked pytest worker."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil
from subprocess import DEVNULL, PIPE, TimeoutExpired, run
import sys
from time import monotonic
from typing import Iterable


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HA_PYTEST = Path("/Users/matt/Desktop/Projects/autodoctor/venv_test/bin/pytest")
DEFAULT_HA_SITE_PACKAGES = Path("/Users/matt/Desktop/Projects/autodoctor/venv_test/lib/python3.14/site-packages")
SOURCE_INSPECTION_EXCLUSION = "not TestLovelaceResourceSafety"
MUTATION_TARGET_PATHS = (
    "custom_components/autosnooze/application/pause.py",
    "custom_components/autosnooze/application/resume.py",
    "custom_components/autosnooze/application/scheduled.py",
)

STATUS_KILLED = "killed"
STATUS_SURVIVED = "survived"
STATUS_NO_TESTS = "no tests"
STATUS_TIMEOUT = "timeout"
STATUS_CRASHED = "crashed"

MUTMUT_EXIT_CODES = {
    STATUS_KILLED: 1,
    STATUS_SURVIVED: 0,
    STATUS_NO_TESTS: 33,
    STATUS_TIMEOUT: 36,
    STATUS_CRASHED: -11,
}


def _find_mutmut_python() -> Path | None:
    mutmut_path = shutil.which("mutmut")
    if not mutmut_path:
        return None

    first_line = Path(mutmut_path).read_text(encoding="utf-8").splitlines()[0]
    if not first_line.startswith("#!"):
        return None
    python_path = Path(first_line[2:].strip())
    return python_path if python_path.exists() else None


def _ensure_mutmut_importable() -> None:
    try:
        import mutmut.__main__  # noqa: F401
    except ModuleNotFoundError:
        if os.environ.get("AUTOSNOOZE_MUTATION_REEXEC") == "1":
            raise

        mutmut_python = _find_mutmut_python()
        if mutmut_python is None:
            raise SystemExit("mutmut is not importable and no mutmut executable with a Python shebang was found")

        env = os.environ.copy()
        env["AUTOSNOOZE_MUTATION_REEXEC"] = "1"
        os.execve(mutmut_python, [str(mutmut_python), str(Path(__file__)), *sys.argv[1:]], env)


def _add_import_path(path: Path) -> None:
    if path.exists():
        path_text = str(path)
        if path_text not in sys.path:
            sys.path.insert(0, path_text)


def _load_mutmut(ha_site_packages: Path):
    _add_import_path(ha_site_packages)
    _ensure_mutmut_importable()

    import mutmut.__main__ as mutmut_main

    return mutmut_main


def _configure_mutmut(mutmut_main, exclude_source_inspection_tests: bool) -> None:
    mutmut_main.ensure_config_loaded()
    if exclude_source_inspection_tests:
        args = mutmut_main.mutmut.config.pytest_add_cli_args
        exclusion = ["-k", SOURCE_INSPECTION_EXCLUSION]
        if exclusion != args[:2]:
            mutmut_main.mutmut.config.pytest_add_cli_args = exclusion + args


def _bootstrap_mutants(mutmut_main, max_children: int, refresh_stats: bool) -> None:
    os.environ["MUTANT_UNDER_TEST"] = "mutant_generation"
    (PROJECT_ROOT / "mutants").mkdir(exist_ok=True)

    mutmut_main.copy_src_dir()
    mutmut_main.copy_also_copy_files()
    mutmut_main.setup_source_paths()
    mutmut_main.store_lines_covered_by_tests()
    mutmut_main.create_mutants(max_children)

    stats_path = PROJECT_ROOT / "mutants" / "mutmut-stats.json"
    if refresh_stats and stats_path.exists():
        stats_path.unlink()

    runner = mutmut_main.PytestRunner()
    runner.prepare_main_test_run()
    mutmut_main.collect_or_load_stats(runner)


def _pytest_command(pytest_path: Path, tests: Iterable[str], exclude_source_inspection_tests: bool) -> list[str]:
    command = [str(pytest_path), "--rootdir=.", "--tb=short", "-x", "-q"]
    if exclude_source_inspection_tests:
        command += ["-k", SOURCE_INSPECTION_EXCLUSION]
    command += sorted(tests)
    return command


def _mutation_env(mutant_name: str, ha_site_packages: Path, mutmut_main) -> dict[str, str]:
    env = os.environ.copy()
    env["MUTANT_UNDER_TEST"] = mutant_name

    mutmut_site_packages = str(Path(mutmut_main.__file__).resolve().parents[1])
    python_path_parts = [
        mutmut_site_packages,
        str(ha_site_packages),
        env.get("PYTHONPATH", ""),
    ]
    env["PYTHONPATH"] = os.pathsep.join(part for part in python_path_parts if part)
    return env


def _classify_return_code(return_code: int) -> str:
    if return_code == 0:
        return STATUS_SURVIVED
    if return_code == 5:
        return STATUS_NO_TESTS
    if return_code < 0:
        return STATUS_CRASHED
    return STATUS_KILLED


def _tests_for_mutant(mutmut_main, mutant_name: str) -> set[str]:
    normalized_name = mutant_name.replace("__init__.", "")
    mangled_name = mutmut_main.mangled_name_from_mutant_name(normalized_name)
    return set(mutmut_main.mutmut.tests_by_mangled_function_name.get(mangled_name, set()))


def _estimated_timeout(mutmut_main, tests: set[str]) -> float:
    duration = sum(mutmut_main.mutmut.duration_by_test.get(test_name, 0) for test_name in tests)
    return max(10.0, (duration + 1.0) * 30.0)


def _record_result(mutant_data, mutant_name: str, status: str, duration: float) -> None:
    mutant_data.exit_code_by_key[mutant_name] = MUTMUT_EXIT_CODES[status]
    mutant_data.durations_by_key[mutant_name] = duration
    mutant_data.save()


def _run_mutant(
    *,
    mutmut_main,
    mutant_data,
    mutant_name: str,
    pytest_path: Path,
    ha_site_packages: Path,
    exclude_source_inspection_tests: bool,
) -> str:
    tests = _tests_for_mutant(mutmut_main, mutant_name)
    if not tests:
        _record_result(mutant_data, mutant_name, STATUS_NO_TESTS, 0.0)
        return STATUS_NO_TESTS

    command = _pytest_command(pytest_path, tests, exclude_source_inspection_tests)
    env = _mutation_env(mutant_name, ha_site_packages, mutmut_main)
    started_at = monotonic()
    try:
        result = run(
            command,
            cwd=PROJECT_ROOT / "mutants",
            env=env,
            stdout=PIPE,
            stderr=PIPE,
            text=True,
            timeout=_estimated_timeout(mutmut_main, tests),
            check=False,
        )
    except TimeoutExpired:
        status = STATUS_TIMEOUT
    else:
        status = _classify_return_code(result.returncode)

    _record_result(mutant_data, mutant_name, status, monotonic() - started_at)
    return status


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mutants", nargs="*", help="Optional mutmut names or glob patterns to run")
    parser.add_argument("--max-children", type=int, default=8, help="Parallelism for mutmut generation")
    parser.add_argument("--limit", type=int, help="Run only the first N matching mutants")
    parser.add_argument(
        "--pytest",
        type=Path,
        default=Path(os.environ.get("AUTOSNOOZE_HA_PYTEST", DEFAULT_HA_PYTEST)),
        help="pytest executable with Home Assistant test dependencies",
    )
    parser.add_argument(
        "--ha-site-packages",
        type=Path,
        default=Path(os.environ.get("AUTOSNOOZE_HA_SITE_PACKAGES", DEFAULT_HA_SITE_PACKAGES)),
        help="site-packages path containing Home Assistant test dependencies",
    )
    parser.add_argument(
        "--include-source-inspection-tests",
        action="store_true",
        help="Do not exclude source-text tests that inspect mutmut's generated source copy",
    )
    parser.add_argument(
        "--reuse-stats",
        action="store_true",
        help="Reuse mutants/mutmut-stats.json instead of refreshing stats",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    missing_targets = [path for path in MUTATION_TARGET_PATHS if not (PROJECT_ROOT / path).exists()]
    if missing_targets:
        raise SystemExit(f"mutation target paths not found: {missing_targets}")
    if not args.pytest.exists():
        raise SystemExit(f"pytest executable not found: {args.pytest}")
    if not args.ha_site_packages.exists():
        raise SystemExit(f"Home Assistant site-packages not found: {args.ha_site_packages}")

    os.chdir(PROJECT_ROOT)
    exclude_source_inspection_tests = not args.include_source_inspection_tests
    mutmut_main = _load_mutmut(args.ha_site_packages)
    _configure_mutmut(mutmut_main, exclude_source_inspection_tests)
    _bootstrap_mutants(mutmut_main, args.max_children, refresh_stats=not args.reuse_stats)

    mutants, _source_file_mutation_data_by_path = mutmut_main.collect_source_file_mutation_data(
        mutant_names=args.mutants
    )
    if args.limit is not None:
        mutants = mutants[: args.limit]

    counts = {
        STATUS_KILLED: 0,
        STATUS_SURVIVED: 0,
        STATUS_NO_TESTS: 0,
        STATUS_TIMEOUT: 0,
        STATUS_CRASHED: 0,
    }
    for index, (mutant_data, mutant_name, _previous_result) in enumerate(mutants, start=1):
        status = _run_mutant(
            mutmut_main=mutmut_main,
            mutant_data=mutant_data,
            mutant_name=mutant_name,
            pytest_path=args.pytest,
            ha_site_packages=args.ha_site_packages,
            exclude_source_inspection_tests=exclude_source_inspection_tests,
        )
        counts[status] += 1
        print(f"{index}/{len(mutants)} {status}: {mutant_name}", flush=True)

    print("Backend mutation summary")
    for status, count in counts.items():
        print(f"{status}: {count}")

    return 1 if counts[STATUS_SURVIVED] or counts[STATUS_TIMEOUT] or counts[STATUS_CRASHED] else 0


if __name__ == "__main__":
    raise SystemExit(main())
