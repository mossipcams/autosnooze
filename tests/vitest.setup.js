/**
 * Vitest setup file for testing Lit components
 * Provides browser API mocks needed for LitElement
 */

import { vi } from 'vitest';

// Mock customElements if not fully supported by jsdom
if (!window.customElements) {
  window.customElements = {
    define: vi.fn(),
    get: vi.fn(),
    whenDefined: vi.fn().mockResolvedValue(undefined),
  };
}

// Store original customElements.define to track registrations
const originalDefine = window.customElements.define.bind(window.customElements);
const registeredElements = new Map();

window.customElements.define = function (name, constructor, options) {
  if (!registeredElements.has(name)) {
    registeredElements.set(name, constructor);
    try {
      originalDefine(name, constructor, options);
    } catch (e) {
      // Element already defined, ignore
      if (!e.message.includes('already been defined')) {
        throw e;
      }
    }
  }
};

window.customElements.get = function (name) {
  return registeredElements.get(name);
};

// Mock window.customCards for the card registration
window.customCards = window.customCards || [];

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = MockResizeObserver;

// Mock MutationObserver if needed
if (!window.MutationObserver) {
  window.MutationObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

// Mock requestAnimationFrame
window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
window.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock CSS.supports if not available
if (!window.CSS) {
  window.CSS = {
    supports: () => true,
  };
}

// Mock adoptedStyleSheets (Constructable Stylesheets)
if (!document.adoptedStyleSheets) {
  document.adoptedStyleSheets = [];
}

// Mock CSSStyleSheet if not supporting constructable stylesheets
if (!window.CSSStyleSheet.prototype.replaceSync) {
  window.CSSStyleSheet.prototype.replaceSync = function (cssText) {
    // No-op for testing
  };
}

// Helper to create a mock Home Assistant object
global.createMockHass = (overrides = {}) => {
  return {
    states: {},
    entities: {},
    areas: {},
    connection: {
      sendMessagePromise: vi.fn().mockResolvedValue([]),
    },
    callService: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

// Helper to wait for Lit element updates
global.waitForLitUpdate = async (element) => {
  await element.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
};

// Helper to create and connect a custom element
global.createAndConnectElement = async (tagName, properties = {}) => {
  const element = document.createElement(tagName);
  Object.assign(element, properties);
  document.body.appendChild(element);
  await global.waitForLitUpdate(element);
  return element;
};

// Suppress unhandled Lit errors during testing
// These occur when modifying component state during tests and are harmless
const originalOnUnhandledRejection = process.listeners('unhandledRejection');
process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', (reason) => {
  // Suppress Lit's ChildPart errors which are expected during component testing
  if (reason?.message?.includes('ChildPart') || reason?.message?.includes('parentNode')) {
    return; // Suppress this expected error
  }
  // Re-throw other unhandled rejections
  throw reason;
});

// Clean up after each test
afterEach(() => {
  // Clear body of any created elements
  document.body.innerHTML = '';
  // Clear custom cards
  window.customCards = [];
});
