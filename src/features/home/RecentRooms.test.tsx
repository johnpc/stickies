import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RecentRooms } from './RecentRooms';
import type { RoomRecord } from '../../lib/dataClient';

const rooms = [
  { id: 'grocery-list', slug: 'grocery-list', stickyCount: 1 },
  { id: 'trip-ideas', slug: 'trip-ideas', stickyCount: 4 },
] as RoomRecord[];

describe('RecentRooms', () => {
  it('renders a link per room with a prettified title and count', () => {
    render(
      <MemoryRouter>
        <RecentRooms rooms={rooms} />
      </MemoryRouter>,
    );
    const items = screen.getAllByTestId('recent-room');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Grocery List');
    expect(items[0]).toHaveTextContent('1 sticky');
    expect(items[1]).toHaveTextContent('4 stickies');
    expect(items[0]).toHaveAttribute('href', '/grocery-list');
  });
});
