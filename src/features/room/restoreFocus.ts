/**
 * Return focus to the element that opened an overlay (WCAG 2.4.3). A plain
 * <button> just takes focus — but an Ionic host like <ion-button> is a custom
 * element whose own `.focus()` is a no-op; the real focusable is a native
 * <button>/<a> inside its shadow root. So for a custom element (tag has a `-`),
 * focus that inner control; otherwise focus the element directly. No-op if the
 * opener is gone. Kept pure-ish (only touches the passed node) + unit-testable.
 */
export function restoreFocus(el: HTMLElement | null | undefined): void {
  if (!el || typeof el.focus !== 'function') return;
  const isCustomElement = el.tagName.includes('-');
  const inner = isCustomElement
    ? el.shadowRoot?.querySelector<HTMLElement>('button, a[href], [tabindex]')
    : null;
  (inner ?? el).focus();
}
