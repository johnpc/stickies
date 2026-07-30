import { Fragment } from 'react';
import type { StickyRecord } from '../../lib/dataClient';
import type { StickyColor } from './stickyPalette';
import { StickyCard } from './StickyCard';
import { StickyComposer } from './StickyComposer';
import { MediaUploadButton } from './MediaUploadButton';
import { useDragReorder } from './useDragReorder';
import './sticky.css';

interface StickyGridProps {
  stickies: StickyRecord[];
  onAdd: (content: string) => void;
  onUpload: (file: File) => void;
  onEdit: (id: string, content: string) => void;
  onRecolor: (id: string, color: StickyColor) => void;
  onReorder: (id: string, ord: number) => void;
  onDelete: (sticky: StickyRecord) => void;
}

/** The pad: a pointer-drag-reorderable grid of sticky cards, then the composer +
 * upload tile. An insertion line renders in the GAP where a dragged sticky will
 * land. Logic lives in the room hooks + useDragReorder. */
export function StickyGrid(props: StickyGridProps) {
  const { stickies, onAdd, onUpload, onEdit, onRecolor, onReorder, onDelete } = props;
  const { gridRef, draggingId, insertIndex, startDrag } = useDragReorder(stickies, onReorder);

  return (
    <div className="sticky-grid" data-testid="sticky-grid" ref={gridRef}>
      {stickies.map((sticky, index) => (
        <Fragment key={sticky.id}>
          {draggingId && insertIndex === index && (
            <div className="sticky-insert" data-testid="insert-line" aria-hidden="true" />
          )}
          <StickyCard
            sticky={sticky}
            index={index}
            dragging={draggingId === sticky.id}
            onDragHandle={() => startDrag(sticky.id)}
            onEdit={(content) => onEdit(sticky.id, content)}
            onRecolor={(color) => onRecolor(sticky.id, color)}
            onDelete={() => onDelete(sticky)}
          />
        </Fragment>
      ))}
      {draggingId && insertIndex === stickies.length && (
        <div className="sticky-insert" data-testid="insert-line" aria-hidden="true" />
      )}
      <StickyComposer count={stickies.length} onAdd={onAdd} />
      <MediaUploadButton onUpload={onUpload} />
    </div>
  );
}
