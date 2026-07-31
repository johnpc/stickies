import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useScrollLock } from './useScrollLock';

function Locker() {
  useScrollLock();
  return null;
}

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

describe('useScrollLock', () => {
  it('sets body overflow hidden while mounted and restores on unmount', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(<Locker />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('disables every ion-content scroll while mounted and restores it on unmount', () => {
    // jsdom has no <ion-content>; a stand-in element with a scrollY flag models
    // Ionic's scroll surface (a plain body overflow lock does NOT stop it).
    const content = document.createElement('ion-content') as HTMLElement & { scrollY?: boolean };
    content.scrollY = true;
    document.body.appendChild(content);

    const { unmount } = render(<Locker />);
    expect(content.scrollY).toBe(false); // locked
    unmount();
    expect(content.scrollY).toBe(true); // restored
  });
});
