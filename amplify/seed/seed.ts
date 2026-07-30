/**
 * Idempotent seed runner: clears both models, then inserts the demo rooms so a
 * fresh sandbox has a populated home recents feed and browsable pads. Re-running
 * converges to the same state. Guest (identityPool) writes — Stickies needs no
 * sign-in to write (the room URL is the only key).
 *
 * Usage:
 *   npm run e2e-config   # ensure amplify_outputs.json exists (sandbox)
 *   npm run seed         # runs this script via tsx
 */
import { clearAll, seedRooms } from './seedRooms';

async function main() {
  await clearAll();
  console.log('Cleared Sticky + Room.');
  await seedRooms();
  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
