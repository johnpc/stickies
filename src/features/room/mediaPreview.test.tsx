import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mediaPreview } from './mediaPreview';

describe('mediaPreview', () => {
  it('renders an image with alt text set to the filename', () => {
    render(<>{mediaPreview('IMAGE', 'https://s3/x.png', 'holiday.png')}</>);
    expect(screen.getByTestId('media-image')).toHaveAttribute('alt', 'holiday.png');
  });

  it('renders video with playsInline + preload so iOS plays it in-card', () => {
    render(<>{mediaPreview('VIDEO', 'https://s3/c.mp4', 'clip.mp4')}</>);
    const video = screen.getByTestId('media-video');
    // playsinline stops iOS from hijacking into the fullscreen player.
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('preload', 'metadata');
  });

  it('pairs the PDF iframe with an "Open PDF" link (iframe is blank on iOS)', () => {
    render(<>{mediaPreview('PDF', 'https://s3/d.pdf', 'doc.pdf')}</>);
    expect(screen.getByTestId('media-pdf')).toBeInTheDocument();
    const open = screen.getByTestId('media-pdf-fallback');
    expect(open).toHaveAttribute('href', 'https://s3/d.pdf');
    expect(open).toHaveAttribute('target', '_blank');
  });

  it('also offers the Open PDF link in the large (lightbox) variant', () => {
    render(<>{mediaPreview('PDF', 'https://s3/d.pdf', 'doc.pdf', true)}</>);
    expect(screen.getByTestId('media-pdf-fallback')).toHaveAttribute('href', 'https://s3/d.pdf');
  });

  it('renders nothing for FILE/DOC kinds (handled elsewhere)', () => {
    const { container } = render(<>{mediaPreview('FILE', 'https://s3/a.zip', 'a.zip')}</>);
    expect(container).toBeEmptyDOMElement();
  });
});
