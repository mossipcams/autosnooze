"""Regression tests for autosnooze-card.js bundling.

These tests address the issue where bare ES module imports (e.g., `from "lit"`)
break Home Assistant Lovelace cards because browsers cannot resolve bare module
specifiers without bundling or import maps.

Root Cause:
- Bare ES module import (`from "lit"`) requires either bundling or a runtime import map
- Home Assistant doesn't guarantee `lit` is resolvable as a bare specifier
- When the import fails, it throws before code executes, halting Lovelace's resource chain
- This breaks all subsequent custom cards

Solution:
- Rollup bundles lit into the output JS file (using @rollup/plugin-node-resolve)
- The built file has no external dependencies to resolve at runtime
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

import pytest


# Path to the built card file
BUILT_CARD_PATH = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "www" / "autosnooze-card.js"
SOURCE_CARD_PATH = Path(__file__).parent.parent / "src" / "autosnooze-card.js"
ROLLUP_CONFIG_PATH = Path(__file__).parent.parent / "rollup.config.mjs"
PACKAGE_JSON_PATH = Path(__file__).parent.parent / "package.json"


class TestNoBareModuleImports:
    """Tests to ensure built JS file has no bare module specifiers."""

    def test_built_file_exists(self) -> None:
        """Test that the built card file exists."""
        assert BUILT_CARD_PATH.exists(), (
            f"Built card file not found at {BUILT_CARD_PATH}. "
            "Run 'npm run build' to generate it."
        )

    def test_source_file_has_bare_lit_import(self) -> None:
        """Test that source file has bare lit import (proving we need bundling)."""
        if not SOURCE_CARD_PATH.exists():
            pytest.skip("Source file not found")

        content = SOURCE_CARD_PATH.read_text()

        # Source should have the bare import that needs bundling
        assert 'from "lit"' in content or "from 'lit'" in content, (
            "Source file should have bare 'lit' import. "
            "This test documents that bundling is required."
        )

    def test_built_file_no_bare_lit_import(self) -> None:
        """Test that built file does NOT contain bare 'lit' import.

        This is the critical regression test. If the build process fails to
        bundle lit, the card will break all Lovelace resources.
        """
        content = BUILT_CARD_PATH.read_text()

        # Check for various forms of bare lit imports that would break the card
        bare_import_patterns = [
            r'from\s*["\']lit["\']',           # from "lit" or from 'lit'
            r'from\s*["\']lit/',               # from "lit/..." subpath imports
            r'import\s*["\']lit["\']',         # import "lit"
            r'import\s*\(["\']lit["\']\)',     # dynamic import("lit")
        ]

        for pattern in bare_import_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            assert not matches, (
                f"Built file contains bare lit import: {matches}. "
                "This will break the card in Home Assistant. "
                "Ensure Rollup is bundling lit with @rollup/plugin-node-resolve."
            )

    def test_built_file_no_bare_lit_element_import(self) -> None:
        """Test that built file does NOT contain bare 'lit-element' import."""
        content = BUILT_CARD_PATH.read_text()

        bare_import_patterns = [
            r'from\s*["\']lit-element["\']',
            r'from\s*["\']lit-html["\']',
        ]

        for pattern in bare_import_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            assert not matches, (
                f"Built file contains bare lit-element/lit-html import: {matches}. "
                "This will break the card in Home Assistant."
            )

    def test_built_file_no_node_modules_paths(self) -> None:
        """Test that built file does NOT contain node_modules paths."""
        content = BUILT_CARD_PATH.read_text()

        # Should not have any references to node_modules
        assert "node_modules" not in content, (
            "Built file contains 'node_modules' reference. "
            "This indicates bundling may have failed."
        )

    def test_built_file_contains_lit_code(self) -> None:
        """Test that built file contains bundled lit library code.

        The presence of characteristic lit patterns indicates
        the library was successfully bundled inline.
        """
        content = BUILT_CARD_PATH.read_text()

        # These are characteristic patterns from bundled lit code
        # They indicate lit was successfully inlined
        lit_indicators = [
            "LitElement",
            "html",
            "css",
            "_$litType$",      # lit-html internal marker
            "shadowRoot",      # Used by LitElement
        ]

        found_indicators = [ind for ind in lit_indicators if ind in content]

        assert len(found_indicators) >= 3, (
            f"Built file may not have lit bundled properly. "
            f"Found only {len(found_indicators)} of {len(lit_indicators)} expected patterns: {found_indicators}. "
            "Check that @rollup/plugin-node-resolve is configured correctly."
        )

    def test_built_file_is_valid_javascript(self) -> None:
        """Test that built file is syntactically valid JavaScript.

        If bundling fails catastrophically, the output might be corrupt.
        """
        content = BUILT_CARD_PATH.read_text()

        # Basic sanity checks
        assert len(content) > 1000, (
            "Built file is suspiciously small. Bundling may have failed."
        )

        # Should not start with an import statement (those should be bundled)
        stripped = content.lstrip()
        assert not stripped.startswith("import "), (
            "Built file starts with 'import' statement. "
            "Top-level imports should be bundled inline by Rollup."
        )

        # Should contain our custom element definitions
        assert "autosnooze-card" in content, (
            "Built file does not contain 'autosnooze-card' custom element. "
            "The card code may not be included."
        )

    def test_built_file_registers_custom_elements(self) -> None:
        """Test that built file registers the expected custom elements."""
        content = BUILT_CARD_PATH.read_text()

        expected_elements = [
            "autosnooze-card",
            "autosnooze-card-editor",
        ]

        for element in expected_elements:
            # Check for customElements.define call
            pattern = rf'customElements\.define\s*\(\s*["\']{ element}["\']'
            assert re.search(pattern, content), (
                f"Built file does not register '{element}' custom element."
            )


class TestRollupConfiguration:
    """Tests for Rollup build configuration."""

    def test_rollup_config_exists(self) -> None:
        """Test that Rollup config file exists."""
        assert ROLLUP_CONFIG_PATH.exists(), (
            f"Rollup config not found at {ROLLUP_CONFIG_PATH}. "
            "A rollup.config.mjs file is required for bundling."
        )

    def test_rollup_config_uses_node_resolve(self) -> None:
        """Test that Rollup config uses node-resolve plugin.

        The @rollup/plugin-node-resolve plugin is essential for
        bundling npm packages like lit into the output.
        """
        content = ROLLUP_CONFIG_PATH.read_text()

        assert "nodeResolve" in content or "node-resolve" in content, (
            "Rollup config does not appear to use @rollup/plugin-node-resolve. "
            "This plugin is required to bundle 'lit' into the output."
        )

    def test_rollup_config_outputs_es_module(self) -> None:
        """Test that Rollup config outputs ES module format."""
        content = ROLLUP_CONFIG_PATH.read_text()

        # Should output ES format for browser compatibility
        assert "format:" in content and "'es'" in content or '"es"' in content, (
            "Rollup config should output format: 'es' for ES module output."
        )

    def test_rollup_config_correct_output_path(self) -> None:
        """Test that Rollup outputs to the correct location."""
        content = ROLLUP_CONFIG_PATH.read_text()

        expected_output = "custom_components/autosnooze/www/autosnooze-card.js"
        assert expected_output in content, (
            f"Rollup config should output to {expected_output}"
        )


class TestPackageJsonDependencies:
    """Tests for package.json build dependencies."""

    def test_package_json_exists(self) -> None:
        """Test that package.json exists."""
        assert PACKAGE_JSON_PATH.exists(), "package.json not found"

    def test_package_json_has_lit_dependency(self) -> None:
        """Test that lit is listed as a dependency."""
        import json
        content = json.loads(PACKAGE_JSON_PATH.read_text())

        dependencies = content.get("dependencies", {})
        assert "lit" in dependencies, (
            "package.json should have 'lit' in dependencies"
        )

    def test_package_json_has_rollup_dev_dependencies(self) -> None:
        """Test that required Rollup plugins are in devDependencies."""
        import json
        content = json.loads(PACKAGE_JSON_PATH.read_text())

        dev_deps = content.get("devDependencies", {})

        required_deps = [
            "rollup",
            "@rollup/plugin-node-resolve",
        ]

        for dep in required_deps:
            assert dep in dev_deps, (
                f"package.json should have '{dep}' in devDependencies. "
                "This is required for bundling."
            )

    def test_package_json_has_build_script(self) -> None:
        """Test that package.json has a build script."""
        import json
        content = json.loads(PACKAGE_JSON_PATH.read_text())

        scripts = content.get("scripts", {})
        assert "build" in scripts, (
            "package.json should have a 'build' script"
        )
        assert "rollup" in scripts["build"], (
            "build script should use rollup"
        )


class TestBuildProcess:
    """Tests for the actual build process."""

    @pytest.mark.slow
    def test_build_produces_valid_output(self, tmp_path: Path) -> None:
        """Test that running npm build produces valid output.

        This is a slow integration test that actually runs the build.
        """
        # Skip if npm is not available
        try:
            subprocess.run(
                ["npm", "--version"],
                check=True,
                capture_output=True,
                timeout=10,
            )
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            pytest.skip("npm not available")

        project_root = Path(__file__).parent.parent

        # Check if node_modules exists (dependencies installed)
        if not (project_root / "node_modules").exists():
            pytest.skip("node_modules not installed. Run 'npm install' first.")

        # Run the build
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=60,
        )

        assert result.returncode == 0, (
            f"Build failed with exit code {result.returncode}.\n"
            f"stdout: {result.stdout}\n"
            f"stderr: {result.stderr}"
        )

        # Verify output was created
        assert BUILT_CARD_PATH.exists(), (
            "Build succeeded but output file was not created"
        )

        # Run the main assertion tests on the fresh build
        content = BUILT_CARD_PATH.read_text()
        assert 'from "lit"' not in content, (
            "Fresh build contains bare lit import"
        )
        assert 'from \'lit\'' not in content, (
            "Fresh build contains bare lit import"
        )
