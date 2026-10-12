import test from 'node:test';
import assert from 'node:assert/strict';
import { hydrateExistingContent, includeApprovedReviews } from '../site-content-defaults.js';
import { onRequest as admin } from '../functions/api/admin.js';
import { onRequest as publicContent } from '../functions/api/content.js';

test('legacy content gains originals once without losing custom content', () => {
  const old = { home: { tagline: 'Custom welcome' }, gallery: { photos: [{ id: 'custom', title: 'Custom', image: '/assets/custom.jpg' }] }, social: { tips: [{ petType: 'Dogs', tip: 'Custom tip' }] } };
  const upgraded = hydrateExistingContent(old);
  assert.equal(upgraded.gallery.photos.length, 20);
  assert.equal(upgraded.social.tips.length, 9);
  assert.equal(upgraded.home.tagline, 'Custom welcome');
  assert.deepEqual(hydrateExistingContent(upgraded), upgraded);
  upgraded.gallery.photos = [];
  upgraded.social.tips = [];
  assert.equal(hydrateExistingContent(upgraded).gallery.photos.length, 0);
  assert.equal(hydrateExistingContent(upgraded).social.tips.length, 0);
});

test('approved review hydration respects edited and hidden reviews and excludes private data', () => {
  const content = hydrateExistingContent({});
  content.gallery.testimonials = [{ id: 'edited', sourceReviewId: 'one', review: 'Corrected' }];
  content.gallery.hiddenReviewIds = ['two'];
  const result = includeApprovedReviews(content, [
    { id: 'one', review: 'Original' }, { id: 'two', review: 'Hidden' },
    { id: 'three', review: 'New', displayName: 'Client', rating: 5, email: 'private@example.com', token: 'private-token' },
  ]);
  assert.equal(result.gallery.testimonials.length, 2);
  assert.equal(result.gallery.testimonials[0].review, 'Corrected');
  assert.equal(result.gallery.testimonials[1].sourceReviewId, 'three');
  assert.ok(!JSON.stringify(result).includes('private'));
});

test('production admin edits and deletions survive save and reload without changing approval records', async () => {
  let saved = null;
  const approved = [{ id: 'existing-review', review: 'Original review', displayName: 'Client', rating: 4, email: 'private@example.com' }];
  const env = {
    ADMIN_PASSWORD: 'test-only', ADMIN_SESSION_SECRET: 'test-only-session',
    SITE_CONTENT_KV: { get: async () => saved, put: async (_key, value) => { saved = JSON.parse(value); } },
    REVIEWS_KV: { get: async () => approved },
  };
  const call = (action, method = 'GET', payload, cookie = '') => admin({ env, request: new Request(`https://example.com/api/admin?action=${action}`, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, ...(payload ? { body: JSON.stringify(payload) } : {}) }) });
  assert.equal((await call('content')).status, 401);
  const login = await call('login', 'POST', { username: 'OBANDO26', password: 'test-only' });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const initial = (await (await call('content', 'GET', null, cookie)).json()).content;
  assert.equal(initial.gallery.photos.length, 19);
  assert.equal(initial.social.tips.length, 8);
  assert.equal(initial.gallery.testimonials.length, 1);
  initial.gallery.photos[0].caption = 'Edited caption';
  initial.gallery.photos.splice(1, 1);
  initial.social.tips[0].tip = 'Edited tip';
  initial.gallery.testimonials[0].review = 'Edited review';
  assert.equal((await call('content', 'PUT', { content: initial }, cookie)).status, 200);
  const reloaded = (await (await call('content', 'GET', null, cookie)).json()).content;
  assert.equal(reloaded.gallery.photos.length, 18);
  assert.equal(reloaded.gallery.photos[0].caption, 'Edited caption');
  assert.equal(reloaded.gallery.testimonials.length, 1);
  assert.equal(reloaded.gallery.testimonials[0].review, 'Edited review');
  assert.equal(reloaded.social.tips[0].tip, 'Edited tip');
  reloaded.gallery.photos = [];
  reloaded.social.tips = [];
  reloaded.gallery.hiddenReviewIds = ['existing-review'];
  reloaded.gallery.testimonials = [];
  await call('content', 'PUT', { content: reloaded }, cookie);
  const final = (await (await call('content', 'GET', null, cookie)).json()).content;
  assert.equal(final.gallery.photos.length, 0);
  assert.equal(final.social.tips.length, 0);
  assert.equal(final.gallery.testimonials.length, 0);
  assert.equal(approved[0].review, 'Original review');
  const publicResult = await publicContent({env, request: new Request('https://example.com/api/content')});
  assert.ok(!(await publicResult.text()).includes('private@example.com'));
});
