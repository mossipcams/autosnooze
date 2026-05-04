/**
 * Registry display helpers shared by low-level state and feature slices.
 */

export function formatRegistryId(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
