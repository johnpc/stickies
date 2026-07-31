/**
 * Geometry for the drag insertion line, rendered as an ABSOLUTE OVERLAY rather
 * than a grid item. As a grid child the 4px line consumed a whole track and
 * reflowed the pad on every drag (a full empty row on a single-column phone) —
 * and the reflow shifted the card rects mid-drag, destabilizing hit-testing. An
 * overlay positioned in the target gap avoids both. Pure over its inputs (rects
 * relative to the grid, plus the gap width) so it's unit-testable.
 */
export interface LineBox {
  /** Left offset of the bar within the grid's padding box (px). */
  left: number;
  /** Top offset within the grid (px). */
  top: number;
  /** Bar height (px) — matches the target card's height. */
  height: number;
}

/** A card's box relative to the grid's content origin, plus its list index. */
export interface RelRect {
  index: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Where to draw the insertion bar for a given `insertIndex` (0..cards.length),
 * given the cards' boxes relative to the grid and the grid gap. The bar sits in
 * the GAP before the card at `insertIndex`, centered in the gutter; at the end
 * it sits just after the last card. Returns null if there's nothing to anchor to.
 */
export function insertLineRect(
  cards: readonly RelRect[],
  insertIndex: number,
  gap: number,
): LineBox | null {
  if (cards.length === 0) return null;
  const half = gap / 2;
  if (insertIndex >= cards.length) {
    // After the last card, in the trailing gutter.
    const last = cards[cards.length - 1];
    return { left: last.right + half, top: last.top, height: last.bottom - last.top };
  }
  const target = cards[insertIndex];
  // Center the bar in the gutter to the LEFT of the target card.
  return { left: target.left - half, top: target.top, height: target.bottom - target.top };
}
