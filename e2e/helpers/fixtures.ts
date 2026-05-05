import { expect, test as base } from '@playwright/test';
import { AutoSnoozeCard } from '../pages/AutoSnoozeCard';
import { routeLocalCardResource } from './ha';

export { expect };

export const VISUAL_VIEWPORTS = [
  { name: 'mobile', width: 411, height: 915 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
] as const;

export const VISUAL_THEMES = [
  { name: 'light', theme: 'default', dark: false },
  { name: 'dark', theme: 'default', dark: true },
  { name: 'community', theme: process.env.HA_COMMUNITY_THEME || 'AutoSnooze Visual Fixture', dark: false },
] as const;

export const CARD_CONFIG_VARIANTS = [
  { name: 'default-title', config: { type: 'custom:autosnooze-card' } },
  { name: 'custom-title', config: { type: 'custom:autosnooze-card', title: 'AutoSnooze Visual Test' } },
  {
    name: 'long-title',
    config: {
      type: 'custom:autosnooze-card',
      title: 'AutoSnooze Visual Regression Coverage With An Intentionally Long Title',
    },
  },
] as const;

export const LAYOUT_VARIANTS = ['sections', 'masonry', 'panel'] as const;

export const GRID_SPANS = [
  { name: 'span-1', width: 320 },
  { name: 'span-2', width: 640 },
  { name: 'span-4', width: 960 },
  { name: 'full-width', width: 1280 },
] as const;

export const authenticatedVisualTest = base.extend<{ autosnoozeCard: AutoSnoozeCard }>({
  page: async ({ page }, use) => {
    await routeLocalCardResource(page);
    await use(page);
  },
  autosnoozeCard: async ({ page }, use) => {
    const card = new AutoSnoozeCard(page);
    await card.goto();
    await use(card);
  },
});
