/**
 * AutoSnooze Card Entry Point.
 * Registers custom elements and exports components.
 */

import { AutomationPauseCard, AutomationPauseCardEditor } from './components/index.js';
import { CARD_VERSION } from './constants/index.js';
// Import types for global Window augmentation
import './types/card.js';

// Register custom elements
if (!customElements.get('autosnooze-card-editor')) {
  customElements.define('autosnooze-card-editor', AutomationPauseCardEditor);
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
export { AutomationPauseCard, AutomationPauseCardEditor };
