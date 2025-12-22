#!/bin/bash
# SessionStart hook for Claude Code web sessions
# Validates environment and runs linters/tests

set -e

echo "=== AutoSnooze SessionStart Hook ==="

# Check we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: Not in project root (package.json not found)"
    exit 1
fi

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install --silent
fi

# Run JavaScript linting
echo "Running ESLint..."
npm run lint

# Run JavaScript tests with coverage (enforces 70% threshold)
echo "Running JavaScript tests..."
npm run test:coverage

# Run Python linting (ruff)
if command -v ruff &> /dev/null; then
    echo "Running ruff (Python linter)..."
    ruff check custom_components/ tests/ --output-format=text
    ruff format --check custom_components/ tests/
else
    echo "WARN: ruff not installed, skipping Python linting"
fi

# Note: Python tests require pytest_homeassistant_custom_component
# which may not be available in all environments. Run manually if needed:
# pip install -r requirements_test.txt && pytest tests/ -v

echo "=== SessionStart checks passed ==="
