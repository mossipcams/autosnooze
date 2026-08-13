"""Classify conventional-commit PR titles for Release Please bump semantics."""

from __future__ import annotations

import os
import re
import sys

_ALLOWED_TYPES = frozenset(
    {
        "feat",
        "fix",
        "refactor",
        "chore",
        "docs",
        "test",
        "ci",
        "build",
        "perf",
        "style",
        "revert",
    }
)
_TITLE_RE = re.compile(r"^([a-z]+)(\([^)]+\))?(!)?: (.+)$")


def classify(title: str) -> str:
    """Return bump class for a conventional-commit PR title."""
    if not title or not title.strip():
        msg = "PR title must not be empty"
        raise ValueError(msg)

    first_line = title.split("\n", 1)[0]
    match = _TITLE_RE.match(first_line)
    if not match:
        msg = f"PR title must use conventional commits: {first_line!r}"
        raise ValueError(msg)

    commit_type, _scope, breaking, _subject = match.groups()
    if commit_type not in _ALLOWED_TYPES:
        msg = f"PR title type is not allowed: {commit_type!r}"
        raise ValueError(msg)
    if breaking:
        return "breaking-minor"
    if commit_type == "fix":
        return "patch"
    if commit_type == "feat":
        return "minor"
    return "none"


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    title = os.environ.get("PR_TITLE")
    if title is None and args:
        title = args[0]

    if title is None:
        print("PR title is required (set PR_TITLE or pass as argument)", file=sys.stderr)
        return 1

    try:
        print(classify(title))
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
