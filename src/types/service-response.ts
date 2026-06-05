/** Versioned backend command service responses. */

export type CommandOutcome =
  | 'succeeded'
  | 'rejected'
  | 'retrying'
  | 'recovery_required'
  | 'stale_compensated';

export type CommandStatus =
  | 'complete_success'
  | 'partial_success'
  | 'retrying'
  | 'recovery_required'
  | 'failed';

export interface EntityCommandResult {
  entity_id: string;
  outcome: CommandOutcome;
  recovery_status: 'none' | 'retrying' | 'required';
  message?: string | null;
}

export interface CommandServiceResponse {
  schema_version: number;
  command: string;
  status: CommandStatus;
  complete_success: boolean;
  partial_success: boolean;
  entities: EntityCommandResult[];
  recovery_required_entities: string[];
  error?: {
    translation_domain: string;
    translation_key: string;
    translation_placeholders: Record<string, string>;
  };
}

export function isCommandServiceResponse(value: unknown): value is CommandServiceResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as CommandServiceResponse;
  return (
    typeof candidate.schema_version === 'number'
    && typeof candidate.command === 'string'
    && typeof candidate.status === 'string'
    && typeof candidate.complete_success === 'boolean'
    && typeof candidate.partial_success === 'boolean'
    && Array.isArray(candidate.entities)
    && Array.isArray(candidate.recovery_required_entities)
  );
}
