import { detectKind } from './detectKind';
import type { StickyKind } from './stickiesApi';

export interface ClassifiedContent {
  kind: StickyKind;
  /** The content to store: fence stripped for CODE, otherwise the trimmed input. */
  content: string;
  /** CODE only: the language hint from the fence (```ts), else undefined. */
  language?: string;
}

// Multi-line fence: ```lang\n<body>\n``` — the first line's word is the language.
// The language class includes `.` (hljs names like `asp.net`), and trailing
// whitespace on the info line is tolerated (```js␠\n) — otherwise a stray space
// or a dotted name made the whole info line fail to match here and fall through
// to FENCE_INLINE, which folded "js " / "asp.net" into the code body as line 1
// and dropped the language tag + highlighting.
const FENCE_MULTILINE = /^```([a-z0-9+#.-]*)[ \t]*\n([\s\S]*?)\n?```$/i;
// Inline fence: ```<body>``` on one line (no newline). Everything between the
// backticks is code; there's no language tag (a leading word here is ambiguous
// with code, so we don't guess one).
const FENCE_INLINE = /^```([\s\S]+?)```$/;

/**
 * Classify raw sticky input into a kind + normalized content (+ language for
 * CODE). A triple-backtick fence is an explicit CODE sticky — deterministic and
 * unambiguous, so we never misfire on prose that merely looks code-ish. Handles
 * both a multi-line fence (```lang\n…\n```) and an INLINE one (```code```) —
 * the latter is what you get typing a fence on one line + Enter. Anything else
 * falls back to detectKind (LINK vs TEXT). Pure + unit-tested.
 */
export function classifyContent(raw: string): ClassifiedContent {
  const trimmed = raw.trim();
  const multi = FENCE_MULTILINE.exec(trimmed);
  if (multi) {
    return {
      kind: 'CODE',
      content: multi[2],
      language: multi[1] ? multi[1].toLowerCase() : undefined,
    };
  }
  const inline = FENCE_INLINE.exec(trimmed);
  if (inline) {
    return { kind: 'CODE', content: inline[1].trim() };
  }
  return { kind: detectKind(trimmed), content: trimmed };
}
