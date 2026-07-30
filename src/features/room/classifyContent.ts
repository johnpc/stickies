import { detectKind } from './detectKind';
import type { StickyKind } from './stickiesApi';

export interface ClassifiedContent {
  kind: StickyKind;
  /** The content to store: fence stripped for CODE, otherwise the trimmed input. */
  content: string;
  /** CODE only: the language hint from the fence (```ts), else undefined. */
  language?: string;
}

// A fenced code block: ```lang\n…\n``` (lang optional). Multiline body captured.
const FENCE = /^```([a-z0-9+#-]*)\n([\s\S]*?)\n?```$/i;

/**
 * Classify raw sticky input into a kind + normalized content (+ language for
 * CODE). A triple-backtick fence is an explicit CODE sticky — deterministic and
 * unambiguous, so we never misfire on prose that merely looks code-ish. Anything
 * else falls back to detectKind (LINK vs TEXT). Pure + unit-tested.
 */
export function classifyContent(raw: string): ClassifiedContent {
  const trimmed = raw.trim();
  const fence = FENCE.exec(trimmed);
  if (fence) {
    return {
      kind: 'CODE',
      content: fence[2],
      language: fence[1] ? fence[1].toLowerCase() : undefined,
    };
  }
  return { kind: detectKind(trimmed), content: trimmed };
}
