/**
 * AutoSnooze Card Entry Point.
 * Registers custom elements and exports components.
 */

import {
  AutomationPauseCard,
  AutoSnoozeSnoozedCard,
  AutomationPauseCardEditor,
  AutoSnoozeActivePauses,
  AutoSnoozeDurationSelector,
  AutoSnoozeAutomationList,
  AutoSnoozeAdjustModal,
} from './components/index.js';
import { registerAutoSnoozeCard } from './registration.js';
// Import types for global Window augmentation
import './types/card.js';

registerAutoSnoozeCard();

// Export components
export {
  AutomationPauseCard,
  AutoSnoozeSnoozedCard,
  AutomationPauseCardEditor,
  AutoSnoozeActivePauses,
  AutoSnoozeDurationSelector,
  AutoSnoozeAutomationList,
  AutoSnoozeAdjustModal,
};
