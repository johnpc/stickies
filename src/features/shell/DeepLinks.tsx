import { useDeepLinks } from './useDeepLinks';

/** Mount point for the universal/app-link router hook. Renders nothing — it just
 * needs to live inside the router so it can navigate on an incoming link. */
export function DeepLinks() {
  useDeepLinks();
  return null;
}
