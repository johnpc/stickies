import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const { addListener, remove } = vi.hoisted(() => ({ addListener: vi.fn(), remove: vi.fn() }));
vi.mock('@capacitor/app', () => ({ App: { addListener } }));
addListener.mockResolvedValue({ remove });

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
