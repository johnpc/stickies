import { chromium } from '@playwright/test';
const b = await chromium.launch();
const room = 'pd-' + Math.floor(Date.now() / 1000);
const p = await (await b.newContext()).newPage();
await p.goto('http://localhost:5173/' + room);
await p.getByTestId('sticky-add').waitFor({ timeout: 20000 });
// poll the badge over 12s
for (let i = 0; i < 6; i++) {
  await p.waitForTimeout(2000);
  const t = await p
    .getByTestId('presence-badge')
    .textContent()
    .catch(() => '(none)');
  console.log(`t+${(i + 1) * 2}s:`, t);
}
await b.close();
