import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MediaActions } from './MediaActions';

describe('MediaActions', () => {
  it('always renders a download link with the filename', () => {
    render(<MediaActions url="https://s3/x" fileName="pic.png" />);
    const dl = screen.getByTestId('media-download');
    expect(dl).toHaveAttribute('href', 'https://s3/x');
    expect(dl).toHaveAttribute('download', 'pic.png');
  });

  it('shows expand only when onExpand is given', () => {
    const onExpand = vi.fn();
    const { rerender } = render(<MediaActions url="u" fileName="f" onExpand={onExpand} />);
    fireEvent.click(screen.getByTestId('media-expand'));
    expect(onExpand).toHaveBeenCalledOnce();

    rerender(<MediaActions url="u" fileName="f" />);
    expect(screen.queryByTestId('media-expand')).not.toBeInTheDocument();
  });
});
