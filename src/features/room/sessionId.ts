const KEY = 'stickies:session';

/** A stable per-TAB id used to key this viewer's presence row. Stored in
 * sessionStorage so each browser tab counts as one presence (a reload keeps the
 * same id; a new tab is a new viewer). Lazily created. */
export function getSessionId(): string {
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    // Not security-sensitive; a time+random token is plenty unique per tab.
    id = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}
