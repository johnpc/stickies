import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  it('renders a swatch per palette color and marks the current one active', () => {
    render(<ColorPicker current="blue" onPick={vi.fn()} />);
    expect(screen.getByTestId('color-picker').querySelectorAll('.color-swatch')).toHaveLength(5);
    expect(screen.getByTestId('color-blue')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('color-yellow')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onPick with the chosen color', () => {
    const onPick = vi.fn();
    render(<ColorPicker current="yellow" onPick={onPick} />);
    fireEvent.click(screen.getByTestId('color-pink'));
    expect(onPick).toHaveBeenCalledWith('pink');
  });
});
