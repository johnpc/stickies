import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { downloadFile } = vi.hoisted(() => ({ downloadFile: vi.fn() }));
vi.mock('./downloadFile', () => ({ downloadFile }));

import { MediaActions } from './MediaActions';

describe('MediaActions', () => {
  it('downloads the file under its name (fetch-to-blob, not a cross-origin anchor)', () => {
    render(<MediaActions url="https://s3/x" fileName="pic.png" />);
    fireEvent.click(screen.getByTestId('media-download'));
    expect(downloadFile).toHaveBeenCalledWith('https://s3/x', 'pic.png');
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
