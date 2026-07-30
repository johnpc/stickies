import { test as base } from 'playwright-bdd';

/**
 * Per-scenario test fixtures. `roomSlug` is a fresh, unique room name for each
 * scenario so parallel workers hitting the same shared backend never collide on
 * a room's stickies. `currentRoom` (state.room) carries the slug set by the
 * "opens a fresh room" step to the later steps in the same scenario.
 *
 * The Playwright fixture callback's 2nd arg is the "provide" function (its name
 * is positional); we call it `provide` rather than `use` so the react-hooks
 * lint rule doesn't mistake it for a React hook.
 */
interface StickiesFixtures {
  roomSlug: string;
  state: { room: string };
}

// A per-process run stamp so slugs are unique across separate `test:e2e` runs
// (not logic under test — Date.now is fine in e2e infra). Combined with the
// worker index + a counter it can't collide within or across runs.
const RUN = Date.now().toString(36);
let counter = 0;

export const test = base.extend<StickiesFixtures>({
  // Playwright REQUIRES the first fixture arg to be an object-destructuring
  // pattern; an empty `{}` (no upstream fixtures needed) trips eslint's
  // no-empty-pattern, so disable that one rule here.
  // eslint-disable-next-line no-empty-pattern
  roomSlug: async ({}, provide, testInfo) => {
    counter += 1;
    await provide(`e2e-${RUN}-${testInfo.workerIndex}-${counter}`);
  },
  // eslint-disable-next-line no-empty-pattern
  state: async ({}, provide) => {
    await provide({ room: '' });
  },
});
