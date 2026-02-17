import {
  AutomationPauseCard,
  AutomationPauseCardEditor,
  AutoSnoozeActivePauses,
  AutoSnoozeDurationSelector,
  AutoSnoozeAutomationList,
  AutoSnoozeAdjustModal,
} from './components/index.js';
import { CARD_VERSION } from './constants/index.js';
import type { CustomCardEntry } from './types/card.js';

const REGISTRATION_DONE_KEY = Symbol.for('autosnooze.registration.done.v1');
const WARNED_KEYS = new Set<string>();

export function _resetWarnedKeys(): void {
  WARNED_KEYS.clear();
}

const CARD_TYPE = 'autosnooze-card';
const DOCUMENTATION_URL = 'https://github.com/mossipcams/autosnooze#readme';

interface RegistrationGlobal {
  [REGISTRATION_DONE_KEY]?: boolean;
}

type AutoSnoozeCardEntry = CustomCardEntry & {
  documentationURL?: string;
};

interface ElementRegistration {
  tag: string;
  ctor: CustomElementConstructor;
}

const ELEMENTS: ElementRegistration[] = [
  { tag: 'autosnooze-card-editor', ctor: AutomationPauseCardEditor },
  { tag: 'autosnooze-active-pauses', ctor: AutoSnoozeActivePauses },
  { tag: 'autosnooze-duration-selector', ctor: AutoSnoozeDurationSelector },
  { tag: 'autosnooze-automation-list', ctor: AutoSnoozeAutomationList },
  { tag: 'autosnooze-adjust-modal', ctor: AutoSnoozeAdjustModal },
  { tag: CARD_TYPE, ctor: AutomationPauseCard },
];

function warnOnce(key: string, message: string, error?: unknown): void {
  if (WARNED_KEYS.has(key)) {
    return;
  }

  WARNED_KEYS.add(key);
  if (error !== undefined) {
    console.warn(message, error);
    return;
  }

  console.warn(message);
}

function getCardMetadata(version: string): AutoSnoozeCardEntry {
  return {
    type: CARD_TYPE,
    name: 'AutoSnooze Card',
    description: `Temporarily pause automations with area and label filtering (v${version})`,
    preview: true,
    documentationURL: DOCUMENTATION_URL,
  };
}

function ensureCustomCardsArray(): AutoSnoozeCardEntry[] {
  const current = (window as Window & { customCards?: unknown }).customCards;
  if (Array.isArray(current)) {
    return current as AutoSnoozeCardEntry[];
  }

  if (current !== undefined) {
    warnOnce(
      'customCards-not-array',
      `[AutoSnooze] window.customCards was not an array (got ${typeof current}); resetting.`
    );
  }

  return [];
}

export function safeDefine(
  tag: string,
  ctor: CustomElementConstructor,
  registry: CustomElementRegistry = customElements
): void {
  const existing = registry.get(tag);
  if (existing) {
    if (existing !== ctor) {
      warnOnce(
        `element-conflict:${tag}`,
        `[AutoSnooze] Element tag "${tag}" is already registered with a different constructor.`
      );
    }
    return;
  }

  try {
    registry.define(tag, ctor);
  } catch (error) {
    const afterDefine = registry.get(tag);
    if (afterDefine === ctor) {
      return;
    }

    if (afterDefine) {
      warnOnce(
        `element-conflict:${tag}`,
        `[AutoSnooze] Element tag "${tag}" was claimed by a different constructor during registration.`
      );
      return;
    }

    throw error;
  }
}

export function registerCustomCardMetadata(version: string = CARD_VERSION): void {
  const entry = getCardMetadata(version);
  const cards = ensureCustomCardsArray();

  const index = cards.findIndex((card) => card?.type === CARD_TYPE);
  if (index === -1) {
    cards.push(entry);
  } else {
    cards[index] = {
      ...cards[index],
      ...entry,
    };
  }

  window.customCards = cards;
}

export function registerAutoSnoozeCard(): void {
  const runtime = globalThis as typeof globalThis & RegistrationGlobal;
  const alreadyRegistered = runtime[REGISTRATION_DONE_KEY] === true;

  if (!alreadyRegistered) {
    ELEMENTS.forEach(({ tag, ctor }) => safeDefine(tag, ctor));
    runtime[REGISTRATION_DONE_KEY] = true;
  }

  // Keep metadata fresh; idempotent and self-healing if another script mutates it.
  registerCustomCardMetadata();
}
