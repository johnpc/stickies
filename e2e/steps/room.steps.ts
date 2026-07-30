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
  // The share panel (QR + URL + copy) opens; copy from there.
  await page.getByTestId('share-panel').waitFor({ timeout: 8_000 });
  await page.getByTestId('share-copy').click();
});

Then('the room shows at least one person present', async ({ page }) => {
  await expect(page.getByTestId('presence-badge')).toContainText('here', { timeout: 20_000 });
});

When('they delete the first sticky', async ({ page }) => {
  await page.getByTestId('sticky').first().getByTestId('sticky-delete').click();
});

Then('the sticky {string} is gone', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true })).toHaveCount(0, { timeout: 10_000 });
});

When('they undo the delete', async ({ page }) => {
  await page.getByTestId('app-toast-action').click();
});

When('they copy the sticky', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByTestId('text-copy').first().click();
});

Then('{string} is on the clipboard', async ({ page }, text: string) => {
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toBe(text);
});

Then('a QR code for the room is shown', async ({ page }) => {
  await expect(page.getByTestId('share-qr')).toBeVisible({ timeout: 8_000 });
});

Then('the room URL is copied to their clipboard', async ({ page }) => {
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toBe(page.url());
});

When('they upload an image file', async ({ page }) => {
  // A tiny valid 1x1 PNG, set directly on the hidden file input.
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await page.getByTestId('sticky-file-input').setInputFiles({
    name: 'pixel.png',
    mimeType: 'image/png',
    buffer: Buffer.from(pngBase64, 'base64'),
  });
});

Then('an inline image sticky is shown', async ({ page }) => {
  await expect(page.getByTestId('media-image')).toBeVisible({ timeout: 20_000 });
});

When('they upload a text file with many lines', async ({ page }) => {
  const code = Array.from({ length: 20 }, (_, i) => `const line${i} = ${i};`).join('\n');
  await page.getByTestId('sticky-file-input').setInputFiles({
    name: 'demo.ts',
    mimeType: 'text/plain',
    buffer: Buffer.from(code, 'utf8'),
  });
});

Then('a document sticky shows a preview with an expand control', async ({ page }) => {
  await expect(page.getByTestId('doc-sticky')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('doc-expand')).toBeVisible();
  await expect(page.getByTestId('doc-copy')).toBeVisible();
});

When('they add a fenced code snippet', async ({ page }) => {
  const code = "```js\nconst greeting = 'hi';\nconsole.log(greeting);\n```";
  await page.getByTestId('sticky-add').click();
  await page.getByTestId('sticky-input').fill(code);
  await page.getByTestId('sticky-input').press('Enter');
  await expect(page.getByTestId('code-sticky')).toBeVisible({ timeout: 15_000 });
});

Then('a code sticky is shown with line numbers', async ({ page }) => {
  const code = page.getByTestId('code-sticky');
  await expect(code).toBeVisible();
  // The 2-line snippet renders a numbered gutter (1, 2) and a language tag.
  const gutter = code.locator('.code-sticky__gutter');
  await expect(gutter).toContainText('1');
  await expect(gutter).toContainText('2');
  await expect(page.getByTestId('code-lang')).toHaveText('js');
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

When('they recolor the first sticky blue', async ({ page }) => {
  await page.getByTestId('sticky').first().getByTestId('color-blue').click();
  await page.waitForTimeout(1200); // let the recolor write settle before a reload
});

Then('the first sticky is blue', async ({ page }) => {
  await expect(page.getByTestId('sticky').first()).toHaveClass(/sticky--blue/, { timeout: 15_000 });
});

When('they add three stickies {string} {string} {string}', async ({ page }, a, b, c) => {
  for (const t of [a, b, c]) {
    await page.getByTestId('sticky-add').click();
    await page.getByTestId('sticky-input').fill(t);
    await page.getByTestId('sticky-input').press('Enter');
    await expect(page.getByText(t, { exact: true })).toBeVisible({ timeout: 15_000 });
  }
});

When('they drag the last sticky onto the first', async ({ page }) => {
  // Reorder is pointer-based: press the last sticky's grip and drag to the left
  // edge of the first (a REAL mouse drag — the earlier native-DnD impl didn't
  // actually work, so exercise the true interaction here).
  const stickies = page.getByTestId('sticky');
  const grip = stickies.last().getByTestId('sticky-grip');
  const gb = await grip.boundingBox();
  const first = await stickies.first().boundingBox();
  if (!gb || !first) throw new Error('missing grip/first rects');
  await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await page.mouse.down();
  // Nudge once so pointerdown's listeners are attached before the real move,
  // then drag into the LEFT HALF of the first card (insert-before), settling on
  // the insertion line before releasing — pointer drags are timing-sensitive.
  await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2 - 6, { steps: 3 });
  await page.mouse.move(first.x + first.width * 0.2, first.y + first.height / 2, { steps: 16 });
  await expect(page.getByTestId('insert-line').first()).toBeVisible({ timeout: 5_000 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
});

Then('the stickies read {string} {string} {string}', async ({ page }, a, b, c) => {
  await expect(page.getByTestId('sticky').nth(0)).toContainText(a, { timeout: 15_000 });
  await expect(page.getByTestId('sticky').nth(1)).toContainText(b);
  await expect(page.getByTestId('sticky').nth(2)).toContainText(c);
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

Then('a link preview card is shown', async ({ page }) => {
  // The server resolver scrapes OG tags; github.com has them, so a card renders.
  await expect(page.getByTestId('link-preview')).toBeVisible({ timeout: 20_000 });
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
