import { afterEach, describe, expect, it } from 'vitest';
import { restoreFocus } from './restoreFocus';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('restoreFocus', () => {
  it('focuses a plain button directly', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    restoreFocus(btn);
    expect(document.activeElement).toBe(btn);
  });

  it('focuses the native control inside a custom element (e.g. ion-button) shadow root', () => {
    // Model an <ion-button> host whose own focus() is a no-op; the real focusable
    // is a <button> in its shadow root.
    const host = document.createElement('ion-button') as HTMLElement & { focus: () => void };
    host.focus = () => {}; // custom-element host doesn't take focus itself
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('button');
    shadow.appendChild(inner);
    document.body.appendChild(host);

    restoreFocus(host);
    // Focus landed on the shadow button (activeElement is the host; the shadow's
    // activeElement is the real target).
    expect(document.activeElement).toBe(host);
    expect(shadow.activeElement).toBe(inner);
  });

  it('is a no-op for null / an element without focus()', () => {
    expect(() => restoreFocus(null)).not.toThrow();
    expect(() => restoreFocus(undefined)).not.toThrow();
  });
});
