import { render, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useDeepLinks } from './useDeepLinks';

const { addListener, remove, getLaunchUrl } = vi.hoisted(() => ({
  addListener: vi.fn(),
  remove: vi.fn(),
  getLaunchUrl: vi.fn(),
}));
vi.mock('@capacitor/app', () => ({ App: { addListener, getLaunchUrl } }));

let lastPath = '';
function Probe() {
  useDeepLinks();
  lastPath = useLocation().pathname;
  return null;
}

beforeEach(() => {
  addListener.mockReset();
  remove.mockReset();
  getLaunchUrl.mockReset();
  // Defaults: listener resolves to a removable handle; no cold-start launch URL.
  addListener.mockResolvedValue({ remove });
  getLaunchUrl.mockResolvedValue(undefined);
  lastPath = '';
});

describe('useDeepLinks', () => {
  it('navigates to the room path from an incoming appUrlOpen link (warm start)', () => {
    let fire: (e: { url: string }) => void = () => {};
    addListener.mockImplementation((_event: string, cb: (e: { url: string }) => void) => {
      fire = cb;
      return Promise.resolve({ remove });
    });
    render(
      <MemoryRouter initialEntries={['/']}>
        <Probe />
      </MemoryRouter>,
    );
    expect(addListener).toHaveBeenCalledWith('appUrlOpen', expect.any(Function));
    act(() => fire({ url: 'https://stickies.jpc.io/team' }));
    expect(lastPath).toBe('/team');
  });

  it('routes a COLD-START launch URL to the shared room (getLaunchUrl)', async () => {
    // Regression: the hook only wired appUrlOpen, which fires before React mounts
    // on a cold start — so tapping a shared link while the app was closed dropped
    // the URL and booted to home. getLaunchUrl recovers the launch URL on mount.
    getLaunchUrl.mockResolvedValue({ url: 'https://stickies.jpc.io/standup' });
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Probe />
        </MemoryRouter>,
      );
    });
    expect(lastPath).toBe('/standup');
  });

  it('does not navigate on a cold start with no link or the bare domain', async () => {
    getLaunchUrl.mockResolvedValue({ url: 'https://stickies.jpc.io/' }); // bare domain → "/"
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Probe />
        </MemoryRouter>,
      );
    });
    expect(lastPath).toBe('/'); // stays home, not pushed anywhere
  });
});
