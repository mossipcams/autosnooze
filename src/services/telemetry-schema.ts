export type TelemetrySource = 'card' | 'service' | 'timer' | 'startup';

export type Scalar = string | number | boolean;

export type SnoozeStrategy =
  | 'duration'
  | 'resume_datetime'
  | 'resume_time'
  | 'end_of_day'
  | 'next_morning'
  | 'next_sunrise'
  | 'next_sunset'
  | 'scheduled_window';

export type ErrorCode =
  | 'invalid_duration'
  | 'resume_time_past'
  | 'disable_after_resume'
  | 'confirmation_required'
  | 'save_failed'
  | 'notification_lead_too_long'
  | 'automation_state_failed'
  | 'unknown';

type WithSource = { source?: TelemetrySource };

export type ReportTelemetryInput =
  | ({ event: 'integration_active' } & WithSource)
  | ({ event: 'card_viewed'; card_type: 'full' | 'snoozed_only' } & WithSource)
  | ({ event: 'selection_feature_used' } & WithSource)
  | ({ event: 'duration_option_selected' } & WithSource)
  | ({
      event: 'snooze_created';
      properties: {
        strategy: SnoozeStrategy;
        input_method: Scalar;
        duration_minutes: Scalar;
        target_count: Scalar;
        notification_trigger: Scalar;
        notification_lead_minutes: Scalar;
        confirmation_used: Scalar;
      };
    } & WithSource)
  | ({
      event: 'scheduled_snooze_created';
      properties: {
        minutes_until_start: Scalar;
        planned_duration_minutes: Scalar;
        target_count: Scalar;
        resume_local_hour: Scalar;
      };
    } & WithSource)
  | ({
      event: 'scheduled_snooze_started';
      properties: {
        target_count: Scalar;
        planned_duration_minutes: Scalar;
      };
    } & WithSource)
  | ({
      event: 'snooze_adjusted';
      properties: {
        delta_minutes: Scalar;
        direction: Scalar;
      };
    } & WithSource)
  | ({ event: 'snooze_ended' } & WithSource)
  | ({
      event: 'scheduled_snooze_cancelled';
      properties: {
        target_count: Scalar;
        minutes_before_start: Scalar;
      };
    } & WithSource)
  | ({ event: 'notification_used' } & WithSource)
  | ({
      event: 'notification_cleared';
      properties: {
        target_count: Scalar;
      };
    } & WithSource)
  | ({
      event: 'operation_failed';
      properties: {
        operation: Scalar;
        error_code: ErrorCode;
        strategy: Scalar;
        target_count: Scalar;
      };
    } & WithSource)
  | ({ event: 'confirmation_result' } & WithSource);
