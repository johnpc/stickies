import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** QR generation outcome. `error` is distinct from `pending` so the UI can show
 * a real "unavailable" message instead of an eternal loading skeleton — QR
 * generation genuinely fails when the text exceeds QR byte capacity. */
export interface QrState {
  status: 'pending' | 'ready' | 'error';
  /** The PNG data URL when status is 'ready', else null. */
  dataUrl: string | null;
}

/** Generates a PNG data-URL QR code for a string (the room URL). Async +
 * cancellation-safe so a fast unmount/URL change can't set state late. Returns a
 * discriminated status so the caller can tell pending from a real failure. */
export function useQrCode(text: string): QrState {
  const [state, setState] = useState<QrState>({ status: 'pending', dataUrl: null });
  useEffect(() => {
    let alive = true;
    setState({ status: 'pending', dataUrl: null });
    QRCode.toDataURL(text, { width: 240, margin: 1 })
      .then((url) => {
        if (alive) setState({ status: 'ready', dataUrl: url });
      })
      .catch(() => {
        if (alive) setState({ status: 'error', dataUrl: null });
      });
    return () => {
      alive = false;
    };
  }, [text]);
  return state;
}
