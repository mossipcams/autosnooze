/**
 * Card controller: owns registry loading, server snapshots, command orchestration,
 * confirmation/modal workflows, and declarative status messages for the main card.
 */

import {
  DEFAULT_NOTIFICATION_LEAD_MINUTES,
  DEFAULT_SNOOZE_MINUTES,
  UI_TIMING,
} from '../../constants/index.js';
import { localize } from '../../localization/localize.js';
import { createCardStore } from '../../state/card-store.js';
import type { AutomationItem, NotificationTrigger, ParsedDuration, PauseGroup } from '../../types/automation.js';
import type { AutoSnoozeCardConfig } from '../../types/card.js';
import type {
  HassCategory,
  HassEntities,
  HassEntityRegistryEntry,
  HassLabel,
  HomeAssistant,
  PausedAutomationAttribute,
  ScheduledSnoozeAttribute,
} from '../../types/hass.js';
import { hapticFeedback } from '../../utils/haptic.js';
import { formatDateTime, formatDuration } from '../../utils/time-formatting.js';
import { minutesToDuration } from '../../utils/duration-parsing.js';
import { invalidateRegistryCaches } from '../../services/registry.js';
import {
  createAdjustModalState,
  createClosedAdjustModalState,
  createScheduleModeState,
  fetchCardCategoryRegistry,
  fetchCardEntityRegistry,
  fetchCardLabelRegistry,
  getCardPausedSnapshot,
  isCardSnoozeSensorAvailable,
  loadCardLastDuration,
  loadCardRecentSnoozeIds,
  SNOOZE_SENSOR_ENTITY_ID,
  type LastDurationData,
} from '../card-shell/index.js';
import { getAutomations } from '../automation-list/index.js';
import { requiresPauseConfirmation, runPauseFeature } from '../pause/index.js';
import {
  runClearNotificationFeature,
  runUndoFeature,
  runWakeAllFeature,
  runWakeFeature,
} from '../resume/index.js';
import {
  runAdjustFeature,
  runCancelScheduledFeature,
  validateScheduledPauseInput,
  type ScheduledPauseValidationErrorCode,
} from '../scheduled-snooze/index.js';

export type { ScheduledPauseValidationErrorCode };

export interface CardToastState {
  message: string;
  showUndo?: boolean;
  undoToken?: number;
  onUndo?: () => void;
}

export interface CardAdjustModalState {
  open: boolean;
  entityId: string;
  friendlyName: string;
  resumeAt: string;
  entityIds: string[];
  friendlyNames: string[];
}

export interface CardServerSnapshot {
  paused: Record<string, PausedAutomationAttribute>;
  scheduled: Record<string, ScheduledSnoozeAttribute>;
  groups: PauseGroup[];
  pausedCount: number;
  scheduledCount: number;
  sensorAvailable: boolean;
}

export interface CardLocalUiState {
  selected: string[];
  durationMs: number;
  customDuration: ParsedDuration;
  customDurationInput: string;
  loading: boolean;
  pendingActions: string[];
  scheduleMode: boolean;
  notificationsEnabled: boolean;
  notificationTrigger: Exclude<NotificationTrigger, 'none'>;
  notificationLeadMinutes: number;
  disableAtDate: string;
  disableAtTime: string;
  resumeAtDate: string;
  resumeAtTime: string;
  showCustomInput: boolean;
  lastDuration: LastDurationData | null;
  recentSnoozeIds: string[];
  guardrailConfirmOpen: boolean;
}

export interface CardRegistryState {
  labels: Record<string, HassLabel>;
  categories: Record<string, HassCategory>;
  entities: Record<string, HassEntityRegistryEntry>;
  labelRegistryUnavailable: boolean;
}

export interface CardDerivedState {
  automations: AutomationItem[];
}

export interface CardControllerViewModel {
  server: CardServerSnapshot;
  local: CardLocalUiState;
  registry: CardRegistryState;
  derived: CardDerivedState;
  modal: CardAdjustModalState;
  toast: CardToastState | null;
  persistentStatus: string | null;
}

type CardControllerListener = () => void;

interface PendingUndoContext {
  entities: string[];
  wasScheduleMode: boolean;
  hadDisableAt: boolean;
  count: number;
}

function cloneViewModel(model: CardControllerViewModel): CardControllerViewModel {
  return {
    server: {
      ...model.server,
      paused: { ...model.server.paused },
      scheduled: { ...model.server.scheduled },
      groups: [...model.server.groups],
    },
    local: {
      ...model.local,
      selected: [...model.local.selected],
      customDuration: { ...model.local.customDuration },
      recentSnoozeIds: [...model.local.recentSnoozeIds],
      pendingActions: [...model.local.pendingActions],
    },
    registry: {
      labels: { ...model.registry.labels },
      categories: { ...model.registry.categories },
      entities: { ...model.registry.entities },
      labelRegistryUnavailable: model.registry.labelRegistryUnavailable,
    },
    derived: {
      automations: [...model.derived.automations],
    },
    modal: {
      ...model.modal,
      entityIds: [...model.modal.entityIds],
      friendlyNames: [...model.modal.friendlyNames],
    },
    toast: model.toast ? { ...model.toast } : null,
    persistentStatus: model.persistentStatus,
  };
}

