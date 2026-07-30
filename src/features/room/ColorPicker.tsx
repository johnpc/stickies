import { STICKY_COLORS, type StickyColor } from './stickyPalette';
import './colorPicker.css';

interface ColorPickerProps {
  current: StickyColor;
  onPick: (color: StickyColor) => void;
}

/** A row of color swatches for recoloring a sticky (Asana-style color-coding).
 * Pure presentation — the parent owns the recolor mutation. */
export function ColorPicker({ current, onPick }: ColorPickerProps) {
  return (
    <div className="color-picker" role="group" aria-label="Sticky color" data-testid="color-picker">
      {STICKY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={
            color === current
              ? `color-swatch color-swatch--${color} is-active`
              : `color-swatch color-swatch--${color}`
          }
          aria-label={color}
          aria-pressed={color === current}
          data-testid={`color-${color}`}
          onClick={() => onPick(color)}
        />
      ))}
    </div>
  );
}
