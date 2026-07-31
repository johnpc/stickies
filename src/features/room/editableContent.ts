import type { StickyRecord } from '../../lib/dataClient';

/**
 * The text to seed the inline editor with for a sticky. A CODE sticky stores its
 * body with the ``` fence ALREADY STRIPPED (see classifyContent) plus a separate
 * `language`, so editing the bare body would re-classify as plain TEXT on save —
 * silently destroying the snippet + its highlighting. Re-wrapping it in a fence
 * (```lang\n…\n```) makes the edit round-trip lossless: what the editor shows is
 * exactly what classifyContent will re-recognize as CODE. Other kinds edit as-is.
 * Pure + unit-tested.
 */
export function editableContent(
  sticky: Pick<StickyRecord, 'kind' | 'content' | 'language'>,
): string {
  const content = sticky.content ?? '';
  if (sticky.kind !== 'CODE') return content;
  return `\`\`\`${sticky.language ?? ''}\n${content}\n\`\`\``;
}