export function localizeScheduleValidationError(
  hass: HomeAssistant | undefined,
  code: ScheduledPauseValidationErrorCode,
): string {
  switch (code) {
    case 'resume_time_required':
      return localize(hass, 'toast.error.invalid_datetime');
    case 'resume_time_past':
      return localize(hass, 'toast.error.resume_time_past');
    case 'disable_before_resume':
      return localize(hass, 'toast.error.snooze_before_resume');
    default:
      return localize(hass, 'toast.error.invalid_datetime');
  }
}

export class CardController {
  private _hass?: HomeAssistant;
  private _config: AutoSnoozeCardConfig = { type: 'custom:autosnooze-card', title: 'AutoSnooze' };
  private _cardStore = createCardStore();
  private _listeners = new Set<CardControllerListener>();

  private _labelsFetched = false;
  private _categoriesFetched = false;
  private _entityRegistryFetched = false;
  private _labelRegistryFetchPromise: Promise<void> | null = null;
  private _categoryRegistryFetchPromise: Promise<void> | null = null;
  private _entityRegistryFetchPromise: Promise<void> | null = null;
  private _labelRegistryRetryTimeout: number | null = null;
  private _labelRegistryRetryDelayMs: number = UI_TIMING.REGISTRY_RETRY_MIN_MS;

  private _automationsCache: AutomationItem[] | null = null;
  private _automationsCacheVersion = 0;
  private _lastAutomationFingerprint = '';
  private _lastCacheVersion = 0;

  private _toastTimeout: number | null = null;
  private _toastFadeTimeout: number | null = null;
  private _undoToken = 0;
  private _pendingUndo: PendingUndoContext | null = null;
  private _connected = false;
  private _pendingActions = new Set<string>();

  private _viewModel: CardControllerViewModel = this._buildViewModel();

  constructor() {
    this._viewModel.local.lastDuration = loadCardLastDuration();
    this._refreshRecentSnoozeIds();
  }

