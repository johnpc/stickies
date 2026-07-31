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

  it('shows an uploading state and disables the tile while pending', () => {
    render(<MediaUploadButton onUpload={vi.fn()} pending />);
    const button = screen.getByTestId('sticky-upload');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('upload-spinner')).toBeInTheDocument();
    expect(button).toHaveTextContent(/uploading/i);
  });

  it('shows the normal prompt (no spinner) when not pending', () => {
    render(<MediaUploadButton onUpload={vi.fn()} />);
    expect(screen.getByTestId('sticky-upload')).not.toBeDisabled();
    expect(screen.queryByTestId('upload-spinner')).not.toBeInTheDocument();
    expect(screen.getByTestId('sticky-upload')).toHaveTextContent(/upload a file/i);
  });
});
