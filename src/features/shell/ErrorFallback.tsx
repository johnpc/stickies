import { IonContent, IonPage } from '@ionic/react';
import './errorBoundary.css';

/** The screen shown when a render crash is caught by ErrorBoundary. Offers a
 * reload (the SPA state is gone, so a full reload is the honest recovery) and a
 * link home. Styled via --sk-* tokens so it reads as part of Stickies. */
export function ErrorFallback({ onReload }: { onReload: () => void }) {
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="error-fallback" data-testid="error-fallback">
          <span className="error-fallback__emoji" aria-hidden="true">
            🗒️
          </span>
          <h2 className="sk-heading error-fallback__title">Something went sideways</h2>
          <p className="sk-muted">This screen hit a snag. Reloading usually clears it.</p>
          <button
            type="button"
            className="error-fallback__reload"
            data-testid="error-reload"
            onClick={onReload}
          >
            Reload
          </button>
          <a className="error-fallback__home" href="/" data-testid="error-home">
            Back home
          </a>
        </div>
      </IonContent>
    </IonPage>
  );
}
