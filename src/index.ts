/**
 * AutoSnooze Card Entry Point.
 * Registers custom elements and exports components.
 */

import { AutomationPauseCard, AutomationPauseCardEditor, AutoSnoozeActivePauses, AutoSnoozeDurationSelector, AutoSnoozeAutomationList, AutoSnoozeAdjustModal } from './components/index.js';
import { CARD_VERSION } from './constants/index.js';
// Import types for global Window augmentation
import './types/card.js';

// Register custom elements
if (!customElements.get('autosnooze-card-editor')) {
  customElements.define('autosnooze-card-editor', AutomationPauseCardEditor);
}
if (!customElements.get('autosnooze-active-pauses')) {
  customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
}
if (!customElements.get('autosnooze-duration-selector')) {
  customElements.define('autosnooze-duration-selector', AutoSnoozeDurationSelector);
}
if (!customElements.get('autosnooze-automation-list')) {
  customElements.define('autosnooze-automation-list', AutoSnoozeAutomationList);
}
if (!customElements.get('autosnooze-adjust-modal')) {
  customElements.define('autosnooze-adjust-modal', AutoSnoozeAdjustModal);
}
if (!customElements.get('autosnooze-card')) {
  customElements.define('autosnooze-card', AutomationPauseCard);
}

// Register for the manual card picker
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === 'autosnooze-card')) {
  window.customCards.push({
    type: 'autosnooze-card',
    name: 'AutoSnooze Card',
    description: `Temporarily pause automations with area and label filtering (v${CARD_VERSION})`,
    preview: true,
  });
}

// Export components
export { AutomationPauseCard, AutomationPauseCardEditor, AutoSnoozeActivePauses, AutoSnoozeDurationSelector, AutoSnoozeAutomationList, AutoSnoozeAdjustModal };
