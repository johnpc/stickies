/**
 * Room-slug normalization. A room is just an identifier in the URL, so we
 * canonicalize whatever the visitor typed into a single stable slug: two people
 * who type "Grocery List", "grocery-list", and "grocery list" all land in the
 * same room. Pure + injected-input, so it's fully unit-testable.
 */

const MAX_SLUG_LENGTH = 60;

/**
 * Canonical slug for a raw room name (from the URL or an input box):
 * lowercased, trimmed, spaces/underscores → hyphens, only [a-z0-9-] kept,
 * collapsed + trimmed hyphens, capped at MAX_SLUG_LENGTH. Returns '' when the
 * input has no usable characters (caller treats that as "no room").
 */
export function normalizeRoomSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-$/, '');
}

/** A human-friendly title for a slug — "grocery-list" → "Grocery List". */
export function prettifyRoomSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
