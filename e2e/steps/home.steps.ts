import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { normalizeRoomSlug, prettifyRoomSlug } from '../../src/features/room/roomSlug';
import { test } from './fixtures';

const { Given, When, Then } = createBdd(test);

Given('a visitor opens the Stickies home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
});

Given('a visitor opens the home page with the recents read failing', async ({ page }) => {
  // Fail only the recents query so the rest of the page still renders.
  await page.route('**/graphql', async (route) => {
    const body = route.request().postData() ?? '';
    if (body.includes('listRoomByListKeyAndLastEditedAt')) {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"errors":[{"message":"boom"}]}',
      });
    }
    return route.continue();
  });
  await page.goto('/');
});

Then('they see how Stickies works', async ({ page }) => {
  await expect(page.getByTestId('how-it-works')).toBeVisible();
});

Then('they can open a room by name', async ({ page }) => {
  await expect(page.getByTestId('room-entry-input')).toBeVisible();
});

When('they open the room {string} by name', async ({ page }, name: string) => {
  await page.getByTestId('room-entry-input').fill(name);
  await page.getByTestId('room-entry-go').click();
});

Then('they land on the {string} room pad', async ({ page }, slug: string) => {
  await expect(page).toHaveURL(new RegExp(`/${normalizeRoomSlug(slug)}$`));
  await expect(page.getByTestId('sticky-add')).toBeVisible();
});

When(
  'they open a fresh room by name and add a sticky {string}',
  async ({ page, roomSlug, state }, content: string) => {
    state.room = roomSlug;
    // Type the room name into the home entry box (the real create-a-room flow),
    // not a direct URL nav — this is the path that leaves Home mounted behind us.
    await page.getByTestId('room-entry-input').fill(roomSlug);
    await page.getByTestId('room-entry-go').click();
    await expect(page.getByTestId('sticky-add')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('sticky-add').click();
    await page.getByTestId('sticky-input').fill(content);
    await page.getByTestId('sticky-input').press('ControlOrMeta+Enter');
    await expect(page.getByText(content, { exact: true })).toBeVisible({ timeout: 15_000 });
    // Let the recents-row write (touchRoom) propagate to the GSI before we return
    // home, so the single view-enter refetch reads the fresh row (the GSI is
    // eventually consistent on the shared backend).
    await page.waitForTimeout(1500);
  },
);

When('they navigate back to the home page', async ({ page }) => {
  await page.goBack();
  await expect(page.getByTestId('room-entry-input')).toBeVisible({ timeout: 15_000 });
});

Then('that fresh room is listed in the recent rooms', async ({ page, state }) => {
  // The fix under test: the in-app return (goBack, which does NOT remount Home)
  // refetched the feed, so the just-edited room now appears — the check that
  // FAILS on the stale-feed bug. The recents GSI is eventually consistent on the
  // shared backend, so poll: each retry reloads to re-run the query in case the
  // row hadn't propagated by the first fetch.
  const name = prettifyRoomSlug(state.room);
  const feed = page.getByTestId('recent-rooms');
  await expect(feed).toBeVisible({ timeout: 15_000 });
  await expect(async () => {
    await expect(feed).toContainText(name, { timeout: 3_000 });
  }).toPass({
    timeout: 25_000,
    intervals: [1_000, 2_000, 3_000, 5_000],
  });
});

Then('the home page shows a retry, not a "no rooms" message', async ({ page }) => {
  await expect(page.getByTestId('load-error')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('load-retry')).toBeVisible();
  await expect(page.getByTestId('load-empty')).toHaveCount(0);
});
