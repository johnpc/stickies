import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { InvalidRoom } from './InvalidRoom';

describe('InvalidRoom', () => {
  it('explains the problem and offers the room-name entry box', () => {
    render(
      <MemoryRouter>
        <InvalidRoom />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('invalid-room')).toHaveTextContent(/room name/i);
    expect(screen.getByTestId('room-entry-input')).toBeInTheDocument();
  });
});
