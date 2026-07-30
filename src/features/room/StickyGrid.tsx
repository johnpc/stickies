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

/** The pad: a drag-reorderable grid of sticky cards followed by the composer + an
 * upload tile. Pure presentation — logic lives in the room hooks + useDragReorder. */
export function StickyGrid(props: StickyGridProps) {
  const { stickies, onAdd, onUpload, onEdit, onRecolor, onReorder, onDelete } = props;
  const { dragProps } = useDragReorder(stickies, onReorder);

  return (
    <div className="sticky-grid" data-testid="sticky-grid">
      {stickies.map((sticky, index) => (
        <StickyCard
          key={sticky.id}
          sticky={sticky}
          onEdit={(content) => onEdit(sticky.id, content)}
          onRecolor={(color) => onRecolor(sticky.id, color)}
          onDelete={() => onDelete(sticky)}
          drag={dragProps(sticky, index)}
        />
      ))}
      <StickyComposer count={stickies.length} onAdd={onAdd} />
      <MediaUploadButton onUpload={onUpload} />
    </div>
  );
}
