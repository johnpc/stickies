import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  /** Injectable reload for tests; defaults to a full page reload. */
  onReload?: () => void;
}
interface State {
  hasError: boolean;
}

/** App-wide error boundary: catches any render/lifecycle crash below it and
 * shows a recoverable fallback instead of a white screen. Class component
 * because only class lifecycles (getDerivedStateFromError/componentDidCatch)
 * can catch render errors. Kept tiny — the fallback UI lives in ErrorFallback. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface for debugging; a real telemetry sink can hook in here later.
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private reload = (): void => {
    if (this.props.onReload) this.props.onReload();
    else window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) return <ErrorFallback onReload={this.reload} />;
    return this.props.children;
  }
}
