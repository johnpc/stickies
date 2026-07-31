import { useCallback } from 'react';
import { copyText } from './copyText';
import { showToast } from '../shell/toastBus';

/**
 * Copy text to the clipboard AND confirm it to the user. The sticky renderers
 * (TextSticky / ExpandableCode / DocSticky) called copyText and ignored the
 * result, so "Copy" gave no feedback — you couldn't tell if it worked. This
 * centralizes the toast: "Copied to clipboard" on success, a soft failure
 * message otherwise (e.g. clipboard blocked). Mirrors the Share button, which
 * already confirms its copy.
 */
export function useCopyAction(): (text: string) => Promise<void> {
  return useCallback(async (text: string) => {
    const ok = await copyText(text);
    showToast(ok ? 'Copied to clipboard' : 'Couldn’t copy — select and copy manually.');
  }, []);
}
