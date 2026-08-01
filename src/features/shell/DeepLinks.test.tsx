import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const { addListener, remove, getLaunchUrl } = vi.hoisted(() => ({
  addListener: vi.fn(),
  remove: vi.fn(),
  getLaunchUrl: vi.fn(),
}));
vi.mock('@capacitor/app', () => ({ App: { addListener, getLaunchUrl } }));
addListener.mockResolvedValue({ remove });
getLaunchUrl.mockResolvedValue(undefined); // no cold-start launch URL in this test

import { DeepLinks } from './DeepLinks';

describe('DeepLinks', () => {
  it('renders nothing and registers the appUrlOpen listener', () => {
    const { container } = render(
      <MemoryRouter>
        <DeepLinks />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(addListener).toHaveBeenCalledWith('appUrlOpen', expect.any(Function));
  });
});
