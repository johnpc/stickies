/**
 * Room-slug normalization. A room is just an identifier in the URL, so we
 * canonicalize whatever the visitor typed into a single stable slug: two people
 * who type "Grocery List", "grocery-list", and "grocery list" all land in the
 * same room. Pure + injected-input, so it's fully unit-testable.
 */

const MAX_SLUG_LENGTH = 60;

/**
 * Canonical slug for a raw room name (from the URL or an input box):
 * lowercased, trimmed, spaces/underscores → hyphens, then reduced to letters +
 * digits + hyphens, collapsed + trimmed, capped at MAX_SLUG_LENGTH. Returns ''
 * when the input has no usable characters (caller treats that as "no room").
 *
 * Unicode-aware so a global tool doesn't mangle names: accented Latin is folded
 * to ASCII (`Café` → `cafe`) via NFD decomposition, and non-Latin letters/digits
 * are KEPT (`日本語` stays `日本語`) rather than stripped — only punctuation,
 * symbols, and emoji are dropped. Two people typing the same name still converge.
 */
export function normalizeRoomSlug(raw: string): string {
  return raw
    .normalize('NFKD') // split accented letters into base + combining mark…
    .replace(/[̀-ͯ]/g, '') // …then drop the marks (Café → Cafe)
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '') // keep any-script letters/digits + hyphen; drop the rest
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
