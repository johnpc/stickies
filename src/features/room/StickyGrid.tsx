import type { StickyRecord } from '../../lib/dataClient';
import { StickyCard } from './StickyCard';
import { StickyComposer } from './StickyComposer';
import './sticky.css';

interface StickyGridProps {
  stickies: StickyRecord[];
  onAdd: (content: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

/** The pad: a masonry-ish grid of sticky cards followed by the composer. Pure
 * presentation — all logic lives in the room hooks. */
export function StickyGrid({ stickies, onAdd, onEdit, onDelete }: StickyGridProps) {
  return (
    <div className="sticky-grid" data-testid="sticky-grid">
      {stickies.map((sticky) => (
        <StickyCard
          key={sticky.id}
          sticky={sticky}
          onEdit={(content) => onEdit(sticky.id, content)}
          onDelete={() => onDelete(sticky.id)}
        />
      ))}
      <StickyComposer count={stickies.length} onAdd={onAdd} />
    </div>
  );
}