  subscribe(listener: CardControllerListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  getViewModel(): CardControllerViewModel {
    return cloneViewModel(this._viewModel);
  }

  getAutomationReadModel(): AutomationItem[] {
    return this._getAutomations();
  }

  // Backward-compatible accessors for existing card UI regression tests.
  get labelsFetched(): boolean {
    return this._labelsFetched;
  }

  get labelRegistryRetryTimeout(): number | null {
    return this._labelRegistryRetryTimeout;
  }

  get automationsCache(): AutomationItem[] | null {
    return this._automationsCache;
  }

  set automationsCache(value: AutomationItem[] | null) {
    this._automationsCache = value;
  }

  get automationsCacheKey(): string | null {
    return this._lastAutomationFingerprint || null;
  }

  set automationsCacheKey(value: string | null) {
    this._lastAutomationFingerprint = value ?? '';
  }

  set labelRegistry(value: Record<string, HassLabel>) {
    this._viewModel.registry.labels = value;
    this._automationsCacheVersion += 1;
    this._rebuildViewModel();
  }

  get labelRegistry(): Record<string, HassLabel> {
    return this._viewModel.registry.labels;
  }

  set labelRegistryUnavailable(value: boolean) {
    this._viewModel.registry.labelRegistryUnavailable = value;
    this._notify();
  }

  get labelRegistryUnavailable(): boolean {
    return this._viewModel.registry.labelRegistryUnavailable;
  }

  set entityRegistry(value: Record<string, HassEntityRegistryEntry>) {
    this._viewModel.registry.entities = value;
    this._automationsCacheVersion += 1;
    this._rebuildViewModel();
  }

  get entityRegistry(): Record<string, HassEntityRegistryEntry> {
    return this._viewModel.registry.entities;
  }

  async fetchLabelRegistry(): Promise<void> {
    await this._fetchLabelRegistry();
  }

  getPaused(): Record<string, PausedAutomationAttribute> {
    return this._getPausedSnapshot().paused;
  }

  getScheduled(): Record<string, ScheduledSnoozeAttribute> {
    return this._getPausedSnapshot().scheduled;
  }

  set loading(value: boolean) {
    this._viewModel.local.loading = value;
    this._notify();
  }

  set labelsFetched(value: boolean) {
    this._labelsFetched = value;
    if (!value) {
      this._labelRegistryFetchPromise = null;
      if (this._hass) invalidateRegistryCaches(this._hass);
    }
  }

  set labelRegistryRetryTimeout(value: number | null) {
    this._labelRegistryRetryTimeout = value;
  }

  showToast(message: string, options: { showUndo?: boolean; onUndo?: () => void } = {}): void {
    this._showToast(message, options);
  }

  setCustomDuration(value: ParsedDuration): void {
    this._cardStore.setDuration(value, this._viewModel.local.customDurationInput);
    const state = this._cardStore.getState();
    this._viewModel.local.customDuration = { ...state.customDuration };
    this._viewModel.local.durationMs = state.durationMs;
    this._notify();
  }

  get customDuration(): ParsedDuration {
    return this._viewModel.local.customDuration;
  }

  set customDurationInput(value: string) {
    this._viewModel.local.customDurationInput = value;
    this._notify();
  }

  get customDurationInput(): string {
    return this._viewModel.local.customDurationInput;
  }

  set durationMs(value: number) {
    this._viewModel.local.durationMs = value;
    this._notify();
  }

  get durationMs(): number {
    return this._viewModel.local.durationMs;
  }

  set lastDuration(value: LastDurationData | null) {
    this._viewModel.local.lastDuration = value;
    this._notify();
  }

  get lastDuration(): LastDurationData | null {
    return this._viewModel.local.lastDuration;
  }

  set showCustomInput(value: boolean) {
    this._viewModel.local.showCustomInput = value;
    this._notify();
  }

  get showCustomInput(): boolean {
    return this._viewModel.local.showCustomInput;
  }

  get guardrailConfirmOpen(): boolean {
    return this._viewModel.local.guardrailConfirmOpen;
  }

  get categoriesFetched(): boolean {
    return this._categoriesFetched;
  }

  set categoriesFetched(value: boolean) {
    this._categoriesFetched = value;
    if (!value) {
      this._categoryRegistryFetchPromise = null;
      if (this._hass) invalidateRegistryCaches(this._hass);
    }
  }

  get entityRegistryFetched(): boolean {
    return this._entityRegistryFetched;
  }

  set entityRegistryFetched(value: boolean) {
    this._entityRegistryFetched = value;
    if (!value) {
      this._entityRegistryFetchPromise = null;
      if (this._hass) invalidateRegistryCaches(this._hass);
    }
  }

  get automationsCacheVersion(): number {
    return this._automationsCacheVersion;
  }

  set automationsCacheVersion(value: number) {
    this._automationsCacheVersion = value;
  }

  set categoryRegistry(value: Record<string, HassCategory>) {
    this._viewModel.registry.categories = value;
    this._rebuildViewModel();
  }

  get categoryRegistry(): Record<string, HassCategory> {
    return this._viewModel.registry.categories;
  }

  async fetchCategoryRegistry(): Promise<void> {
    await this._fetchCategoryRegistry();
  }

  async fetchEntityRegistry(): Promise<void> {
    await this._fetchEntityRegistry();
  }

  getPausedGroupedByResumeTime(): PauseGroup[] {
    return this._getPausedSnapshot().groups;
  }

  getLocale(): string | undefined {
    return this._hass?.locale?.language;
  }

  hasDisableAt(): boolean {
    return Boolean(this._viewModel.local.disableAtDate && this._viewModel.local.disableAtTime);
  }

  setConfig(config: AutoSnoozeCardConfig): void {
    this._config = config;
    this._notify();
  }

  getConfig(): AutoSnoozeCardConfig {
    return this._config;
  }

  connect(hass?: HomeAssistant): void {
    this._connected = true;
    if (hass) {
      this._hass = hass;
    }
    this._ensureRegistriesLoaded();
    this._viewModel.local.lastDuration = loadCardLastDuration();
    this._refreshRecentSnoozeIds();
    this._rebuildViewModel();
  }

  disconnect(): void {
    this._connected = false;
    this._clearToastTimers();
    if (this._labelRegistryRetryTimeout !== null) {
      clearTimeout(this._labelRegistryRetryTimeout);
      this._labelRegistryRetryTimeout = null;
    }
  }

  setHass(hass: HomeAssistant | undefined): void {
    const automationStatesChanged = !this._hass
      || !hass
      || this._haveAutomationStatesChanged(this._hass.states ?? {}, hass.states ?? {});
    this._hass = hass;
    this._syncAdjustModalWithPausedState();
    if (hass?.connection && !this._labelsFetched && this._labelRegistryRetryTimeout === null && !this._labelRegistryFetchPromise) {
      void this._fetchLabelRegistry();
    }
    this._rebuildViewModel(automationStatesChanged);
  }

  shouldUpdateHass(oldHass: HomeAssistant | undefined, newHass: HomeAssistant | undefined): boolean {
    if (!oldHass || !newHass) {
      return true;
    }

    const oldSensor = oldHass.states?.[SNOOZE_SENSOR_ENTITY_ID];
    const newSensor = newHass.states?.[SNOOZE_SENSOR_ENTITY_ID];
    if (oldSensor !== newSensor) {
      return true;
    }

    if (oldHass.entities !== newHass.entities) {
      return true;
    }

    if (oldHass.areas !== newHass.areas) {
      return true;
    }

    const oldLanguage = oldHass.language ?? oldHass.locale?.language;
    const newLanguage = newHass.language ?? newHass.locale?.language;
    if (oldLanguage !== newLanguage) {
      return true;
    }

    const newStates = newHass.states;
    const oldStates = oldHass.states;
    if (!newStates || !oldStates) {
      return true;
    }

    if (oldStates === newStates) {
      return false;
    }

    return this._haveAutomationStatesChanged(oldStates, newStates);
  }

  getCardSize(): number {
    const attributes = this._hass?.states?.[SNOOZE_SENSOR_ENTITY_ID]?.attributes;
    const root = attributes && typeof attributes === 'object' ? attributes as Record<string, unknown> : {};
    const paused = (root.paused ?? root.paused_automations ?? {}) as Record<string, unknown>;
    const scheduled = (root.scheduled ?? root.scheduled_snoozes ?? {}) as Record<string, unknown>;
    return 4 + Object.keys(paused).length + Object.keys(scheduled).length;
  }

  setSelection(selected: string[]): void {
    this._cardStore.setSelection(selected);
    this._viewModel.local.selected = [...this._cardStore.getState().selected];
    this._notify();
  }

  setDurationState(duration: ParsedDuration, input: string, showCustomInput?: boolean): void {
    this._cardStore.setDuration(duration, input);
    const state = this._cardStore.getState();
    this._viewModel.local.durationMs = state.durationMs;
    this._viewModel.local.customDuration = { ...state.customDuration };
    this._viewModel.local.customDurationInput = state.customDurationInput;
    if (showCustomInput !== undefined) {
      this._viewModel.local.showCustomInput = showCustomInput;
    }
    this._notify();
  }

  setScheduleMode(enabled: boolean): void {
    const scheduleState = createScheduleModeState({
      enabled,
      now: new Date(),
      resumeMinutes: this._viewModel.local.lastDuration?.minutes ?? DEFAULT_SNOOZE_MINUTES,
    });
    this._viewModel.local.scheduleMode = scheduleState.scheduleMode;
    if (enabled) {
      this._viewModel.local.disableAtDate = scheduleState.disableAtDate;
      this._viewModel.local.disableAtTime = scheduleState.disableAtTime;
      this._viewModel.local.resumeAtDate = scheduleState.resumeAtDate;
      this._viewModel.local.resumeAtTime = scheduleState.resumeAtTime;
    }
    this._notify();
  }

  setScheduleField(field: string, value: string): void {
    switch (field) {
      case 'disableAtDate':
        this._viewModel.local.disableAtDate = value;
        break;
      case 'disableAtTime':
        this._viewModel.local.disableAtTime = value;
        break;
      case 'resumeAtDate':
        this._viewModel.local.resumeAtDate = value;
        break;
      case 'resumeAtTime':
        this._viewModel.local.resumeAtTime = value;
        break;
      default:
        return;
    }
    this._notify();
  }

  setShowCustomInput(show: boolean): void {
    this._viewModel.local.showCustomInput = show;
    this._notify();
  }

  setNotificationsEnabled(enabled: boolean): void {
    this._viewModel.local.notificationsEnabled = enabled;
    this._notify();
  }

  setNotificationTrigger(trigger: Exclude<NotificationTrigger, 'none'>): void {
    this._viewModel.local.notificationTrigger = trigger;
    this._notify();
  }

  setNotificationLeadMinutes(minutes: number): void {
    this._viewModel.local.notificationLeadMinutes = minutes;
    this._notify();
  }

  dismissGuardrail(): void {
    this._viewModel.local.guardrailConfirmOpen = false;
    this._notify();
  }

  openAdjustAutomation(detail: { entityId: string; friendlyName: string; resumeAt: string }): void {
    const state = createAdjustModalState(detail);
    this._applyAdjustModalState(state);
    this._notify();
  }

  openAdjustGroup(detail: { entityIds: string[]; friendlyNames: string[]; resumeAt: string }): void {
    const state = createAdjustModalState(detail);
    this._applyAdjustModalState(state);
    this._notify();
  }

  closeAdjustModal(): void {
    this._applyAdjustModalState(createClosedAdjustModalState());
    this._notify();
  }

  setAdjustModalResumeAt(resumeAt: string): void {
    this._viewModel.modal.resumeAt = resumeAt;
    this._notify();
  }

  formatDateTime(isoString: string): string {
    return formatDateTime(isoString, this._hass?.locale?.language);
  }

  formatLeadLabel(minutes: number): string {
    const { days, hours, minutes: mins } = minutesToDuration(minutes);
    return formatDuration(days, hours, mins);
  }

  hasResumeAt(): boolean {
    return Boolean(this._viewModel.local.resumeAtDate && this._viewModel.local.resumeAtTime);
  }

  async runSnooze(forceConfirm = false): Promise<void> {
    const local = this._viewModel.local;
    if (local.selected.length === 0 || local.loading) {
      return;
    }

    if (local.scheduleMode) {
      if (!this.hasResumeAt()) {
        this._showToast(localize(this._hass, 'toast.error.resume_time_required'));
        return;
      }

      const scheduleValidation = validateScheduledPauseInput({
        disableAtDate: local.disableAtDate,
        disableAtTime: local.disableAtTime,
        resumeAtDate: local.resumeAtDate,
        resumeAtTime: local.resumeAtTime,
        nowMs: Date.now() + UI_TIMING.TIME_VALIDATION_BUFFER_MS,
      });

      if (scheduleValidation.status === 'error') {
        this._showToast(localizeScheduleValidationError(this._hass, scheduleValidation.code));
        return;
      }
    } else if (local.durationMs === 0) {
      return;
    }

    if (!forceConfirm && requiresPauseConfirmation({
      selected: local.selected,
      automations: this._viewModel.derived.automations,
      labelRegistry: this._viewModel.registry.labels,
    })) {
      this._viewModel.local.guardrailConfirmOpen = true;
      this._notify();
      return;
    }

    this._viewModel.local.loading = true;
    this._viewModel.local.guardrailConfirmOpen = false;
    this._notify();

    try {
      if (!this._hass) {
        return;
      }

      const count = local.selected.length;
      const snoozedEntities = [...local.selected];
      const wasScheduleMode = local.scheduleMode;
      const hadDisableAt = Boolean(local.disableAtDate && local.disableAtTime);
      const pauseResult = await runPauseFeature({
        hass: this._hass,
        selected: local.selected,
        scheduleMode: local.scheduleMode,
        customDuration: local.customDuration,
        disableAtDate: local.disableAtDate,
        disableAtTime: local.disableAtTime,
        resumeAtDate: local.resumeAtDate,
        resumeAtTime: local.resumeAtTime,
        forceConfirm,
        ...(local.notificationsEnabled && {
          notificationTrigger: local.notificationTrigger,
          ...(local.notificationTrigger === 'about_to_end' && {
            notificationLeadMinutes: local.notificationLeadMinutes,
          }),
        }),
      });

      if (pauseResult.status === 'confirm_required') {
        this._viewModel.local.guardrailConfirmOpen = true;
        return;
      }

      if (pauseResult.status === 'aborted') {
        return;
      }

      if (pauseResult.lastDuration) {
        this._viewModel.local.lastDuration = pauseResult.lastDuration;
      }

      this._refreshRecentSnoozeIds();

      if (!this._connected) {
        return;
      }

      hapticFeedback('success');
      this._pendingUndo = {
        entities: snoozedEntities,
        wasScheduleMode,
        hadDisableAt,
        count,
      };
      this._showToast(pauseResult.toastMessage, { showUndo: true });
      this._recordCommandOutcome(pauseResult.commandResponse, pauseResult.toastMessage, pauseResult.failed ?? []);

      this.setSelection(pauseResult.failed ?? []);
      this._viewModel.local.notificationsEnabled = false;
      this._viewModel.local.notificationTrigger = 'end';
      this._viewModel.local.notificationLeadMinutes = DEFAULT_NOTIFICATION_LEAD_MINUTES;
      this._viewModel.local.disableAtDate = '';
      this._viewModel.local.disableAtTime = '';
      this._viewModel.local.resumeAtDate = '';
      this._viewModel.local.resumeAtTime = '';
    } catch (error) {
      console.error('Snooze failed:', error);
      hapticFeedback('failure');
    } finally {
      this._viewModel.local.loading = false;
      this._notify();
    }
  }

  async runGuardrailContinue(): Promise<void> {
    this._viewModel.local.guardrailConfirmOpen = false;
    this._notify();
    await this.runSnooze(true);
  }

  async runWake(entityId: string): Promise<void> {
    const pendingKey = `resume:${entityId}`;
    if (!this._hass || !this._beginPending(pendingKey)) {
      return;
    }
    try {
      const result = await runWakeFeature(this._hass, entityId);
      this._recordCommandOutcome(result.commandResponse, undefined, result.failed);
      hapticFeedback('success');
      if (this._connected) {
        this._showToast(localize(this._hass, 'toast.success.resumed'));
      }
    } catch (error) {
      console.error('Wake failed:', error);
      hapticFeedback('failure');
    } finally {
      this._endPending(pendingKey);
    }
  }

  async runWakeAll(): Promise<void> {
    const pendingKey = 'resume-all';
    if (!this._hass || !this._beginPending(pendingKey)) {
      return;
    }
    try {
      const result = await runWakeAllFeature(this._hass);
      this._recordCommandOutcome(result.commandResponse, undefined, result.failed);
      hapticFeedback('success');
      if (this._connected) {
        this._showToast(localize(this._hass, 'toast.success.resumed_all'));
      }
    } catch (error) {
      console.error('Wake all failed:', error);
      hapticFeedback('failure');
    } finally {
      this._endPending(pendingKey);
    }
  }

  async runClearNotification(entityId: string): Promise<void> {
    if (!this._hass) {
      return;
    }
    try {
      await runClearNotificationFeature(this._hass, entityId);
      hapticFeedback('success');
    } catch (error) {
      console.error('Clear notification failed:', error);
      hapticFeedback('failure');
    }
  }

  async runAdjustTime(detail: {
    entityId?: string;
    entityIds?: string[];
    days?: number;
    hours?: number;
    minutes?: number;
  }): Promise<void> {
    const pendingKey = `adjust:${[...(detail.entityIds ?? []), ...(detail.entityId ? [detail.entityId] : [])].sort().join(',')}`;
    if (!this._hass || !this._beginPending(pendingKey)) {
      return;
    }
    try {
      const adjustResult = await runAdjustFeature(this._hass, detail, this._viewModel.modal.resumeAt);
      hapticFeedback('success');
      this._viewModel.modal.resumeAt = adjustResult.nextResumeAt;
      this._notify();
      if (this._connected) {
        this._showToast(localize(this._hass, 'toast.success.adjusted'));
      }
    } catch (error) {
      console.error('Adjust failed:', error);
      hapticFeedback('failure');
    } finally {
      this._endPending(pendingKey);
    }
  }

  async runCancelScheduled(entityId: string): Promise<void> {
    const pendingKey = `cancel:${entityId}`;
    if (!this._hass || !this._beginPending(pendingKey)) {
      return;
    }
    try {
      await runCancelScheduledFeature(this._hass, entityId);
      hapticFeedback('success');
      if (this._connected) {
        this._showToast(localize(this._hass, 'toast.success.cancelled'));
      }
    } catch (error) {
      console.error('Cancel scheduled failed:', error);
      hapticFeedback('failure');
    } finally {
      this._endPending(pendingKey);
    }
  }

  private _beginPending(key: string): boolean {
    if (this._pendingActions.has(key)) {
      return false;
    }
    this._pendingActions.add(key);
    this._viewModel.local.pendingActions = [...this._pendingActions];
    this._notify();
    return true;
  }

  private _endPending(key: string): void {
    this._pendingActions.delete(key);
    this._viewModel.local.pendingActions = [...this._pendingActions];
    this._notify();
  }

  private _recordCommandOutcome(
    response?: import('../../types/service-response.js').CommandServiceResponse,
    fallbackMessage?: string,
    failed: string[] = [],
  ): void {
    const recoveryRequired = response?.recovery_required_entities ?? (
      fallbackMessage?.toLowerCase().includes('recovery required') ? failed : []
    );
    const retrying = response?.entities
      .filter((entity) => entity.recovery_status === 'retrying')
      .map((entity) => entity.entity_id) ?? [];

    if (recoveryRequired.length > 0) {
      this._viewModel.persistentStatus = `Recovery required: ${recoveryRequired.join(', ')}`;
    } else if (retrying.length > 0) {
      this._viewModel.persistentStatus = `Retrying: ${retrying.join(', ')}`;
    } else if (failed.length > 0) {
      this._viewModel.persistentStatus = `Partial success. Retry: ${failed.join(', ')}`;
    } else {
      this._viewModel.persistentStatus = null;
    }
    this._notify();
  }

  async runToastUndo(): Promise<void> {
    const pending = this._pendingUndo;
    if (!pending || !this._hass) {
      return;
    }

    try {
      const undoResult = await runUndoFeature(this._hass, pending.entities, {
        wasScheduleMode: pending.wasScheduleMode,
        hadDisableAt: pending.hadDisableAt,
      });
      if (!this._connected) {
        return;
      }
      if (undoResult.failed.length === 0) {
        this.setSelection(pending.entities);
        const restoredMsg = pending.count === 1
          ? localize(this._hass, 'toast.success.restored_one')
          : localize(this._hass, 'toast.success.restored_many', { count: pending.count });
        this._showToast(restoredMsg);
      } else {
        this.setSelection(undoResult.failed);
        this._showToast(localize(this._hass, 'toast.error.undo_failed'));
      }
    } catch (error) {
      console.error('Undo failed:', error);
      if (this._connected) {
        this._showToast(localize(this._hass, 'toast.error.undo_failed'));
      }
    } finally {
      this._pendingUndo = null;
    }
  }

  dismissToast(): void {
    this._viewModel.toast = null;
    this._clearToastTimers();
    this._notify();
  }

  private _notify(): void {
    for (const listener of this._listeners) {
      listener();
    }
  }

  private _buildViewModel(): CardControllerViewModel {
    const storeState = this._cardStore.getState();
    const snapshot = this._getPausedSnapshot();
    return {
      server: {
        paused: snapshot.paused,
        scheduled: snapshot.scheduled,
        groups: snapshot.groups,
        pausedCount: Object.keys(snapshot.paused).length,
        scheduledCount: Object.keys(snapshot.scheduled).length,
        sensorAvailable: isCardSnoozeSensorAvailable(this._hass),
      },
      local: {
        selected: [...storeState.selected],
        durationMs: storeState.durationMs,
        customDuration: { ...storeState.customDuration },
        customDurationInput: storeState.customDurationInput,
        loading: false,
        pendingActions: [],
        scheduleMode: false,
        notificationsEnabled: false,
        notificationTrigger: 'end',
        notificationLeadMinutes: DEFAULT_NOTIFICATION_LEAD_MINUTES,
        disableAtDate: '',
        disableAtTime: '',
        resumeAtDate: '',
        resumeAtTime: '',
        showCustomInput: false,
        lastDuration: null,
        recentSnoozeIds: [],
        guardrailConfirmOpen: false,
      },
      registry: {
        labels: {},
        categories: {},
        entities: {},
        labelRegistryUnavailable: false,
      },
      derived: {
        automations: [],
      },
      modal: {
        open: false,
        entityId: '',
        friendlyName: '',
        resumeAt: '',
        entityIds: [],
        friendlyNames: [],
      },
      toast: null,
      persistentStatus: null,
    };
  }

  private _rebuildViewModel(refreshAutomations: boolean = true): void {
    const snapshot = this._getPausedSnapshot();
    const storeState = this._cardStore.getState();
    const local = this._viewModel.local;

    this._viewModel.server = {
      paused: snapshot.paused,
      scheduled: snapshot.scheduled,
      groups: snapshot.groups,
      pausedCount: Object.keys(snapshot.paused).length,
      scheduledCount: Object.keys(snapshot.scheduled).length,
      sensorAvailable: isCardSnoozeSensorAvailable(this._hass),
    };
    this._viewModel.local = {
      ...local,
      selected: [...storeState.selected],
      durationMs: storeState.durationMs,
      customDuration: { ...storeState.customDuration },
      customDurationInput: storeState.customDurationInput,
    };
    this._viewModel.registry = {
      labels: { ...this._viewModel.registry.labels },
      categories: { ...this._viewModel.registry.categories },
      entities: { ...this._viewModel.registry.entities },
      labelRegistryUnavailable: this._viewModel.registry.labelRegistryUnavailable,
    };
    if (refreshAutomations) {
      this._viewModel.derived.automations = this._getAutomations();
    }
    this._notify();
  }

  private _getPausedSnapshot(): {
    paused: Record<string, PausedAutomationAttribute>;
    scheduled: Record<string, ScheduledSnoozeAttribute>;
    groups: PauseGroup[];
  } {
    if (!this._hass) {
      return { paused: {}, scheduled: {}, groups: [] };
    }
    return getCardPausedSnapshot(this._hass);
  }

  private _getAutomationFingerprint(states: HassEntities): string {
    const automationIds = Object.keys(states)
      .filter((entityId) => entityId.startsWith('automation.'))
      .sort();

    return automationIds
      .map((entityId) => {
        const entity = states[entityId] as {
          state?: string;
          last_changed?: string;
          last_updated?: string;
        } | undefined;
        return `${entityId}:${entity?.state ?? ''}:${entity?.last_changed ?? ''}:${entity?.last_updated ?? ''}`;
      })
      .join('|');
  }

  private _getAutomations(): AutomationItem[] {
    if (!this._hass?.states) {
      return [];
    }

    const fingerprint = this._getAutomationFingerprint(this._hass.states);
    const currentVersion = this._automationsCacheVersion;

    if (
      this._lastAutomationFingerprint === fingerprint
      && this._lastCacheVersion === currentVersion
      && this._automationsCache
    ) {
      return this._automationsCache;
    }

    const result = getAutomations(this._hass, this._viewModel.registry.entities);
    this._automationsCache = result;
    this._lastCacheVersion = currentVersion;
    this._lastAutomationFingerprint = fingerprint;
    return result;
  }

  private _refreshRecentSnoozeIds(): void {
    this._viewModel.local.recentSnoozeIds = loadCardRecentSnoozeIds();
  }

  ensureRegistriesOnHassUpdate(): void {
    this._ensureRegistriesLoaded();
  }

  private _ensureRegistriesLoaded(): void {
    if (!this._hass?.connection) {
      return;
    }
    if (!this._labelsFetched && this._labelRegistryRetryTimeout === null) {
      void this._fetchLabelRegistry();
    }
    if (!this._categoriesFetched) {
      void this._fetchCategoryRegistry();
    }
    if (!this._entityRegistryFetched) {
      void this._fetchEntityRegistry();
    }
  }

  private async _fetchLabelRegistry(): Promise<void> {
    if (this._labelsFetched || !this._hass?.connection) {
      return;
    }
    if (this._labelRegistryFetchPromise) {
      await this._labelRegistryFetchPromise;
      return;
    }

    this._labelRegistryFetchPromise = (async () => {
      const labels = await fetchCardLabelRegistry(this._hass!);
      if (labels === null) {
        this._labelsFetched = false;
        this._viewModel.registry.labelRegistryUnavailable = true;
        if (this._labelRegistryRetryTimeout === null && this._connected) {
          const delay = this._labelRegistryRetryDelayMs;
          this._labelRegistryRetryTimeout = window.setTimeout(() => {
            this._labelRegistryRetryTimeout = null;
            if (!this._connected) {
              return;
            }
            void this._fetchLabelRegistry();
          }, delay);
          this._labelRegistryRetryDelayMs = Math.min(
            this._labelRegistryRetryDelayMs * 2,
            UI_TIMING.REGISTRY_RETRY_MAX_MS,
          );
        }
        return;
      }

      this._viewModel.registry.labels = labels;
      this._labelsFetched = true;
      this._viewModel.registry.labelRegistryUnavailable = false;
      this._automationsCacheVersion += 1;
      this._labelRegistryRetryDelayMs = UI_TIMING.REGISTRY_RETRY_MIN_MS;
      if (this._labelRegistryRetryTimeout !== null) {
        clearTimeout(this._labelRegistryRetryTimeout);
        this._labelRegistryRetryTimeout = null;
      }
      this._rebuildViewModel();
    })();

    try {
      await this._labelRegistryFetchPromise;
    } finally {
      this._labelRegistryFetchPromise = null;
    }
  }

  private async _fetchCategoryRegistry(): Promise<void> {
    if (this._categoriesFetched || !this._hass?.connection) {
      return;
    }
    if (this._categoryRegistryFetchPromise) {
      await this._categoryRegistryFetchPromise;
      return;
    }

    this._categoryRegistryFetchPromise = (async () => {
      this._viewModel.registry.categories = await fetchCardCategoryRegistry(this._hass!);
      this._categoriesFetched = true;
      this._rebuildViewModel();
    })();

    try {
      await this._categoryRegistryFetchPromise;
    } finally {
      this._categoryRegistryFetchPromise = null;
    }
  }

  private async _fetchEntityRegistry(): Promise<void> {
    if (this._entityRegistryFetched || !this._hass?.connection) {
      return;
    }
    if (this._entityRegistryFetchPromise) {
      await this._entityRegistryFetchPromise;
      return;
    }

    this._entityRegistryFetchPromise = (async () => {
      this._viewModel.registry.entities = await fetchCardEntityRegistry(this._hass!);
      this._entityRegistryFetched = true;
      this._automationsCacheVersion += 1;
      this._rebuildViewModel();
    })();

    try {
      await this._entityRegistryFetchPromise;
    } finally {
      this._entityRegistryFetchPromise = null;
    }
  }

  private _haveAutomationStatesChanged(oldStates: HassEntities, newStates: HassEntities): boolean {
    let oldAutomationCount = 0;

    for (const [entityId, oldState] of Object.entries(oldStates)) {
      if (!entityId.startsWith('automation.')) {
        continue;
      }

      oldAutomationCount += 1;
      if (!(entityId in newStates)) {
        return true;
      }

      if (newStates[entityId] !== oldState) {
        return true;
      }
    }

    let newAutomationCount = 0;
    for (const entityId of Object.keys(newStates)) {
      if (entityId.startsWith('automation.')) {
        newAutomationCount += 1;
      }
    }

    return oldAutomationCount !== newAutomationCount;
  }

  private _syncAdjustModalWithPausedState(): void {
    if (!this._viewModel.modal.open) {
      return;
    }

    const paused = this._getPausedSnapshot().paused;

    if (this._viewModel.modal.entityIds.length > 0) {
      const anyStillPaused = this._viewModel.modal.entityIds.some((id) => paused[id]);
      if (!anyStillPaused) {
        this.closeAdjustModal();
        return;
      }

      const firstPaused = this._viewModel.modal.entityIds.find((id) => paused[id]);
      if (firstPaused) {
        const pausedData = paused[firstPaused] as { resume_at?: string } | undefined;
        if (pausedData?.resume_at && pausedData.resume_at !== this._viewModel.modal.resumeAt) {
          this._viewModel.modal.resumeAt = pausedData.resume_at;
          this._notify();
        }
      }
      return;
    }

    if (this._viewModel.modal.entityId) {
      const pausedData = paused[this._viewModel.modal.entityId] as { resume_at?: string } | undefined;
      if (pausedData?.resume_at && pausedData.resume_at !== this._viewModel.modal.resumeAt) {
        this._viewModel.modal.resumeAt = pausedData.resume_at;
        this._notify();
      }
      if (!pausedData) {
        this.closeAdjustModal();
      }
    }
  }

  private _applyAdjustModalState(state: ReturnType<typeof createAdjustModalState>): void {
    this._viewModel.modal = {
      open: state.adjustModalOpen,
      entityId: state.adjustModalEntityId,
      friendlyName: state.adjustModalFriendlyName,
      resumeAt: state.adjustModalResumeAt,
      entityIds: [...state.adjustModalEntityIds],
      friendlyNames: [...state.adjustModalFriendlyNames],
    };
  }

  private _showToast(message: string, options: { showUndo?: boolean; onUndo?: () => void } = {}): void {
    const { showUndo = false, onUndo } = options;
    const undoToken = showUndo ? ++this._undoToken : undefined;
    this._viewModel.toast = {
      message,
      showUndo,
      undoToken,
      onUndo,
    };
    this._notify();

    this._clearToastTimers();
    this._toastTimeout = window.setTimeout(() => {
      this._toastTimeout = null;
      this._viewModel.toast = null;
      this._notify();
    }, UI_TIMING.TOAST_DURATION_MS);
  }

  private _clearToastTimers(): void {
    if (this._toastTimeout !== null) {
      clearTimeout(this._toastTimeout);
      this._toastTimeout = null;
    }
    if (this._toastFadeTimeout !== null) {
      clearTimeout(this._toastFadeTimeout);
      this._toastFadeTimeout = null;
    }
  }
}

export function createCardController(): CardController {
  return new CardController();
}
