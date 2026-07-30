import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, useLocation } from 'react-router-dom';
import { RoomEntry } from './RoomEntry';

/** Echoes the current path so we can assert navigation without importing the
 * `history` package directly. */
function LocationProbe() {
  const location = useLocation();
  return <span data-testid="path">{location.pathname}</span>;
}

function renderEntry() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <RoomEntry />
      <Route path="*">
        <LocationProbe />
      </Route>
    </MemoryRouter>,
  );
}

describe('RoomEntry', () => {
  it('navigates to the normalized room slug on submit', () => {
    renderEntry();
    fireEvent.change(screen.getByTestId('room-entry-input'), { target: { value: 'Grocery List' } });
    fireEvent.click(screen.getByTestId('room-entry-go'));
    expect(screen.getByTestId('path')).toHaveTextContent('/grocery-list');
  });

  it('disables the go button when the input has no usable slug', () => {
    renderEntry();
    expect(screen.getByTestId('room-entry-go')).toBeDisabled();
    fireEvent.change(screen.getByTestId('room-entry-input'), { target: { value: '!!!' } });
    expect(screen.getByTestId('room-entry-go')).toBeDisabled();
  });

  it('does not navigate for empty input on submit', () => {
    renderEntry();
    fireEvent.submit(screen.getByTestId('room-entry'));
    expect(screen.getByTestId('path')).toHaveTextContent('/');
  });
});
