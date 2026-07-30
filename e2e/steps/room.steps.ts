import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from './fixtures';

const { Given, When, Then } = createBdd(test);

Given('a visitor opens a fresh room', async ({ page, roomSlug, state }) => {
  state.room = roomSlug;
  await page.goto(`/${roomSlug}`);
  await expect(page.getByTestId('sticky-add')).toBeVisible({ timeout: 15_000 });
});

When('they tap the share button', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByTestId('room-share').click();
});

Then('the room URL is copied to their clipboard', async ({ page }) => {
  await expect(page.getByText('Room link copied')).toBeVisible({ timeout: 5_000 });
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toBe(page.url());
});

When('they add a sticky that says {string}', async ({ page }, content: string) => {
  await page.getByTestId('sticky-add').click();
  await page.getByTestId('sticky-input').fill(content);
  await page.getByTestId('sticky-input').press('Enter');
  // Wait for the note to render (the create round-trip landed) before any step
  // navigates away — leaving too early cancels the follow-up recents-row write.
  await expect(page.getByText(content, { exact: true })).toBeVisible({ timeout: 15_000 });
});

Then('the sticky {string} appears on the pad', async ({ page }, content: string) => {
  await expect(page.getByText(content, { exact: true })).toBeVisible({ timeout: 15_000 });
});

When('they reload the room', async ({ page }) => {
  await page.reload();
  await expect(page.getByTestId('sticky-add')).toBeVisible({ timeout: 15_000 });
});

Then('the sticky {string} is still on the pad', async ({ page }, content: string) => {
  await expect(page.getByText(content, { exact: true })).toBeVisible({ timeout: 15_000 });
});

Then('the sticky links to {string}', async ({ page }, href: string) => {
  await expect(page.getByRole('link').first()).toHaveAttribute('href', href, { timeout: 15_000 });
});

Then('no sticky is a clickable link', async ({ page }) => {
  // The sticky renders (its text is visible) but never as an anchor.
  await expect(page.getByText('javascript:alert(1)', { exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId('sticky-grid').getByRole('link')).toHaveCount(0);
});

When('they go back to the home page', async ({ page }) => {
  // Let the recents-row write (fired right after the sticky create) settle;
  // a full navigation aborts any request still in flight.
  await page.waitForTimeout(1_500);
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
});

Given('a visitor opens the room {string} directly by URL', async ({ page }, name: string) => {
  await page.goto(`/${name}`);
  await expect(page.getByTestId('sticky-add')).toBeVisible({ timeout: 15_000 });
});

Then('the app-association file is served at {string}', async ({ page }, path: string) => {
  const res = await page.request.get(`/${path}`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.applinks.details[0].appID).toContain('com.johncorser.stickies');
});

Then('their room is listed in the recent rooms', async ({ page, state }) => {
  // The recents feed reads a GSI that's eventually consistent, and react-query
  // caches the first fetch — so reload-poll until our just-edited room appears
  // (rather than asserting a single, possibly-stale, fetch).
  const link = page.locator(`a[href="/${state.room}"]`);
  await expect(async () => {
    if (await link.count()) return;
    await page.reload();
    await expect(link).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
});
