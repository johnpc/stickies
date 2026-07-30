import { usePresence } from './usePresence';
import './presenceBadge.css';

/** "🟢 N here" in the room toolbar — how many people are viewing this room right
 * now (live). Renders nothing until at least one viewer is counted (avoids a
 * flash of "0" while the subscription connects). */
export function PresenceBadge({ room }: { room: string }) {
  const count = usePresence(room);
  if (count < 1) return null;
  return (
    <span className="presence-badge" data-testid="presence-badge" title={`${count} here now`}>
      <span className="presence-badge__dot" aria-hidden="true" />
      {count} here
    </span>
  );
}
