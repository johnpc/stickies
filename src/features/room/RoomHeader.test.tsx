import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../shell/useTheme';

// PresenceBadge hits the Amplify client — stub it out.
vi.mock('./usePresence', () => ({ usePresence: () => 1 }));

import { RoomHeader } from './RoomHeader';

const renderHeader = (room: string, count: number) =>
  render(
    <ThemeProvider>
      <MemoryRouter>
        <RoomHeader room={room} count={count} />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('RoomHeader', () => {
  it('shows the prettified room name and the sticky count', () => {
    renderHeader('grocery-list', 3);
    expect(screen.getByTestId('room-title')).toHaveTextContent('Grocery List');
    expect(screen.getByTestId('room-count')).toHaveTextContent('· 3');
  });

  it('keeps the count in its own element so a long name cannot truncate it', () => {
    // The bug: name + count in one nowrap/ellipsis IonTitle clipped the count.
    // The count must be a SEPARATE element from the (ellipsizing) title span.
    renderHeader('a-very-long-quarterly-planning-project-room-name', 7);
    const title = screen.getByTestId('room-title');
    const count = screen.getByTestId('room-count');
    expect(count).not.toBe(title);
    expect(title).not.toContainElement(count);
    expect(count).toHaveTextContent('· 7');
  });
});
