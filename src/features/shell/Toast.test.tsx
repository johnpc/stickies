import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';
import { showToast } from './toastBus';

describe('Toast', () => {
  it('renders nothing until a message is published', () => {
    render(<Toast />);
    expect(screen.queryByTestId('app-toast')).not.toBeInTheDocument();
  });

  it('shows a published message and dismisses on close', () => {
    render(<Toast />);
    act(() => showToast('saved'));
    expect(screen.getByTestId('app-toast')).toHaveTextContent('saved');
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByTestId('app-toast')).not.toBeInTheDocument();
  });

  it('runs an action then dismisses', () => {
    const run = vi.fn();
    render(<Toast />);
    act(() => showToast('undo?', { label: 'Undo', run }));
    fireEvent.click(screen.getByTestId('app-toast-action'));
    expect(run).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('app-toast')).not.toBeInTheDocument();
  });
});
