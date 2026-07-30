import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { deepLinkPath } from './deepLinkPath';

/**
 * Routes incoming universal/app links into the SPA. When the OS hands a tapped
 * https://stickies.jpc.io/<room> link to the installed app, Capacitor fires
 * `appUrlOpen`; we translate the URL to its in-app path and navigate there, so
 * a shared link deep-links straight to that room. In a plain browser this hook
 * is inert (the listener never fires) — the same URL just loads normally.
 */
export function useDeepLinks(): void {
  const history = useHistory();
  useEffect(() => {
    const handle = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const path = deepLinkPath(event.url);
      if (path) history.push(path);
    });
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [history]);
}
