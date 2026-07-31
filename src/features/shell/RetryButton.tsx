import { useState } from 'react';
import { IonSpinner } from '@ionic/react';

/** The "Try again" button in an error state. Owns a local busy flag so clicking
 * it gives IMMEDIATE feedback: react-query's refetch on an already-errored query
 * keeps isLoading false (only isFetching flips), so without this the error screen
 * sat frozen during the retry and users re-tapped it. On success the surrounding
 * LoadState re-renders to content and this unmounts, clearing the flag; on repeat
 * failure the error branch re-renders a fresh (idle) button. */
export function RetryButton({ onRetry }: { onRetry: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="empty-state__cta"
      data-testid="load-retry"
      disabled={busy}
      aria-busy={busy}
      onClick={() => {
        setBusy(true);
        onRetry();
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
