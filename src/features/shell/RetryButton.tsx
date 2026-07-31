import { useEffect, useRef, useState } from 'react';
import { IonSpinner } from '@ionic/react';

/** The "Try again" button in an error state. Owns a local busy flag so clicking
 * it gives IMMEDIATE feedback: react-query's refetch on an already-errored query
 * keeps isLoading false (only isFetching flips), so without this the error screen
 * sat frozen during the retry and users re-tapped it.
 *
 * busy clears when the retry SETTLES, not on unmount. On success LoadState swaps
 * to content (this unmounts) — but on a REPEAT failure the error branch keeps THIS
 * SAME button mounted, so relying on unmount left it stuck on "Retrying…" forever
 * (only a page reload escaped). onRetry is react-query's refetch, which resolves
 * when the attempt ends either way; reset off that. */
export function RetryButton({ onRetry }: { onRetry: () => void | Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  return (
    <button
      type="button"
      className="empty-state__cta"
      data-testid="load-retry"
      disabled={busy}
      aria-busy={busy}
      onClick={() => {
        setBusy(true);
        // Clear busy once the retry finishes (success OR another failure), guarding
        // a state update after unmount on the success path.
        Promise.resolve(onRetry()).finally(() => {
          if (mounted.current) setBusy(false);
        });
      }}
    >
      {busy ? (
        <>
          <IonSpinner name="crescent" data-testid="load-retry-spinner" /> Retrying…
        </>
      ) : (
        'Try again'
      )}
    </button>
  );
}
