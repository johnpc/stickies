import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Lightbox } from './Lightbox';

describe('Lightbox', () => {
  it('renders its title + children', () => {
    render(
      <Lightbox title="photo.png" onClose={vi.fn()}>
        <img alt="x" />
      </Lightbox>,
    );
    expect(screen.getByTestId('lightbox')).toHaveTextContent('photo.png');
  });

  it('closes on the ✕ button', () => {
    const onClose = vi.fn();
    render(
      <Lightbox onClose={onClose}>
        <div />
      </Lightbox>,
    );
    fireEvent.click(screen.getByTestId('lightbox-close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on backdrop click but not on panel click', () => {
    const onClose = vi.fn();
    render(
      <Lightbox onClose={onClose}>
        <div data-testid="inner">content</div>
      </Lightbox>,
    );
    fireEvent.click(screen.getByTestId('inner'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('lightbox'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <Lightbox onClose={onClose}>
        <div />
      </Lightbox>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
