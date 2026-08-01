import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../features/shell/useTheme';

const { useRecentRooms } = vi.hoisted(() => ({ useRecentRooms: vi.fn() }));
vi.mock('../features/room/useRecentRooms', () => ({ useRecentRooms }));

// Ionic fires useIonViewWillEnter only inside an IonRouterOutlet, which the test
// harness has none of. Stub it to run its callback on mount so we can assert
// HomePage refetches the recents feed whenever the (cached) view becomes active.
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  const { useEffect } = await import('react');
  return { ...actual, useIonViewWillEnter: (cb: () => void) => useEffect(() => cb(), [cb]) };
});

import { HomePage } from './HomePage';

const renderHome = () =>
  render(
    <ThemeProvider>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </ThemeProvider>,
  );

beforeEach(() => useRecentRooms.mockReset());

describe('HomePage', () => {
  it('explains how it works and lists recent rooms', () => {
    useRecentRooms.mockReturnValue({
      rooms: [{ id: 'a', slug: 'grocery-list', stickyCount: 2 }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderHome();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('room-entry')).toBeInTheDocument();
    expect(screen.getByText('Grocery List')).toBeInTheDocument();
  });

  it('refetches the recents feed when the view becomes active (Ionic keeps it mounted)', () => {
    const refetch = vi.fn();
    useRecentRooms.mockReturnValue({ rooms: [], isLoading: false, isError: false, refetch });
    renderHome();
    // Regression: returning Home in-app never remounts the page, so without a
    // view-enter refetch the feed showed a stale snapshot (missing the room you
    // just edited). The stubbed useIonViewWillEnter must drive refetch.
    expect(refetch).toHaveBeenCalled();
  });

  it('shows an empty state when there are no rooms yet', () => {
    useRecentRooms.mockReturnValue({
      rooms: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderHome();
    expect(screen.getByTestId('load-empty')).toHaveTextContent('No rooms yet');
  });

  it('shows a retryable error when the feed fails to load with nothing cached', () => {
    useRecentRooms.mockReturnValue({
      rooms: [],
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });
    renderHome();
    expect(screen.getByTestId('load-error')).toBeInTheDocument();
  });

  it('keeps showing cached rooms when a BACKGROUND refetch errors (no full-screen blank)', () => {
    // Regression: returning home refetches the feed (useIonViewWillEnter); if that
    // background refetch flakes, react-query flips to error while still holding the
    // rooms. Gating LoadState on isError alone blanked a populated, still-valid feed.
    useRecentRooms.mockReturnValue({
      rooms: [{ id: 'a', slug: 'grocery-list', stickyCount: 2 }],
      isLoading: false,
      isError: true, // background refetch failed, but rooms are cached
      refetch: vi.fn(),
    });
    renderHome();
    expect(screen.getByText('Grocery List')).toBeInTheDocument(); // feed still shown
    expect(screen.queryByTestId('load-error')).not.toBeInTheDocument(); // no error screen
  });
});
