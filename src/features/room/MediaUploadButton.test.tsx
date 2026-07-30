import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MediaUploadButton } from './MediaUploadButton';

describe('MediaUploadButton', () => {
  it('hands the chosen file to onUpload', () => {
    const onUpload = vi.fn();
    render(<MediaUploadButton onUpload={onUpload} />);
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(screen.getByTestId('sticky-file-input'), { target: { files: [file] } });
    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it('ignores an empty selection', () => {
    const onUpload = vi.fn();
    render(<MediaUploadButton onUpload={onUpload} />);
    fireEvent.change(screen.getByTestId('sticky-file-input'), { target: { files: [] } });
    expect(onUpload).not.toHaveBeenCalled();
  });
});
