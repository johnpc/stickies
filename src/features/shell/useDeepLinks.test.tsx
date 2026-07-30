import { render, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useDeepLinks } from './useDeepLinks';

const { addListener, remove } = vi.hoisted(() => ({ addListener: vi.fn(), remove: vi.fn() }));
vi.mock('@capacitor/app', () => ({ App: { addListener } }));

let lastPath = '';
function Probe() {
  useDeepLinks();
  lastPath = useLocation().pathname;
  return null;
}

beforeEach(() => {
  addListener.mockReset();
  remove.mockReset();
  lastPath = '';
});

describe('useDeepLinks', () => {
  it('navigates to the room path from an incoming appUrlOpen link', () => {
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
});
