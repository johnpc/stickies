import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { StickyRecord } from '../../lib/dataClient';

// LinkSticky fetches an OG preview via a hook; stub the hook so these stay focused
// on StickyBody's kind routing (no preview → plain link path).
vi.mock('./useLinkPreview', () => ({
  useLinkPreview: () => ({ preview: undefined, isLoading: false }),
}));

import { StickyBody } from './StickyBody';

const make = (over: Partial<StickyRecord>): StickyRecord =>
  ({ id: '1', room: 'r', kind: 'TEXT', content: 'x', ...over }) as StickyRecord;

describe('StickyBody', () => {
  it('renders plain text', () => {
    render(<StickyBody sticky={make({ content: 'buy milk' })} />);
    expect(screen.getByText('buy milk')).toBeInTheDocument();
  });

  it('renders a LINK as a safe anchor', () => {
    render(<StickyBody sticky={make({ kind: 'LINK', content: 'example.com' })} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/');
  });

  it('does not render a javascript: LINK as an anchor', () => {
    render(<StickyBody sticky={make({ kind: 'LINK', content: 'javascript:alert(1)' })} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a CODE sticky with a line-number gutter and highlighting', async () => {
    render(
      <StickyBody
        sticky={make({ kind: 'CODE', content: 'const a = 1;\nconst b = 2;', language: 'ts' })}
      />,
    );
    // CodeSticky is lazy-loaded — await it resolving through Suspense.
    expect(await screen.findByTestId('code-sticky')).toBeInTheDocument();
    expect(screen.getByTestId('code-lang')).toHaveTextContent('ts');
  });
});
