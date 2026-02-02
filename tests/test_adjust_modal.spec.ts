// @ts-nocheck -- migrated from JS, type annotations deferred
/**
 * Tests for AutoSnoozeAdjustModal component.
 * Verifies the extracted adjust modal renders and fires events correctly.
 */
import { describe, it, expect } from 'vitest';
import { AutoSnoozeAdjustModal } from '../src/components/index.js';

// Register custom element for jsdom instantiation
if (!customElements.get('autosnooze-adjust-modal')) {
  customElements.define('autosnooze-adjust-modal', AutoSnoozeAdjustModal);
}

describe('AutoSnoozeAdjustModal', () => {
  // Use a resumeAt 2 hours in the future for most tests
  const futureResumeAt = () => new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  // Use a resumeAt only 10 minutes in the future for decrement disable tests
  const shortResumeAt = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();

  it('should be importable as a class', () => {
    expect(AutoSnoozeAdjustModal).toBeDefined();
    expect(typeof AutoSnoozeAdjustModal).toBe('function');
  });

  it('should have open property defaulting to false', () => {
    const el = new AutoSnoozeAdjustModal();
    expect(el.open).toBe(false);
  });

  it('should have all reactive properties with correct defaults', () => {
    const el = new AutoSnoozeAdjustModal();
    expect(el.entityId).toBe('');
    expect(el.friendlyName).toBe('');
    expect(el.resumeAt).toBe('');
  });

  it('should render nothing when closed', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal');
    expect(el.shadowRoot.querySelector('.modal-overlay')).toBeNull();
  });

  it('should render modal overlay when open', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test Automation',
      resumeAt: futureResumeAt(),
    });
    expect(el.shadowRoot.querySelector('.modal-overlay')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.modal-content')).not.toBeNull();
  });

  it('should display friendly name in modal title', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'My Test Automation',
      resumeAt: futureResumeAt(),
    });
    const title = el.shadowRoot.querySelector('.modal-title');
    expect(title.textContent).toContain('My Test Automation');
  });

  it('should display entity_id when friendlyName is empty', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test_bot',
      friendlyName: '',
      resumeAt: futureResumeAt(),
    });
    const title = el.shadowRoot.querySelector('.modal-title');
    expect(title.textContent).toContain('automation.test_bot');
  });

  it('should display remaining time countdown', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    const remaining = el.shadowRoot.querySelector('.remaining-time');
    expect(remaining).not.toBeNull();
    // Should contain time components (h, m, s)
    expect(remaining.textContent).toMatch(/\d+[hms]/);
  });

  it('should render 4 increment buttons', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    const incrementBtns = el.shadowRoot.querySelectorAll('.adjust-btn.increment');
    expect(incrementBtns.length).toBe(4);
    const labels = Array.from(incrementBtns).map(btn => btn.textContent.trim());
    expect(labels).toEqual(['+15m', '+30m', '+1h', '+2h']);
  });

  it('should render 2 decrement buttons', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    const decrementBtns = el.shadowRoot.querySelectorAll('.adjust-btn.decrement');
    expect(decrementBtns.length).toBe(2);
    const labels = Array.from(decrementBtns).map(btn => btn.textContent.trim());
    expect(labels).toEqual(['-15m', '-30m']);
  });

  it('should fire adjust-time event on increment button click', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    let firedDetail = null;
    el.addEventListener('adjust-time', (e) => { firedDetail = e.detail; });
    const incrementBtn = el.shadowRoot.querySelector('.adjust-btn.increment');
    incrementBtn.click();
    expect(firedDetail).not.toBeNull();
    expect(firedDetail.entityId).toBe('automation.test');
    expect(firedDetail.minutes).toBe(15);
  });

  it('should fire adjust-time event with hours for +1h button', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    let firedDetail = null;
    el.addEventListener('adjust-time', (e) => { firedDetail = e.detail; });
    const buttons = el.shadowRoot.querySelectorAll('.adjust-btn.increment');
    // Third button is +1h
    buttons[2].click();
    expect(firedDetail).not.toBeNull();
    expect(firedDetail.entityId).toBe('automation.test');
    expect(firedDetail.hours).toBe(1);
  });

  it('should fire adjust-time event on decrement button click', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    let firedDetail = null;
    el.addEventListener('adjust-time', (e) => { firedDetail = e.detail; });
    const decrementBtn = el.shadowRoot.querySelector('.adjust-btn.decrement');
    decrementBtn.click();
    expect(firedDetail).not.toBeNull();
    expect(firedDetail.entityId).toBe('automation.test');
    expect(firedDetail.minutes).toBe(-15);
  });

  it('should fire close-modal event on close button click', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    let closed = false;
    el.addEventListener('close-modal', () => { closed = true; });
    const closeBtn = el.shadowRoot.querySelector('.modal-close');
    closeBtn.click();
    expect(closed).toBe(true);
  });

  it('should fire close-modal event on overlay click', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    let closed = false;
    el.addEventListener('close-modal', () => { closed = true; });
    const overlay = el.shadowRoot.querySelector('.modal-overlay');
    // Simulate click on overlay itself (not on content)
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(closed).toBe(true);
  });

  it('should NOT fire close-modal on modal content click', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    let closed = false;
    el.addEventListener('close-modal', () => { closed = true; });
    const content = el.shadowRoot.querySelector('.modal-content');
    content.click();
    expect(closed).toBe(false);
  });

  it('should disable decrement buttons when remaining time is too short', async () => {
    // 10 minutes remaining -- -15m and -30m should both be disabled
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: shortResumeAt(),
    });
    const decrementBtns = el.shadowRoot.querySelectorAll('.adjust-btn.decrement');
    // Both buttons disabled: 10min - 15min < 1min AND 10min - 30min < 1min
    expect(decrementBtns[0].disabled).toBe(true);
    expect(decrementBtns[1].disabled).toBe(true);
  });

  it('should enable -15m but disable -30m when remaining time is 20 minutes', async () => {
    const resumeAt20min = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: resumeAt20min,
    });
    const decrementBtns = el.shadowRoot.querySelectorAll('.adjust-btn.decrement');
    // 20min - 15min = 5min > 1min -- enabled
    expect(decrementBtns[0].disabled).toBe(false);
    // 20min - 30min = -10min < 1min -- disabled
    expect(decrementBtns[1].disabled).toBe(true);
  });

  it('should have _isDecrementDisabled method that computes correctly', () => {
    const el = new AutoSnoozeAdjustModal();
    // No resumeAt set -- always disabled
    expect(el._isDecrementDisabled(15 * 60 * 1000)).toBe(true);

    // 2 hours remaining, 15 min threshold -- not disabled
    el.resumeAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(el._isDecrementDisabled(15 * 60 * 1000)).toBe(false);
    expect(el._isDecrementDisabled(30 * 60 * 1000)).toBe(false);

    // 2 minutes remaining, 15 min threshold -- disabled
    el.resumeAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    expect(el._isDecrementDisabled(15 * 60 * 1000)).toBe(true);
  });

  it('should clean up timers on disconnect', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    // Timer should be running
    expect(el._countdownState.interval !== null || el._countdownState.syncTimeout !== null).toBe(true);
    // Disconnect
    el.remove();
    expect(el._countdownState.interval).toBeNull();
    expect(el._countdownState.syncTimeout).toBeNull();
  });

  it('should have entityIds and friendlyNames properties defaulting to empty arrays', () => {
    const el = new AutoSnoozeAdjustModal();
    expect(el.entityIds).toEqual([]);
    expect(el.friendlyNames).toEqual([]);
  });

  it('should have _isGroupMode returning false for 0-1 entityIds and true for 2+', () => {
    const el = new AutoSnoozeAdjustModal();
    expect(el._isGroupMode).toBe(false);
    el.entityIds = ['automation.one'];
    expect(el._isGroupMode).toBe(false);
    el.entityIds = ['automation.one', 'automation.two'];
    expect(el._isGroupMode).toBe(true);
  });

  it('should fire adjust-time with entityIds array in group mode', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: '',
      entityIds: ['automation.a', 'automation.b'],
      friendlyNames: ['Auto A', 'Auto B'],
      resumeAt: futureResumeAt(),
    });
    let firedDetail = null;
    el.addEventListener('adjust-time', (e) => { firedDetail = e.detail; });
    const incrementBtn = el.shadowRoot.querySelector('.adjust-btn.increment');
    incrementBtn.click();
    expect(firedDetail).not.toBeNull();
    expect(firedDetail.entityIds).toEqual(['automation.a', 'automation.b']);
    expect(firedDetail.entityId).toBeUndefined();
    expect(firedDetail.minutes).toBe(15);
  });

  it('should show group title with count in group mode', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: '',
      entityIds: ['automation.a', 'automation.b', 'automation.c'],
      friendlyNames: ['Auto A', 'Auto B', 'Auto C'],
      resumeAt: futureResumeAt(),
    });
    const title = el.shadowRoot.querySelector('.modal-title');
    expect(title.textContent).toContain('3');
  });

  it('should show subtitle with friendly names in group mode', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: '',
      entityIds: ['automation.a', 'automation.b'],
      friendlyNames: ['Auto A', 'Auto B'],
      resumeAt: futureResumeAt(),
    });
    const subtitle = el.shadowRoot.querySelector('.modal-subtitle');
    expect(subtitle).not.toBeNull();
    expect(subtitle.textContent).toContain('Auto A');
    expect(subtitle.textContent).toContain('Auto B');
  });

  it('should fire adjust-time with entityId in single mode (backward compat)', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
      entityIds: [],
    });
    let firedDetail = null;
    el.addEventListener('adjust-time', (e) => { firedDetail = e.detail; });
    const incrementBtn = el.shadowRoot.querySelector('.adjust-btn.increment');
    incrementBtn.click();
    expect(firedDetail.entityId).toBe('automation.test');
    expect(firedDetail.entityIds).toBeUndefined();
  });

  it('should fire adjust-time with entityIds when entityIds has exactly 1 element', async () => {
    // Bug: when a group is reduced to 1 automation (e.g., after adjusting one in a pair),
    // _isGroupMode is false (length > 1 fails), so _fireAdjustTime uses this.entityId
    // which is '' (set by _handleAdjustGroupEvent). This sends an empty entity_id to HA.
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: '',
      entityIds: ['automation.remaining'],
      friendlyNames: ['Remaining Auto'],
      resumeAt: futureResumeAt(),
    });
    let firedDetail = null;
    el.addEventListener('adjust-time', (e) => { firedDetail = e.detail; });
    const incrementBtn = el.shadowRoot.querySelector('.adjust-btn.increment');
    incrementBtn.click();
    expect(firedDetail).not.toBeNull();
    expect(firedDetail.entityIds).toEqual(['automation.remaining']);
    expect(firedDetail.entityId).toBeUndefined();
  });

  it('should NOT show subtitle in single mode', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityId: 'automation.test',
      friendlyName: 'Test',
      resumeAt: futureResumeAt(),
    });
    const subtitle = el.shadowRoot.querySelector('.modal-subtitle');
    expect(subtitle).toBeNull();
  });

  it('should disable decrement buttons in group mode when time is short', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal', {
      open: true,
      entityIds: ['automation.a', 'automation.b'],
      friendlyNames: ['A', 'B'],
      resumeAt: shortResumeAt(),
    });
    const decrementBtns = el.shadowRoot.querySelectorAll('.adjust-btn.decrement');
    expect(decrementBtns[0].disabled).toBe(true);
    expect(decrementBtns[1].disabled).toBe(true);
  });
});

describe('adjustSnooze service wrapper', () => {
  it('should accept an array of entity IDs and pass them to callService', async () => {
    const { adjustSnooze } = await import('../src/services/snooze.js');
    const mockHass = createMockHass();
    await adjustSnooze(mockHass, ['automation.a', 'automation.b'], { minutes: 15 });
    expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'adjust', {
      entity_id: ['automation.a', 'automation.b'],
      minutes: 15,
    });
  });
});
