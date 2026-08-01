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
    // COLD START: when the app is launched by tapping a shared link (not already
    // running), the OS delivers the URL via getLaunchUrl — the `appUrlOpen` event
    // fires before this listener is attached, so a listener-only hook drops it and
    // boots to the home page instead of the shared room. Resolve the launch URL
    // once and route it. Only navigate to a real ROOM path (not "/"), so a normal
    // launch (no link, or the bare domain) doesn't clobber the default route.
    void App.getLaunchUrl().then((launch) => {
      const path = launch?.url ? deepLinkPath(launch.url) : null;
      if (path && path !== '/') history.push(path);
    });
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [history]);
}
