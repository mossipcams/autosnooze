import { beforeEach, describe, expect, test } from 'vitest';
import {
  registerAutoSnoozeCard,
  registerCustomCardMetadata,
} from '../registration.js';
import { AutomationPauseCard } from '../components/autosnooze-card.js';
import { AutoSnoozeSnoozedCard } from '../components/autosnooze-snoozed-card.js';
import * as components from '../components/index.js';

const MAIN_CARD_TYPE = 'autosnooze-card';
const SNOOZED_CARD_TYPE = 'autosnooze-snoozed-card';

describe('Snoozed-only card registration', () => {
  beforeEach(() => {
    window.customCards = [];
  });

  test('the snoozed-only component is re-exported from the components barrel', () => {
    expect(components.AutoSnoozeSnoozedCard).toBe(AutoSnoozeSnoozedCard);
  });

  test('exposes a stub config with a distinct custom-card type', () => {
    const stub = AutoSnoozeSnoozedCard.getStubConfig();
    expect(stub.type).toBe('custom:autosnooze-snoozed-card');
    expect(stub.type).not.toBe(AutomationPauseCard.getStubConfig().type);
    expect(stub.title).toBeTruthy();
  });

  test('registerCustomCardMetadata adds both cards without dropping the main card', () => {
    registerCustomCardMetadata('9.9.9');

    const types = (window.customCards ?? []).map((card) => card.type);
    expect(types).toContain(MAIN_CARD_TYPE);
    expect(types).toContain(SNOOZED_CARD_TYPE);

    const snoozed = window.customCards?.find((card) => card.type === SNOOZED_CARD_TYPE);
    expect(snoozed?.name).toBe('AutoSnooze Snoozed Card');
    expect(snoozed?.preview).toBe(true);
    expect(snoozed?.description).toContain('9.9.9');
  });

  test('metadata registration is idempotent (no duplicate snoozed entries)', () => {
    registerCustomCardMetadata();
    registerCustomCardMetadata();

    const snoozedEntries = (window.customCards ?? []).filter(
      (card) => card.type === SNOOZED_CARD_TYPE
    );
    expect(snoozedEntries).toHaveLength(1);
  });

  test('registerAutoSnoozeCard defines the snoozed-only element', () => {
    registerAutoSnoozeCard();
    expect(customElements.get(SNOOZED_CARD_TYPE)).toBe(AutoSnoozeSnoozedCard);
    // The original card element must remain registered too.
    expect(customElements.get(MAIN_CARD_TYPE)).toBe(AutomationPauseCard);
  });
});
