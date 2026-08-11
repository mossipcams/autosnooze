import { z } from 'zod';

const sourceSchema = z.enum(['card', 'service', 'timer', 'startup']).optional();

const scalar = z.union([z.string(), z.number(), z.boolean()]);

const snoozeStrategySchema = z.enum([
  'duration',
  'resume_datetime',
  'resume_time',
  'end_of_day',
  'next_morning',
  'next_sunrise',
  'next_sunset',
  'scheduled_window',
]);

const errorCodeSchema = z.enum([
  'invalid_duration',
  'resume_time_past',
  'disable_after_resume',
  'confirmation_required',
  'save_failed',
  'notification_lead_too_long',
  'automation_state_failed',
  'unknown',
]);

export const reportTelemetryInputSchema = z.discriminatedUnion('event', [
  z
    .object({
      event: z.literal('integration_active'),
      source: sourceSchema,
      properties: z.object({}).strict().optional(),
    })
    .strict(),
  z
    .object({
      event: z.literal('card_viewed'),
      source: sourceSchema,
      card_type: z.enum(['full', 'snoozed_only']),
      properties: z.object({}).strict().optional(),
    })
    .strict(),
  z
    .object({
      event: z.literal('selection_feature_used'),
      source: sourceSchema,
      properties: z.object({ method: z.literal('all') }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('duration_option_selected'),
      source: sourceSchema,
      properties: z.object({ method: z.literal('preset') }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('snooze_created'),
      source: sourceSchema,
      properties: z
        .object({
          strategy: snoozeStrategySchema,
          input_method: scalar,
          duration_minutes: scalar,
          target_count: scalar,
          notification_trigger: scalar,
          notification_lead_minutes: scalar,
          confirmation_used: scalar,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('scheduled_snooze_created'),
      source: sourceSchema,
      properties: z
        .object({
          minutes_until_start: scalar,
          planned_duration_minutes: scalar,
          target_count: scalar,
          resume_local_hour: scalar,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('scheduled_snooze_started'),
      source: sourceSchema,
      properties: z
        .object({
          target_count: scalar,
          planned_duration_minutes: scalar,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('snooze_adjusted'),
      source: sourceSchema,
      properties: z
        .object({
          delta_minutes: scalar,
          direction: scalar,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('snooze_ended'),
      source: sourceSchema,
      properties: z.object({ reason: z.literal('expired') }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('scheduled_snooze_cancelled'),
      source: sourceSchema,
      properties: z
        .object({
          target_count: scalar,
          minutes_before_start: scalar,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('notification_used'),
      source: sourceSchema,
      properties: z.object({ trigger: z.literal('start') }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('notification_cleared'),
      source: sourceSchema,
      properties: z.object({ target_count: scalar }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('operation_failed'),
      source: sourceSchema,
      properties: z
        .object({
          operation: scalar,
          error_code: errorCodeSchema,
          strategy: scalar,
          target_count: scalar,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('confirmation_result'),
      source: sourceSchema,
      properties: z.object({ result: z.literal('confirmed') }).strict(),
    })
    .strict(),
]);

export type ReportTelemetryInput = z.infer<typeof reportTelemetryInputSchema>;
