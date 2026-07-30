import { QueryClient, MutationCache } from '@tanstack/react-query';
import { showToast } from '../features/shell/toastBus';

/** App-wide react-query client. Server state (Amplify data) lives here. A global
 * mutation onError surfaces a toast so a failed action (add a sticky, edit one,
 * …) tells the user instead of failing silently. */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
  mutationCache: new MutationCache({
    onError: () => showToast('Something went wrong. Check your connection and try again.'),
  }),
});
