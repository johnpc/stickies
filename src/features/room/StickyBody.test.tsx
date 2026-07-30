import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StickyBody } from './StickyBody';
import type { StickyRecord } from '../../lib/dataClient';

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

  it('renders a CODE sticky with a line-number gutter and highlighting', () => {
    render(
      <StickyBody
        sticky={make({ kind: 'CODE', content: 'const a = 1;\nconst b = 2;', language: 'ts' })}
      />,
    );
    expect(screen.getByTestId('code-sticky')).toBeInTheDocument();
    expect(screen.getByTestId('code-lang')).toHaveTextContent('ts');
  });
});
