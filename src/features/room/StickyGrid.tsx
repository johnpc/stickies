import type { StickyRecord } from '../../lib/dataClient';
import type { StickyColor } from './stickyPalette';
import type { StickySize } from './stickySize';
import { StickyCard } from './StickyCard';
import { StickyComposer } from './StickyComposer';
import { MediaUploadButton } from './MediaUploadButton';
import { useDragReorder } from './useDragReorder';
import { useKeyboardReorder } from './useKeyboardReorder';
import './sticky.css';

interface StickyGridProps {
  stickies: StickyRecord[];
  onAdd: (content: string) => void;
  onUpload: (file: File) => void;
  /** True while a media upload is in flight (drives the upload tile's spinner). */
  uploading?: boolean;
  onEdit: (id: string, content: string) => void;
  onRecolor: (id: string, color: StickyColor) => void;
  onResize: (id: string, size: StickySize) => void;
  onReorder: (id: string, ord: number) => void;
  onDelete: (sticky: StickyRecord) => void;
}

/** The pad: a pointer-drag-reorderable grid of sticky cards, then the composer +
 * upload tile. An insertion line renders in the GAP where a dragged sticky will
 * land. Logic lives in the room hooks + useDragReorder. */
export function StickyGrid(props: StickyGridProps) {
  const { stickies, onAdd, onUpload, onEdit, onRecolor, onResize, onReorder, onDelete, uploading } =
    props;
  const { gridRef, draggingId, insertLine, startDrag } = useDragReorder(stickies, onReorder);
  const { announce, onGripKeyDown } = useKeyboardReorder(stickies, onReorder);

  return (
    <div className="sticky-grid" data-testid="sticky-grid" ref={gridRef}>
      {/* Announces keyboard-reorder moves to assistive tech (the pointer drag is
          visual; a keyboard user needs to hear the new position). */}
      <span className="sr-only" role="status" aria-live="polite" data-testid="reorder-live">
        {announce}
      </span>
      {/* The insertion indicator is an ABSOLUTE OVERLAY positioned in the target
          gap — not a grid item — so it doesn't consume a track and reflow the pad
          mid-drag (which also shifted the card rects and destabilized hit-testing,
          worst on a single-column phone). */}
      {draggingId && insertLine && (
        <div
          className="sticky-insert"
          data-testid="insert-line"
          aria-hidden="true"
          style={{ left: insertLine.left, top: insertLine.top, height: insertLine.height }}
        />
      )}
      {stickies.map((sticky, index) => (
        <StickyCard
          key={sticky.id}
          sticky={sticky}
          index={index}
          dragging={draggingId === sticky.id}
          onDragHandle={() => startDrag(sticky.id)}
          onGripKeyDown={(e) => onGripKeyDown(sticky.id, e)}
          onEdit={(content) => onEdit(sticky.id, content)}
          onRecolor={(color) => onRecolor(sticky.id, color)}
          onResize={(size) => onResize(sticky.id, size)}
          onDelete={() => onDelete(sticky)}
        />
      ))}
      <StickyComposer count={stickies.length} onAdd={onAdd} />
      <MediaUploadButton onUpload={onUpload} pending={uploading} />
    </div>
  );
}
