"""Frontend resource registration adapter for AutoSnooze."""

from __future__ import annotations

import asyncio
import logging

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from ..const import CARD_PATH, CARD_URL, CARD_URL_VERSIONED, VERSION

_LOGGER = logging.getLogger(__name__)

# Retry configuration for Lovelace resource registration.
# Lovelace may not be fully initialized when homeassistant_started fires.
LOVELACE_REGISTER_MAX_RETRIES = 3
LOVELACE_REGISTER_RETRY_DELAY = 2  # seconds


async def _async_retry_or_fail(
    retry_count: int,
    condition_name: str,
    log_context: str = "",
) -> bool:
    """Handle retry logic for Lovelace registration.

    Returns True if should retry, False if retries exhausted.
    """
    if retry_count < LOVELACE_REGISTER_MAX_RETRIES:
        context = f" ({log_context})" if log_context else ""
        _LOGGER.debug(
            "%s%s, retrying in %ds (attempt %d/%d)",
            condition_name,
            context,
            LOVELACE_REGISTER_RETRY_DELAY,
            retry_count + 1,
            LOVELACE_REGISTER_MAX_RETRIES,
        )
        await asyncio.sleep(LOVELACE_REGISTER_RETRY_DELAY)
        return True
    return False


async def _async_register_static_path(hass: HomeAssistant) -> None:
    """Register static paths to serve the JS file.

    cache_headers=False prevents iOS WebView from caching the file for 31 days.
    """
    try:
        await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(CARD_PATH), cache_headers=False)])
        _LOGGER.debug("Registered static path: %s", CARD_URL)
    except RuntimeError:
        # Path already registered (happens on integration reload).
        pass


async def _async_register_lovelace_resource(
    hass: HomeAssistant,
    retry_count: int = 0,
) -> None:
    """Register the card as a Lovelace resource."""
    lovelace_data = hass.data.get("lovelace")
    if lovelace_data is None:
        if await _async_retry_or_fail(retry_count, "Lovelace not initialized yet"):
            return await _async_register_lovelace_resource(hass, retry_count + 1)

        _LOGGER.warning(
            "Could not auto-register card: Lovelace not initialized after %d retries. "
            "Add resource manually: Settings -> Dashboards -> Resources -> %s (module)",
            LOVELACE_REGISTER_MAX_RETRIES,
            CARD_URL_VERSIONED,
        )
        return

    lovelace_mode = getattr(lovelace_data, "mode", None)
    if lovelace_mode is None and hasattr(lovelace_data, "get"):
        lovelace_mode = lovelace_data.get("mode")
    _LOGGER.debug("Lovelace mode detected: %s", lovelace_mode)

    resources = getattr(lovelace_data, "resources", None)
    if resources is None:
        resources = lovelace_data.get("resources") if hasattr(lovelace_data, "get") else None

    if resources is None:
        if await _async_retry_or_fail(
            retry_count,
            "Lovelace resources not available yet",
            f"mode={lovelace_mode}",
        ):
            return await _async_register_lovelace_resource(hass, retry_count + 1)

        _LOGGER.warning(
            "Could not auto-register card: Lovelace in YAML mode (mode=%s). "
            "Add to configuration.yaml: lovelace: resources: [{url: %s, type: module}]",
            lovelace_mode,
            CARD_URL_VERSIONED,
        )
        return

    if not hasattr(resources, "async_create_item") or not hasattr(resources, "async_items"):
        _LOGGER.warning(
            "Could not auto-register card: Lovelace resources API not available (mode=%s). "
            "Add resource manually: Settings -> Dashboards -> Resources -> %s (module)",
            lovelace_mode,
            CARD_URL_VERSIONED,
        )
        return

    existing_resource = None
    for resource in resources.async_items():
        url = resource.get("url", "")
        if url.startswith(CARD_URL):
            existing_resource = resource
            break

    if existing_resource:
        existing_resource_type = existing_resource.get("type", existing_resource.get("res_type", "module"))
        if existing_resource.get("url") != CARD_URL_VERSIONED or existing_resource_type != "module":
            try:
                await resources.async_update_item(
                    existing_resource["id"],
                    {"url": CARD_URL_VERSIONED, "res_type": "module"},
                )
                _LOGGER.info("Updated AutoSnooze card resource to v%s", VERSION)
            except Exception as err:
                _LOGGER.warning("Failed to update Lovelace resource: %s", err)
        else:
            _LOGGER.debug("AutoSnooze card already registered with current version")
        return

    try:
        _LOGGER.debug("Creating new resource: %s", CARD_URL_VERSIONED)
        await resources.async_create_item({"url": CARD_URL_VERSIONED, "res_type": "module"})
        _LOGGER.info("Registered AutoSnooze card as Lovelace resource (v%s)", VERSION)
    except Exception as err:
        _LOGGER.warning("Failed to register Lovelace resource: %s", err)
