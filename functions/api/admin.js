const CONTENT_KEY = 'site-content-v1';
const SESSION_COOKIE = 'ww_admin';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

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

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

function cleanText(value, maxLength = 1000) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function cleanLongText(value, maxLength = 2400) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function safeHref(value) {
  const href = cleanText(value, 300);
  if (!href) return '';
  if (href.startsWith('/')) return href;
  try {
    const url = new URL(href);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? href : '';
  } catch {
    return '';
  }
}

function cleanImage(value) {
  const image = String(value ?? '').trim();
  if (!image) return '';
  if (image.startsWith('/assets/')) return image.slice(0, 240);
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(image) && image.length <= 2_500_000) {
    return image;
  }
  return '';
}

function cleanRating(value) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 5;
}

function sanitizeContent(input = {}) {
  const photos = Array.isArray(input.gallery?.photos)
    ? input.gallery.photos.slice(0, 18).map((photo) => ({
        id: cleanText(photo.id, 80) || crypto.randomUUID(),
        title: cleanText(photo.title, 90),
        caption: cleanText(photo.caption, 240),
        image: cleanImage(photo.image),
      })).filter((photo) => photo.title && photo.image)
    : [];

  const testimonials = Array.isArray(input.gallery?.testimonials)
    ? input.gallery.testimonials.slice(0, 12).map((testimonial) => ({
        id: cleanText(testimonial.id, 80) || crypto.randomUUID(),
        rating: cleanRating(testimonial.rating),
        displayName: cleanText(testimonial.displayName, 80),
        review: cleanLongText(testimonial.review, 1000),
      })).filter((testimonial) => testimonial.displayName && testimonial.review)
    : [];

  const tips = Array.isArray(input.social?.tips)
    ? input.social.tips.slice(0, 12).map((tip) => ({
        petType: cleanText(tip.petType, 60),
        tip: cleanLongText(tip.tip, 260),
      })).filter((tip) => tip.petType && tip.tip)
    : [];

  return {
    announcement: {
      enabled: Boolean(input.announcement?.enabled),
      text: cleanText(input.announcement?.text, 180),
      linkText: cleanText(input.announcement?.linkText, 60) || 'Request Care',
      linkHref: safeHref(input.announcement?.linkHref) || '/request',
    },
    home: {
      tagline: cleanText(input.home?.tagline, 90),
      intro: cleanLongText(input.home?.intro, 420),
    },
    gallery: { photos, testimonials },
    social: {
      petOfWeekTitle: cleanText(input.social?.petOfWeekTitle, 90),
      petOfWeekDescription: cleanLongText(input.social?.petOfWeekDescription, 340),
      petOfWeekImage: cleanImage(input.social?.petOfWeekImage),
      tips,
    },
    updatedAt: new Date().toISOString(),
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

function cookieValue(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || '';
}

function base64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64Url(signature);
}

async function makeSession(env) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin.${expires}`;
  const signature = await sign(payload, env.ADMIN_SESSION_SECRET);
  return `${payload}.${signature}`;
}

async function sessionValid(request, env) {
  const session = cookieValue(request, SESSION_COOKIE);
  const parts = session.split('.');
  if (parts.length !== 3 || parts[0] !== 'admin') return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;
  const expected = await sign(`${parts[0]}.${parts[1]}`, env.ADMIN_SESSION_SECRET);
  return expected === parts[2];
}

function setupReady(env) {
  return Boolean(env.ADMIN_PASSWORD && env.ADMIN_SESSION_SECRET && env.SITE_CONTENT_KV);
}

async function readContent(env) {
  const saved = await env.SITE_CONTENT_KV.get(CONTENT_KEY, { type: 'json' });
  return mergeContent(saved || {});
}

async function writeContent(env, content) {
  await env.SITE_CONTENT_KV.put(CONTENT_KEY, JSON.stringify(content));
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || '';

  if (!setupReady(env)) {
    return json(503, {
      message: 'Admin backend is not configured yet. Add ADMIN_PASSWORD, ADMIN_SESSION_SECRET, and SITE_CONTENT_KV in Cloudflare Pages.',
    });
  }

  if (request.method === 'GET' && action === 'session') {
    return json(200, { authenticated: await sessionValid(request, env) });
  }

  if (request.method === 'POST' && action === 'login') {
    const input = await request.json().catch(() => ({}));
    if (String(input.password || '') !== String(env.ADMIN_PASSWORD)) {
      return json(401, { message: 'That password is not correct.' });
    }
    const session = await makeSession(env);
    return json(200, { authenticated: true }, {
      'Set-Cookie': `${SESSION_COOKIE}=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`,
    });
  }

  if (request.method === 'POST' && action === 'logout') {
    return json(200, { authenticated: false }, {
      'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
    });
  }

  if (!await sessionValid(request, env)) {
    return json(401, { message: 'Please sign in again.' });
  }

  if (request.method === 'GET' && action === 'content') {
    return json(200, { content: await readContent(env) });
  }

  if (request.method === 'PUT' && action === 'content') {
    const input = await request.json().catch(() => ({}));
    const content = sanitizeContent(input.content || {});
    await writeContent(env, content);
    return json(200, { content });
  }

  return json(405, { message: 'Unsupported admin request.' });
}
