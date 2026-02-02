"""Constants for AutoSnooze integration."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.helpers import config_validation as cv

_LOGGER = logging.getLogger(__name__)

DOMAIN = "autosnooze"
PLATFORMS = ["sensor"]
STORAGE_VERSION = 2

# Retry configuration for save operations
MAX_SAVE_RETRIES = 3
SAVE_RETRY_DELAYS = [0.1, 0.2, 0.4]  # Exponential backoff delays in seconds
TRANSIENT_ERRORS = (IOError, OSError)  # Errors that should trigger retry

# Read version from manifest for cache-busting
# Note: This is sync I/O at import time, but it's a small local file read.
# If this fails, we fall back to a default version.
MANIFEST_PATH = Path(__file__).parent / "manifest.json"
try:
    with open(MANIFEST_PATH, encoding="utf-8") as manifest_file:
        MANIFEST = json.load(manifest_file)
    VERSION = MANIFEST.get("version", "0.0.0")
except (OSError, json.JSONDecodeError) as err:
    _LOGGER.warning("Failed to read manifest.json: %s. Using default version.", err)
    MANIFEST = {}
    VERSION = "0.0.0"

# Card paths
CARD_PATH = Path(__file__).parent / "www" / "autosnooze-card.js"
CARD_URL = "/autosnooze-card.js"
CARD_URL_VERSIONED = f"/autosnooze-card.js?v={VERSION}"

# Service schemas
# FR-05: Duration Input - days, hours, minutes parameters
# Also supports date-based scheduling with disable_at/resume_at

# Shared duration and date options used by all pause schemas
# Upper bounds match services.yaml UI constraints for consistency
_DURATION_AND_DATE_SCHEMA = {
    vol.Optional("days", default=0): vol.All(cv.positive_int, vol.Range(max=365)),
    vol.Optional("hours", default=0): vol.All(cv.positive_int, vol.Range(max=23)),
    vol.Optional("minutes", default=0): vol.All(cv.positive_int, vol.Range(max=59)),
    vol.Optional("disable_at"): cv.datetime,
    vol.Optional("resume_at"): cv.datetime,
}

PAUSE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        **_DURATION_AND_DATE_SCHEMA,
    }
)

# FR-10: Early Wake Up
CANCEL_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
    }
)

# Pause by area
PAUSE_BY_AREA_SCHEMA = vol.Schema(
    {
        vol.Required("area_id"): vol.Any(cv.string, [cv.string]),
        **_DURATION_AND_DATE_SCHEMA,
    }
)

# Pause by label
PAUSE_BY_LABEL_SCHEMA = vol.Schema(
    {
        vol.Required("label_id"): vol.Any(cv.string, [cv.string]),
        **_DURATION_AND_DATE_SCHEMA,
    }
)

# Adjust snooze duration (positive adds time, negative subtracts)
ADJUST_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional("days", default=0): vol.All(int, vol.Range(min=-365, max=365)),
        vol.Optional("hours", default=0): vol.All(int, vol.Range(min=-23, max=23)),
        vol.Optional("minutes", default=0): vol.All(int, vol.Range(min=-59, max=59)),
    }
)

# Default duration presets for the card's quick-select buttons
# Each preset has a label (displayed on button) and minutes (duration value)
DEFAULT_DURATION_PRESETS: list[dict[str, str | int]] = [
    {"label": "30m", "minutes": 30},
    {"label": "1h", "minutes": 60},
    {"label": "12h", "minutes": 720},
    {"label": "1d", "minutes": 1440},
]

# Label-based filtering constants
# These labels control which automations appear in the AutoSnooze card
LABEL_INCLUDE_NAME = "autosnooze_include"
LABEL_EXCLUDE_NAME = "autosnooze_exclude"

LABEL_INCLUDE_CONFIG: dict[str, str] = {
    "name": LABEL_INCLUDE_NAME,
    "color": "green",
    "icon": "mdi:check-circle",
    "description": "Automations with this label will be shown in the AutoSnooze card (whitelist mode)",
}

LABEL_EXCLUDE_CONFIG: dict[str, str] = {
    "name": LABEL_EXCLUDE_NAME,
    "color": "red",
    "icon": "mdi:cancel",
    "description": "Automations with this label will be hidden from the AutoSnooze card",
}
