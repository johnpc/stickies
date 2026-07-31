/**
 * Reject a promise if it doesn't settle within `ms`. Amplify's Data mutate calls
 * RETRY internally and can hang indefinitely when offline/unreachable — they
 * never reject, so a failed write would sit "pending" forever with no error
 * surfaced (the sticky silently vanishes). Racing against a timeout turns that
 * hang into a real rejection so react-query's onError can toast it.
 */
export function withTimeout<T>(promise: Promise<T>, ms = 12_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Request timed out — check your connection and try again.')),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
