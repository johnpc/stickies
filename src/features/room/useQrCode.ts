import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Generates a PNG data-URL QR code for a string (the room URL). Async +
 * cancellation-safe so a fast unmount/URL change can't set state late. Returns
 * the data URL, or null while pending / on failure (caller falls back to text). */
export function useQrCode(text: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(text, { width: 240, margin: 1 })
      .then((url) => {
        if (alive) setDataUrl(url);
      })
      .catch(() => {
        if (alive) setDataUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [text]);
  return dataUrl;
}
