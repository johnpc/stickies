import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route } from 'react-router-dom';
import { ThemeProvider } from '../features/shell/useTheme';

const { useStickyArrange } = vi.hoisted(() => ({ useStickyArrange: vi.fn() }));
vi.mock('../features/room/useStickyArrange', () => ({ useStickyArrange }));

const { useRoomStickies, useStickyMutations } = vi.hoisted(() => ({
  useRoomStickies: vi.fn(),
  useStickyMutations: vi.fn(),
}));
vi.mock('../features/room/useRoomStickies', () => ({ useRoomStickies }));
vi.mock('../features/room/useStickyMutations', () => ({ useStickyMutations }));
// PresenceBadge (in RoomHeader) hits the Amplify client; stub it out.
vi.mock('../features/room/usePresence', () => ({ usePresence: () => 0 }));

import { RoomPage } from './RoomPage';

const add = { mutate: vi.fn() };
const addMedia = { mutate: vi.fn() };
const edit = { mutate: vi.fn() };
const remove = { mutate: vi.fn() };

const renderRoom = (path = '/grocery-list') =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Route path="/:room">
          <RoomPage />
        </Route>
      </MemoryRouter>
    </ThemeProvider>,
  );

beforeEach(() => {
  [add.mutate, addMedia.mutate, edit.mutate, remove.mutate].forEach((m) => m.mockClear());
  useStickyMutations.mockReturnValue({ add, addMedia, edit, remove });
  useStickyArrange.mockReturnValue({ recolor: { mutate: vi.fn() }, reorder: { mutate: vi.fn() } });
});

describe('RoomPage', () => {
  it('renders the room title from the URL slug and its stickies', () => {
    useRoomStickies.mockReturnValue({
      stickies: [{ id: '1', room: 'grocery-list', kind: 'TEXT', content: 'milk', color: 'yellow' }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderRoom();
    expect(screen.getByTestId('room-title')).toHaveTextContent('Grocery List');
    expect(screen.getByText('milk')).toBeInTheDocument();
  });

  it('adds a sticky through the composer', async () => {
    useRoomStickies.mockReturnValue({
      stickies: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderRoom();
    fireEvent.click(screen.getByTestId('sticky-add'));
    const input = screen.getByTestId('sticky-input');
    fireEvent.change(input, { target: { value: 'buy milk' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(add.mutate).toHaveBeenCalledWith('buy milk'));
  });

  it('shows a retryable error state when the pad fails to load', () => {
    const refetch = vi.fn();
    useRoomStickies.mockReturnValue({ stickies: [], isLoading: false, isError: true, refetch });
    renderRoom();
    expect(screen.getByTestId('load-error')).toBeInTheDocument();
  });
});
