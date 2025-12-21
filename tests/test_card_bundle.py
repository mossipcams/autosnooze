"""Regression tests for autosnooze-card.js bundling.

Issue: Bare ES module imports break Home Assistant Lovelace cards
========================================================================

Root Cause:
- Bare ES module import (`from "lit"`) requires either bundling or a runtime import map
- Home Assistant doesn't guarantee `lit` is resolvable as a bare specifier
- When the import fails, it throws before code executes, halting Lovelace's resource chain
- This breaks all subsequent custom cards

Solution:
- Rollup bundles lit into the output JS file (using @rollup/plugin-node-resolve)
- CI/CD workflow runs `npm run build` to generate the bundled output
- The built file has no external dependencies to resolve at runtime

These tests verify the fix is properly implemented and won't regress.
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import pytest


# Paths
PROJECT_ROOT = Path(__file__).parent.parent
BUILT_CARD_PATH = PROJECT_ROOT / "custom_components" / "autosnooze" / "www" / "autosnooze-card.js"
SOURCE_CARD_PATH = PROJECT_ROOT / "src" / "autosnooze-card.js"
ROLLUP_CONFIG_PATH = PROJECT_ROOT / "rollup.config.mjs"
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
PACKAGE_LOCK_PATH = PROJECT_ROOT / "package-lock.json"
NODE_MODULES_PATH = PROJECT_ROOT / "node_modules"
CI_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows"


class TestBuildInfrastructureExists:
    """Tests that verify the build infrastructure is properly set up.

    These tests will FAIL if Rollup bundling is not implemented,
    serving as regression tests for the ES module import issue.
    """

    def test_rollup_config_exists(self) -> None:
        """Test that Rollup configuration file exists."""
        assert ROLLUP_CONFIG_PATH.exists(), (
            "REGRESSION: rollup.config.mjs not found. "
            "Rollup is required to bundle 'lit' and avoid bare ES module imports. "
            "Create rollup.config.mjs with @rollup/plugin-node-resolve."
        )

    def test_rollup_config_has_node_resolve_plugin(self) -> None:
        """Test that Rollup config uses @rollup/plugin-node-resolve.

        This plugin is essential - without it, Rollup won't bundle
        npm packages like 'lit' into the output.
        """
        if not ROLLUP_CONFIG_PATH.exists():
            pytest.skip("Rollup config not found")

        content = ROLLUP_CONFIG_PATH.read_text()

        has_node_resolve = "nodeResolve" in content or "@rollup/plugin-node-resolve" in content

        assert has_node_resolve, (
            "REGRESSION: Rollup config does not use @rollup/plugin-node-resolve. "
            "This plugin is required to bundle 'lit' into the output file. "
            "Add: import { nodeResolve } from '@rollup/plugin-node-resolve';"
        )

    def test_package_json_has_required_dependencies(self) -> None:
        """Test that package.json has all required build dependencies."""
        assert PACKAGE_JSON_PATH.exists(), "package.json not found"

        content = json.loads(PACKAGE_JSON_PATH.read_text())

        # Check for lit in dependencies
        deps = content.get("dependencies", {})
        assert "lit" in deps, "REGRESSION: 'lit' not in dependencies. Add lit to dependencies in package.json."

        # Check for rollup build tools in devDependencies
        dev_deps = content.get("devDependencies", {})
        required_dev_deps = ["rollup", "@rollup/plugin-node-resolve"]

        missing = [dep for dep in required_dev_deps if dep not in dev_deps]
        assert not missing, f"REGRESSION: Missing devDependencies: {missing}. These are required for bundling."

    def test_package_json_has_build_script(self) -> None:
        """Test that package.json has a build script that uses Rollup."""
        assert PACKAGE_JSON_PATH.exists(), "package.json not found"

        content = json.loads(PACKAGE_JSON_PATH.read_text())
        scripts = content.get("scripts", {})

        assert "build" in scripts, 'REGRESSION: No \'build\' script in package.json. Add: "build": "rollup -c"'

        assert "rollup" in scripts.get("build", ""), (
            "REGRESSION: Build script does not use rollup. The build script should run: rollup -c"
        )

    def test_ci_workflow_exists(self) -> None:
        """Test that a CI workflow exists to automate the build.

        Without CI, the built file can become stale or developers
        might forget to run the build before committing.
        """
        if not CI_WORKFLOW_PATH.exists():
            pytest.fail(
                "REGRESSION: No .github/workflows directory found. "
                "A CI workflow is needed to run 'npm run build' automatically. "
                "Create .github/workflows/build.yml to build on push/PR."
            )

        workflows = list(CI_WORKFLOW_PATH.glob("*.yml")) + list(CI_WORKFLOW_PATH.glob("*.yaml"))

        assert workflows, (
            "REGRESSION: No CI workflow files found in .github/workflows/. "
            "Create a workflow that runs 'npm install && npm run build'."
        )

        # Check if any workflow runs npm build
        build_workflow_found = False
        for workflow in workflows:
            content = workflow.read_text()
            if "npm run build" in content or "npm build" in content:
                build_workflow_found = True
                break

        assert build_workflow_found, (
            "REGRESSION: No CI workflow runs 'npm run build'. Add a step to run the build in your CI workflow."
        )


class TestSourceFileDocumentsBareImport:
    """Tests that document the source file has bare imports (proving bundling is needed)."""

    def test_source_file_exists(self) -> None:
        """Test that the source file exists."""
        assert SOURCE_CARD_PATH.exists(), (
            f"Source file not found at {SOURCE_CARD_PATH}. The source should be in src/autosnooze-card.js"
        )

    def test_source_file_has_bare_lit_import(self) -> None:
        """Test that source file has the bare 'lit' import.

        This test documents that the source file CANNOT be served directly
        to browsers - it MUST be bundled first. If this test fails because
        someone removed the lit import, the card likely won't work at all.
        """
        if not SOURCE_CARD_PATH.exists():
            pytest.skip("Source file not found")

        content = SOURCE_CARD_PATH.read_text()

        has_bare_import = 'from "lit"' in content or "from 'lit'" in content

        assert has_bare_import, (
            "Source file does not have bare 'lit' import. "
            "This is unexpected - lit should be imported for the card to work. "
            "If using a CDN import, update these tests accordingly."
        )


class TestBuiltFileIsProperlyBundled:
    """Tests that verify the built output file is correctly bundled.

    These are the critical regression tests - if the built file contains
    bare imports, it will break in Home Assistant.
    """

    def test_built_file_exists(self) -> None:
        """Test that the built card file exists."""
        assert BUILT_CARD_PATH.exists(), (
            f"REGRESSION: Built card file not found at {BUILT_CARD_PATH}. "
            "Run 'npm install && npm run build' to generate it. "
            "The CI workflow should do this automatically."
        )

    def test_built_file_no_bare_lit_import(self) -> None:
        """Test that built file does NOT contain bare 'lit' import.

        THIS IS THE CRITICAL REGRESSION TEST.

        If this test fails, the card will break Home Assistant's Lovelace
        and potentially all other custom cards loaded after it.
        """
        if not BUILT_CARD_PATH.exists():
            pytest.skip("Built file not found - run npm build first")

        content = BUILT_CARD_PATH.read_text()

        # Patterns that indicate unbundled bare imports
        bare_import_patterns = [
            (r'from\s+["\']lit["\']', 'from "lit"'),
            (r'from\s+["\']lit/', 'from "lit/..."'),
            (r'from\s+["\']lit-element["\']', 'from "lit-element"'),
            (r'from\s+["\']lit-html["\']', 'from "lit-html"'),
            (r'import\s+["\']lit["\']', 'import "lit"'),
        ]

        for pattern, description in bare_import_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            assert not matches, (
                f"REGRESSION: Built file contains bare import: {description}. "
                "This WILL break the card in Home Assistant. "
                "Ensure Rollup is bundling with @rollup/plugin-node-resolve. "
                f"Found: {matches[:3]}"  # Show first 3 matches
            )

    def test_built_file_no_unbundled_imports(self) -> None:
        """Test that built file has no ES import statements at top level.

        A properly bundled file should have all dependencies inlined,
        not imported from external modules.
        """
        if not BUILT_CARD_PATH.exists():
            pytest.skip("Built file not found - run npm build first")

        content = BUILT_CARD_PATH.read_text()

        # Check if file starts with import (after stripping whitespace/comments)
        stripped = content.lstrip()

        # Look for import at the very start of the file
        starts_with_import = stripped.startswith("import ")

        assert not starts_with_import, (
            "REGRESSION: Built file starts with 'import' statement. "
            "Top-level ES imports should be bundled inline by Rollup. "
            "Check that @rollup/plugin-node-resolve is configured correctly."
        )

    def test_built_file_contains_bundled_lit_code(self) -> None:
        """Test that built file contains lit library code bundled inline.

        This verifies that lit was actually bundled into the output,
        not just that bare imports were removed.
        """
        if not BUILT_CARD_PATH.exists():
            pytest.skip("Built file not found - run npm build first")

        content = BUILT_CARD_PATH.read_text()

        # Characteristic patterns from bundled lit code
        lit_indicators = [
            "_$litType$",  # lit-html internal marker
            "litHtmlVersions",  # lit-html version tracking
            "litElementVersions",  # lit-element version tracking
            "reactiveElement",  # Base class
            "shadowRoot",  # Shadow DOM usage
        ]

        found = [ind for ind in lit_indicators if ind.lower() in content.lower()]

        # Should find at least 2-3 of these indicators
        assert len(found) >= 2, (
            f"REGRESSION: Built file may not have lit properly bundled. "
            f"Only found {len(found)} of {len(lit_indicators)} expected lit patterns: {found}. "
            "Ensure @rollup/plugin-node-resolve is resolving the lit package."
        )

    def test_built_file_registers_custom_elements(self) -> None:
        """Test that built file properly registers the custom elements."""
        if not BUILT_CARD_PATH.exists():
            pytest.skip("Built file not found - run npm build first")

        content = BUILT_CARD_PATH.read_text()

        expected_elements = ["autosnooze-card", "autosnooze-card-editor"]

        for element in expected_elements:
            pattern = rf'customElements\.define\s*\(\s*["\']{re.escape(element)}["\']'
            assert re.search(pattern, content), (
                f"REGRESSION: Built file does not register '{element}' custom element. "
                "The card won't appear in Home Assistant without this registration."
            )

    def test_built_file_reasonable_size(self) -> None:
        """Test that built file is a reasonable size (bundled, not empty)."""
        if not BUILT_CARD_PATH.exists():
            pytest.skip("Built file not found - run npm build first")

        size = BUILT_CARD_PATH.stat().st_size

        # Bundled lit + card code should be at least 20KB
        # The minified lit library alone is ~15KB
        min_expected_size = 20_000

        assert size >= min_expected_size, (
            f"REGRESSION: Built file is only {size} bytes. "
            f"Expected at least {min_expected_size} bytes with bundled lit. "
            "The lit library may not be bundled correctly."
        )


class TestBuildProcessWorks:
    """Integration tests that verify the build process actually works."""

    @pytest.mark.slow
    def test_npm_build_succeeds(self) -> None:
        """Test that 'npm run build' completes successfully.

        This is a slow integration test that actually runs the build.
        Skip with: pytest -m "not slow"
        """
        # Check npm is available
        try:
            subprocess.run(
                ["npm", "--version"],
                check=True,
                capture_output=True,
                timeout=10,
            )
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            pytest.skip("npm not available")

        # Check if dependencies are installed
        if not NODE_MODULES_PATH.exists():
            # Try to install dependencies
            result = subprocess.run(
                ["npm", "install"],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
                timeout=120,
            )
            if result.returncode != 0:
                pytest.skip(
                    f"npm install failed: {result.stderr[:200]}. Install dependencies manually with 'npm install'."
                )

        # Run the build
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=60,
        )

        assert result.returncode == 0, (
            f"REGRESSION: npm run build failed with exit code {result.returncode}.\n"
            f"stdout: {result.stdout[:500]}\n"
            f"stderr: {result.stderr[:500]}"
        )

        # Verify output was created/updated
        assert BUILT_CARD_PATH.exists(), f"Build succeeded but output file was not created at {BUILT_CARD_PATH}"

    @pytest.mark.slow
    def test_fresh_build_has_no_bare_imports(self) -> None:
        """Test that a fresh build produces output with no bare imports.

        This runs the actual build and verifies the output, ensuring
        the build configuration is correct.
        """
        # Check npm is available
        try:
            subprocess.run(
                ["npm", "--version"],
                check=True,
                capture_output=True,
                timeout=10,
            )
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            pytest.skip("npm not available")

        if not NODE_MODULES_PATH.exists():
            pytest.skip("node_modules not installed - run 'npm install' first")

        # Run build
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode != 0:
            pytest.fail(f"Build failed: {result.stderr[:300]}")

        # Check the fresh output
        content = BUILT_CARD_PATH.read_text()

        assert 'from "lit"' not in content, "REGRESSION: Fresh build contains bare 'from \"lit\"' import"
        assert "from 'lit'" not in content, "REGRESSION: Fresh build contains bare \"from 'lit'\" import"


class TestCDNCacheBusting:
    """Tests that verify cache busting is properly implemented.

    Uses query parameter versioning (?v=VERSION) - the standard approach
    in the Home Assistant ecosystem used by HACS and most community cards.
    """

    CONST_PATH = PROJECT_ROOT / "custom_components" / "autosnooze" / "const.py"
    MANIFEST_PATH = PROJECT_ROOT / "custom_components" / "autosnooze" / "manifest.json"

    def test_card_url_uses_query_param_versioning(self) -> None:
        """Test that cache busting uses query param versioning.

        Query param versioning (?v=VERSION) is the Home Assistant standard:
        - Used by HACS (?hacstag=TIMESTAMP)
        - Used by card-mod, mini-graph-card, and most community cards
        - No URL path changes = no backwards compatibility issues

        Uses root-level path (like browser_mod) for reverse proxy compatibility.
        """
        content = self.CONST_PATH.read_text()

        # Base URL should be root-level (like browser_mod) for proxy compatibility
        assert 'CARD_URL = "/autosnooze-card.js"' in content, (
            "REGRESSION: CARD_URL should be root-level path like browser_mod uses. "
            "Version should be in query param via CARD_URL_VERSIONED."
        )

        # Should have versioned URL with query param
        assert 'CARD_URL_VERSIONED = f"/autosnooze-card.js?v={VERSION}"' in content, (
            "REGRESSION: CARD_URL_VERSIONED should use ?v= query param. "
            "This is the HA ecosystem standard for cache busting."
        )

    def test_card_url_uses_root_level_path(self) -> None:
        """Test that card URL uses root-level path for reverse proxy compatibility.

        Root-level paths (like /autosnooze-card.js) work reliably through
        reverse proxies because they're handled the same as other HA static
        assets. This matches the pattern used by browser_mod (/browser_mod.js).

        Subdirectory paths like /autosnooze/card.js may not be forwarded
        by some proxy configurations.

        This test prevents regression to a non-working URL path.
        """
        content = self.CONST_PATH.read_text()

        # Verify root-level path is used (no subdirectory)
        assert 'CARD_URL = "/autosnooze-card.js"' in content, (
            "REGRESSION: CARD_URL must use root-level path like browser_mod. "
            "Subdirectory paths may not work through reverse proxies."
        )

    def test_version_matches_across_files(self) -> None:
        """Test that version is consistent across manifest, init, and source."""
        manifest = json.loads(self.MANIFEST_PATH.read_text())
        manifest_version = manifest.get("version")

        source_content = SOURCE_CARD_PATH.read_text()
        source_match = re.search(r'CARD_VERSION\s*=\s*["\']([^"\']+)["\']', source_content)
        source_version = source_match.group(1) if source_match else None

        assert manifest_version == source_version, (
            f"Version mismatch: manifest.json has {manifest_version}, "
            f"source has {source_version}. These must match for cache busting."
        )

    def test_lovelace_resource_uses_versioned_url(self) -> None:
        """Test that Lovelace resource registration uses the versioned URL."""
        content = self.INIT_PATH.read_text()

        # The resource should use CARD_URL_VERSIONED (with query param)
        assert '"url": CARD_URL_VERSIONED' in content or "'url': CARD_URL_VERSIONED" in content, (
            "REGRESSION: Lovelace resource should use CARD_URL_VERSIONED (with ?v=). "
            "This ensures browsers fetch the new version on updates."
        )
