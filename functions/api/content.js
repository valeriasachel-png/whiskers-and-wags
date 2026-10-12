import { hydrateExistingContent } from '../../site-content-defaults.js';
const CONTENT_KEY = 'site-content-v1';

function defaultContent() {
  return {
    announcement: {
      enabled: false,
      text: '',
      linkText: 'Request Care',
      linkHref: '/request',
    },
    home: {
      tagline: '',
      intro: '',
    },
    gallery: {
      photos: [],
      testimonials: [],
    },
    social: {
      petOfWeekTitle: '',
      petOfWeekDescription: '',
      petOfWeekImage: '',
      tips: [],
    },
    updatedAt: null,
  };
}

function mergeContent(content = {}) {
  const fallback = defaultContent();
  return {
    ...fallback,
    ...content,
    announcement: { ...fallback.announcement, ...(content.announcement || {}) },
    home: { ...fallback.home, ...(content.home || {}) },
    gallery: {
      ...fallback.gallery,
      ...(content.gallery || {}),
      photos: Array.isArray(content.gallery?.photos) ? content.gallery.photos : [],
      testimonials: Array.isArray(content.gallery?.testimonials) ? content.gallery.testimonials : [],
    },
    social: {
      ...fallback.social,
      ...(content.social || {}),
      tips: Array.isArray(content.social?.tips) ? content.social.tips : [],
    },
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function readContent(env) {
  if (!env.SITE_CONTENT_KV) return hydrateExistingContent(defaultContent());
  const saved = await env.SITE_CONTENT_KV.get(CONTENT_KEY, { type: 'json' });
  return hydrateExistingContent(mergeContent(saved || {}));
}

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') {
    return json(405, { message: 'Method not allowed.' });
  }

  const content = await readContent(env);
  return json(200, { content });
}
