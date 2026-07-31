import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResizeButton } from './ResizeButton';

describe('ResizeButton', () => {
  it('reflects the current size and announces the next in its label', () => {
    render(<ResizeButton current="M" onResize={vi.fn()} />);
    const btn = screen.getByTestId('sticky-resize');
    expect(btn).toHaveAttribute('data-size', 'M');
    expect(btn).toHaveAttribute('aria-label', expect.stringContaining('medium'));
    expect(btn).toHaveAttribute('aria-label', expect.stringContaining('large'));
  });

  it('calls onResize with the NEXT size in the cycle', () => {
    const onResize = vi.fn();
    render(<ResizeButton current="M" onResize={onResize} />);
    fireEvent.click(screen.getByTestId('sticky-resize'));
    expect(onResize).toHaveBeenCalledWith('L');
  });

  it('wraps L back to S', () => {
    const onResize = vi.fn();
    render(<ResizeButton current="L" onResize={onResize} />);
    fireEvent.click(screen.getByTestId('sticky-resize'));
    expect(onResize).toHaveBeenCalledWith('S');
  });
});
