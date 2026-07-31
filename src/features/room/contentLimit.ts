/**
 * A sticky's text is stored as one DynamoDB item attribute, and a DynamoDB item
 * is capped at 400 KB total (across ALL attributes + overhead). Without a guard,
 * pasting a huge blob failed the write with a cryptic backend error — and since
 * the Retry re-fired the identical oversized write, it could never succeed (an
 * infinite retry loop). Guard the length BEFORE the write with a friendly,
 * non-retryable message. Pure + unit-testable.
 */

/** Max UTF-8 bytes of sticky text we'll store. Generous for a note yet safely
 * under DynamoDB's 400 KB item cap (leaving headroom for the other attributes). */
export const MAX_CONTENT_BYTES = 350 * 1024;

/** UTF-8 byte length of a string (a multi-byte char counts as its real size, so
 * an emoji-heavy note is measured correctly against the byte cap). */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** A user-facing reason the text can't be saved, or null if it's within the cap. */
export function contentLengthError(text: string): string | null {
  if (byteLength(text) > MAX_CONTENT_BYTES) {
    return `That note is too long (max ${Math.round(MAX_CONTENT_BYTES / 1024)} KB). Trim it and try again.`;
  }
  return null;
}
