/** Max auto-grow height for the sticky editor textarea (px). Past this it stops
 * growing and scrolls — matches the rendered note's ~320px cap so composing and
 * viewing feel consistent. */
export const EDITOR_MAX_HEIGHT = 320;

/**
 * Size a textarea to fit its content (up to `max`), then let it scroll. Reset to
 * 'auto' first so it can SHRINK when text is deleted, not just grow. Without this
 * a long note is edited in a cramped fixed-height box. Guards a null ref.
 */
export function autoGrow(el: HTMLTextAreaElement | null, max = EDITOR_MAX_HEIGHT): void {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, max)}px`;
}
