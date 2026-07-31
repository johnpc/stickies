import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CodeSticky } from './CodeSticky';
import { CODE_MAX_LINES } from './capCode';

describe('CodeSticky', () => {
  it('renders a short snippet with a gutter line per line and no truncation note', () => {
    render(<CodeSticky code={'const a = 1;\nfoo(a);'} language="javascript" />);
    expect(screen.getByTestId('code-sticky')).toBeInTheDocument();
    expect(screen.getByTestId('code-lang')).toHaveTextContent('javascript');
    expect(
      screen.getByTestId('code-sticky').querySelectorAll('.code-sticky__gutter span'),
    ).toHaveLength(2);
    expect(screen.queryByTestId('code-truncated')).not.toBeInTheDocument();
  });

  it('caps a huge snippet: bounded gutter + a truncation note (no per-line freeze)', () => {
    const huge = Array.from({ length: CODE_MAX_LINES + 500 }, (_, i) => `line ${i}`).join('\n');
    render(<CodeSticky code={huge} language="javascript" />);
    // Only the capped number of gutter nodes are built, not thousands.
    const gutter = screen.getByTestId('code-sticky').querySelectorAll('.code-sticky__gutter span');
    expect(gutter).toHaveLength(CODE_MAX_LINES);
    expect(screen.getByTestId('code-truncated')).toBeInTheDocument();
  });
});
