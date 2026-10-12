// Run against a disposable local server, never against production content.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.TEST_URL || 'http://localhost:4174';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname));
const browser = await chromium.launch({ headless: true, ...(process.env.TEST_BROWSER_CHANNEL ? { channel: process.env.TEST_BROWSER_CHANNEL } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${baseURL}/admin`);
  await page.getByLabel('Username', { exact: true }).fill('OBANDO26');
  await page.getByLabel('Admin password', { exact: true }).fill('admin');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.locator('#editor-fields:not([disabled])').waitFor();
  const first = page.locator('#photo-list .admin-item').first();
  await first.locator('summary').click();
  const caption = first.getByLabel('Photo caption (optional)');
  await caption.fill('Preview test: a happy afternoon.');
  assert.equal(await first.locator('[data-preview-caption]').textContent(), 'Preview test: a happy afternoon.');
  assert.equal(await caption.evaluate((el) => el === document.activeElement), true);
  let publicData = await (await page.request.get(`${baseURL}/api/content`)).json();
  assert.notEqual(publicData.content.gallery.photos[0].caption, 'Preview test: a happy afternoon.');
  await first.locator('input[type=file]').setInputFiles(new URL('../assets/gallery/blue-eyed-aussie.jpg', import.meta.url).pathname);
  await page.waitForFunction(() => document.querySelector('#photo-list [data-preview-image]')?.src.startsWith('data:image/jpeg;'));
  assert.equal(await caption.inputValue(), 'Preview test: a happy afternoon.');
  const previewSrc = await first.locator('[data-preview-image]').getAttribute('src');
  await first.getByRole('button', { name: 'Preview & Save Changes', exact: true }).click();
  const dialog = page.locator('#publish-dialog');
  assert.equal(await dialog.locator('[data-preview-image]').getAttribute('src'), previewSrc);
  assert.equal(await dialog.locator('[data-preview-caption]').textContent(), 'Preview test: a happy afternoon.');
  await dialog.getByRole('button', { name: 'Keep Editing' }).click();
  publicData = await (await page.request.get(`${baseURL}/api/content`)).json();
  assert.notEqual(publicData.content.gallery.photos[0].image, previewSrc);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await first.screenshot({ path: '/tmp/ww-photo-preview-mobile.png' });
  await first.getByRole('button', { name: 'Preview & Save Changes', exact: true }).click();
  await page.route('**/api/admin?action=content', (route) => route.request().method() === 'PUT'
    ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Test save unavailable. Please try again.' }) })
    : route.continue());
  await dialog.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await page.getByText('Test save unavailable. Please try again.', { exact: true }).waitFor();
  assert.equal(await caption.inputValue(), 'Preview test: a happy afternoon.');
  await page.unroute('**/api/admin?action=content');
  await first.getByRole('button', { name: 'Preview & Save Changes', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await page.locator('#save-status.success').waitFor();
  await page.reload();
  await page.locator('#editor-fields:not([disabled])').waitFor();
  await first.locator('summary').click();
  assert.equal(await caption.inputValue(), 'Preview test: a happy afternoon.');
  assert.equal(await first.locator('[data-preview-image]').getAttribute('src'), previewSrc);
  await page.goto(`${baseURL}/gallery`);
  await page.waitForFunction(() => document.querySelector('#gallery-feature-caption')?.textContent === 'Preview test: a happy afternoon.');
  assert.equal(await page.locator('#gallery-feature-image').getAttribute('src'), previewSrc);
  console.log('Passed: live text/photo preview, no early publication, Keep Editing, mobile overflow, error recovery, Save and public gallery persistence.');
} finally {
  await browser.close();
}
