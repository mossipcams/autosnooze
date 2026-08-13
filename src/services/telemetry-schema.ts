type TelemetrySource = 'card' | 'service' | 'timer' | 'startup';

type Scalar = string | number | boolean;

type SnoozeStrategy =
  | 'duration'
  | 'resume_datetime'
  | 'resume_time'
  | 'end_of_day'
  | 'next_morning'
  | 'next_sunrise'
  | 'next_sunset'
  | 'scheduled_window';

type ErrorCode =
  | 'invalid_duration'
  | 'resume_time_past'
  | 'disable_after_resume'
  | 'confirmation_required'
  | 'save_failed'
  | 'notification_lead_too_long'
  | 'automation_state_failed'
  | 'not_automation'
  | 'invalid_resume_preset'
  | 'invalid_adjustment'
  | 'adjust_time_too_short'
  | 'unknown';

type NotificationTrigger = 'none' | 'start' | 'about_to_end' | 'end';
type FilterTab = 'all' | 'areas' | 'categories' | 'labels';

type WithSource = { source?: TelemetrySource };

export type ReportTelemetryInput =
  | ({ event: 'integration_active' } & WithSource)
  | ({ event: 'card_viewed'; card_type: 'full' | 'snoozed_only' } & WithSource)
  | ({ event: 'selection_feature_used'; properties: { target_count: Scalar } } & WithSource)
  | ({
      event: 'duration_option_selected';
      properties: {
        duration_minutes: Scalar;
      };
    } & WithSource)
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
        target_count: Scalar;
      };
    } & WithSource)
  | ({ event: 'snooze_ended'; properties: { reason: 'timer' | 'manual' } } & WithSource)
  | ({
      event: 'scheduled_snooze_cancelled';
      properties: {
        target_count: Scalar;
        minutes_before_start: Scalar;
      };
    } & WithSource)
  | ({ event: 'notification_used'; properties: { trigger: NotificationTrigger } } & WithSource)
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
        strategy?: Scalar;
        target_count: Scalar;
      };
    } & WithSource)
  | ({ event: 'confirmation_result'; properties: { target_count: Scalar } } & WithSource)
  | ({
      event: 'snooze_button_clicked';
      properties: {
        target_count: Scalar;
        schedule_mode: boolean;
        until_tomorrow: boolean;
      };
    } & WithSource)
  | ({ event: 'wake_clicked'; properties: { scope: 'one' | 'all' } } & WithSource)
  | ({ event: 'adjust_opened'; properties: { scope: 'one' | 'group' } } & WithSource)
  | ({
      event: 'adjust_option_selected';
      properties: {
        direction: 'extend' | 'shorten';
        delta_minutes: Scalar;
      };
    } & WithSource)
  | ({ event: 'scheduled_cancel_clicked'; properties: { target_count: Scalar } } & WithSource)
  | ({ event: 'filter_tab_selected'; properties: { tab: FilterTab } } & WithSource)
  | ({ event: 'hide_snoozed_toggled'; properties: { enabled: boolean } } & WithSource)
  | ({ event: 'schedule_mode_toggled'; properties: { enabled: boolean } } & WithSource)
  | ({ event: 'until_tomorrow_selected' } & WithSource)
  | ({ event: 'custom_duration_toggled'; properties: { enabled: boolean } } & WithSource)
  | ({
      event: 'notification_options_changed';
      properties: {
        trigger: NotificationTrigger;
        enabled: boolean;
        notification_lead_minutes: Scalar;
      };
    } & WithSource)
  | ({ event: 'confirmation_dismissed'; properties: { target_count: Scalar } } & WithSource);
