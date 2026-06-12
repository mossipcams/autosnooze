import { UI_TIMING } from '../constants/index.js';
import { defineAutoSnoozeElement } from '../utils/custom-element-registration.js';

export class AutoSnoozeToast extends HTMLElement {
  private durationTimer?: ReturnType<typeof setTimeout>;
  private fadeTimer?: ReturnType<typeof setTimeout>;

  show(message: string, undoText: string, undoAria = undoText, undo?: () => void): void {
    this.clear();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');
    if (undo) {
      const text = document.createElement('span');
      text.textContent = message;
      toast.appendChild(text);
      const button = document.createElement('button');
      button.className = 'toast-undo-btn';
      button.textContent = undoText;
      button.setAttribute('aria-label', undoAria);
      button.onclick = (event) => {
        event.stopPropagation();
        undo();
        this.clear();
      };
      toast.appendChild(button);
    } else {
      toast.textContent = message;
    }
    this.appendChild(toast);
    this.durationTimer = setTimeout(() => {
      toast.style.animation = `slideUp ${UI_TIMING.TOAST_FADE_MS}ms ease-out reverse`;
      this.fadeTimer = setTimeout(() => this.clear(), UI_TIMING.TOAST_FADE_MS);
      this.durationTimer = undefined;
    }, UI_TIMING.TOAST_DURATION_MS);
  }

  disconnectedCallback(): void {
    this.clear();
  }

  private clear(): void {
    if (this.durationTimer !== undefined) clearTimeout(this.durationTimer);
    if (this.fadeTimer !== undefined) clearTimeout(this.fadeTimer);
    this.durationTimer = this.fadeTimer = undefined;
    this.replaceChildren();
  }
}

defineAutoSnoozeElement('autosnooze-toast', AutoSnoozeToast);
