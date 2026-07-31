import { usePresence } from './usePresence';
import './presenceBadge.css';

/** "🟢 N here" in the room toolbar — how many people are viewing this room right
 * now (live). Renders nothing until at least one viewer is counted (avoids a
 * flash of "0" while the subscription connects). It's a polite live region so a
 * screen-reader user is TOLD when someone joins/leaves (the whole point of the
 * count) — with a clear label, since a bare "2 here" reads ambiguously. */
export function PresenceBadge({ room }: { room: string }) {
  const count = usePresence(room);
  if (count < 1) return null;
  const label = `${count} ${count === 1 ? 'person' : 'people'} viewing this room`;
  return (
    <span
      className="presence-badge"
      data-testid="presence-badge"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
      title={label}
    >
      <span className="presence-badge__dot" aria-hidden="true" />
      <span aria-hidden="true">{count} here</span>
    </span>
  );
}
