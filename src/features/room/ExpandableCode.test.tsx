import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Stub CodeSticky (hljs is heavy) to focus on the expand behavior.
vi.mock('./CodeSticky', () => ({
  CodeSticky: ({ code }: { code: string }) => <pre data-testid="code">{code}</pre>,
}));

import { ExpandableCode } from './ExpandableCode';

describe('ExpandableCode', () => {
  it('shows the snippet inline with an expand button', () => {
    render(<ExpandableCode code="const a = 1;" language="ts" />);
    expect(screen.getByTestId('code')).toHaveTextContent('const a = 1;');
    expect(screen.getByTestId('code-expand')).toBeInTheDocument();
    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();
  });

  it('pops the code into a lightbox on expand', () => {
    render(<ExpandableCode code="const a = 1;" language="ts" title="snippet.ts" />);
    fireEvent.click(screen.getByTestId('code-expand'));
    const box = screen.getByTestId('lightbox');
    expect(box).toBeInTheDocument();
    expect(box).toHaveTextContent('const a = 1;');
    expect(box).toHaveTextContent('snippet.ts');
  });
});
