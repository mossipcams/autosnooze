"""Explicit outcomes for application transitions."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class TransitionOutcome(StrEnum):
    """Outcome of one requested entity transition."""

    SUCCEEDED = "succeeded"
    REJECTED = "rejected"
    RETRYING = "retrying"
    RECOVERY_REQUIRED = "recovery_required"
    STALE_COMPENSATED = "stale_compensated"


class RecoveryStatus(StrEnum):
    """Durable recovery state for an entity."""

    NONE = "none"
    RETRYING = "retrying"
    REQUIRED = "required"


@dataclass(frozen=True, slots=True)
class EntityTransitionResult:
    """Result for one requested entity."""

    entity_id: str
    outcome: TransitionOutcome
    recovery_status: RecoveryStatus = RecoveryStatus.NONE
    message: str | None = None


@dataclass(frozen=True, slots=True)
class TransitionResult:
    """Ordered result for one application command."""

    command: str
    entities: tuple[EntityTransitionResult, ...]

    @property
    def complete_success(self) -> bool:
        return bool(self.entities) and all(entity.outcome is TransitionOutcome.SUCCEEDED for entity in self.entities)

    @property
    def partial_success(self) -> bool:
        succeeded = sum(entity.outcome is TransitionOutcome.SUCCEEDED for entity in self.entities)
        return 0 < succeeded < len(self.entities)
