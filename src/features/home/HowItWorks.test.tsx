import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HowItWorks } from './HowItWorks';

describe('HowItWorks', () => {
  it('renders the three explainer steps', () => {
    render(<HowItWorks />);
    const steps = screen.getByTestId('how-it-works').querySelectorAll('.how-it-works__step');
    expect(steps).toHaveLength(3);
    expect(screen.getByText('Pick any URL')).toBeInTheDocument();
    expect(screen.getByText('Share the link')).toBeInTheDocument();
  });
});
