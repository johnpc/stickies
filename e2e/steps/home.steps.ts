import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { normalizeRoomSlug } from '../../src/features/room/roomSlug';

const { Given, When, Then } = createBdd();

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

Then('the home page shows a retry, not a "no rooms" message', async ({ page }) => {
  await expect(page.getByTestId('load-error')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('load-retry')).toBeVisible();
  await expect(page.getByTestId('load-empty')).toHaveCount(0);
});
