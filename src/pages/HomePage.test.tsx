import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../features/shell/useTheme';

const { useRecentRooms } = vi.hoisted(() => ({ useRecentRooms: vi.fn() }));
vi.mock('../features/room/useRecentRooms', () => ({ useRecentRooms }));

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
});
