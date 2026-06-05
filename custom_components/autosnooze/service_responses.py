"""Translate application transition results into Home Assistant service responses."""

from __future__ import annotations

from typing import Any, TypedDict, cast

from homeassistant.core import ServiceResponse
from homeassistant.exceptions import ServiceValidationError

from .const import DOMAIN
from .domain.transitions import EntityTransitionResult, TransitionOutcome, TransitionResult

SERVICE_RESPONSE_SCHEMA_VERSION = 1


class RecoveryRequiredErrorPayload(TypedDict):
    translation_domain: str
    translation_key: str
    translation_placeholders: dict[str, str]


def command_status(result: TransitionResult) -> str:
    """Summarize a command result for service consumers."""
    if result.complete_success:
        return "complete_success"
    if result.partial_success:
        return "partial_success"
    if any(entity.outcome is TransitionOutcome.RETRYING for entity in result.entities):
        return "retrying"
    if any(entity.outcome is TransitionOutcome.RECOVERY_REQUIRED for entity in result.entities):
        return "recovery_required"
    return "failed"


def entity_result_to_dict(entity: EntityTransitionResult) -> dict[str, str | None]:
    """Serialize one entity transition for a service response."""
    payload: dict[str, str | None] = {
        "entity_id": entity.entity_id,
        "outcome": entity.outcome.value,
        "recovery_status": entity.recovery_status.value,
    }
    if entity.message is not None:
        payload["message"] = entity.message
    return payload


def transition_result_to_service_response(result: TransitionResult) -> ServiceResponse:
    """Build a versioned service response for pause/resume commands."""
    recovery_required_entities = [
        entity.entity_id for entity in result.entities if entity.outcome is TransitionOutcome.RECOVERY_REQUIRED
    ]
    response: dict[str, Any] = {
        "schema_version": SERVICE_RESPONSE_SCHEMA_VERSION,
        "command": result.command,
        "status": command_status(result),
        "complete_success": result.complete_success,
        "partial_success": result.partial_success,
        "entities": [entity_result_to_dict(entity) for entity in result.entities],
        "recovery_required_entities": recovery_required_entities,
    }
    if recovery_required_entities:
        response["error"] = recovery_required_error_payload(recovery_required_entities)
    return cast(ServiceResponse, response)


def recovery_required_error_payload(entity_ids: list[str]) -> RecoveryRequiredErrorPayload:
    """Build actionable recovery metadata for service consumers."""
    return {
        "translation_domain": DOMAIN,
        "translation_key": "recovery_required",
        "translation_placeholders": {
            "entity_ids": ", ".join(sorted(entity_ids)),
        },
    }


def raise_recovery_required_error(entity_ids: list[str]) -> None:
    """Raise a translated service error for recovery-required entities."""
    if not entity_ids:
        return
    placeholders = recovery_required_error_payload(entity_ids)["translation_placeholders"]
    raise ServiceValidationError(
        "One or more automations require manual recovery before they can be used again",
        translation_domain=DOMAIN,
        translation_key="recovery_required",
        translation_placeholders=placeholders,
    )
