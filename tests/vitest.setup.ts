/**
 * Vitest setup file for testing Lit components
 * Provides browser API mocks needed for LitElement
 */

import { vi, afterEach } from 'vitest';
import type { HomeAssistant } from '../src/types/hass.js';

// Extend Window interface for test globals - uses CustomCardEntry from src/types/card.ts
declare global {
  interface Window {
    customCards?: import('../src/types/card.js').CustomCardEntry[];
  }
  function createMockHass(overrides?: Partial<HomeAssistant>): HomeAssistant;
  function waitForLitUpdate(element: { updateComplete: Promise<boolean> }): Promise<void>;
  function createAndConnectElement<T extends HTMLElement>(
    tagName: string,
    properties?: Record<string, unknown>
  ): Promise<T>;
}

// Mock customElements if not fully supported by jsdom
if (!window.customElements) {
  (window as Window & { customElements: CustomElementRegistry }).customElements = {
    define: vi.fn(),
    get: vi.fn(),
    whenDefined: vi.fn().mockResolvedValue(undefined),
  } as unknown as CustomElementRegistry;
}

// Store original customElements.define to track registrations
const originalDefine = window.customElements.define.bind(window.customElements);
const registeredElements = new Map<string, CustomElementConstructor>();

window.customElements.define = function (
  name: string,
  constructor: CustomElementConstructor,
  options?: ElementDefinitionOptions
): void {
  if (!registeredElements.has(name)) {
    registeredElements.set(name, constructor);
    try {
      originalDefine(name, constructor, options);
    } catch (e) {
      // Element already defined, ignore
      if (!(e instanceof Error) || !e.message.includes('already been defined')) {
        throw e;
      }
    }
  }
};

window.customElements.get = function (name: string): CustomElementConstructor | undefined {
  return registeredElements.get(name);
};

// Mock window.customCards for the card registration
window.customCards = window.customCards || [];

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock MutationObserver if needed
if (!window.MutationObserver) {
  (window as Window & { MutationObserver: typeof MutationObserver }).MutationObserver = class {
    callback: MutationCallback;
    constructor(callback: MutationCallback) {
      this.callback = callback;
    }
    observe(): void {}
    disconnect(): void {}
    takeRecords(): MutationRecord[] {
      return [];
    }
  } as unknown as typeof MutationObserver;
}

// Mock requestAnimationFrame
window.requestAnimationFrame = (callback: FrameRequestCallback): number =>
  setTimeout(callback, 0) as unknown as number;
window.cancelAnimationFrame = (id: number): void => clearTimeout(id);

// Mock CSS.supports if not available
if (!window.CSS) {
  (window as Window & { CSS: typeof CSS }).CSS = {
    supports: () => true,
  } as unknown as typeof CSS;
}

// Mock adoptedStyleSheets (Constructable Stylesheets)
if (!document.adoptedStyleSheets) {
  (document as Document & { adoptedStyleSheets: CSSStyleSheet[] }).adoptedStyleSheets = [];
}

// Mock CSSStyleSheet if not supporting constructable stylesheets
if (!window.CSSStyleSheet.prototype.replaceSync) {
  window.CSSStyleSheet.prototype.replaceSync = function (): void {
    // No-op for testing
  };
}

// Helper to create a mock Home Assistant object
globalThis.createMockHass = (overrides: Partial<HomeAssistant> = {}): HomeAssistant => {
  return {
    states: {},
    entities: {},
    areas: {},
    connection: {
      sendMessagePromise: vi.fn().mockResolvedValue([]),
    },
    callService: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as HomeAssistant;
};

// Helper to wait for Lit element updates
globalThis.waitForLitUpdate = async (element: { updateComplete: Promise<boolean> }): Promise<void> => {
  await element.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
};

// Helper to create and connect a custom element
globalThis.createAndConnectElement = async <T extends HTMLElement>(
  tagName: string,
  properties: Record<string, unknown> = {}
): Promise<T> => {
  const element = document.createElement(tagName) as T;
  Object.assign(element, properties);
  document.body.appendChild(element);
  await globalThis.waitForLitUpdate(element as unknown as { updateComplete: Promise<boolean> });
  return element;
};

// Suppress unhandled Lit errors during testing
// These occur when modifying component state during tests and are harmless
process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', (reason: unknown) => {
  // Suppress Lit's ChildPart errors which are expected during component testing
  if (
    reason instanceof Error &&
    (reason.message.includes('ChildPart') || reason.message.includes('parentNode'))
  ) {
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
