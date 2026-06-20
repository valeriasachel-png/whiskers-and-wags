function page(status, title, message) {
  return new Response(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex,nofollow">
    <title>${title} | Whiskers &amp; Wags</title>
    <style>
      :root { color-scheme: light; }
      body {
        align-items: center;
        background: linear-gradient(135deg, #ffe3ea, #fff8df 45%, #dff4dc 75%, #31c7bc);
        color: #24352f;
        display: flex;
        font-family: Arial, sans-serif;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
        padding: 24px;
      }
      main {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(47, 111, 89, 0.18);
        border-radius: 28px;
        box-shadow: 0 28px 80px rgba(36, 53, 47, 0.16);
        max-width: 620px;
        padding: clamp(28px, 6vw, 48px);
      }
      h1 { font-size: clamp(2rem, 6vw, 3rem); margin: 0 0 12px; }
      p { font-size: 1.05rem; line-height: 1.6; margin: 0 0 24px; }
      a {
        background: #2f6f59;
        border-radius: 999px;
        color: white;
        display: inline-block;
        font-weight: 700;
        padding: 13px 20px;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${message}</p>
      <a href="/gallery">View Gallery &amp; Client Notes</a>
    </main>
  </body>
</html>`, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function publicReview(record) {
  return {
    id: record.id,
    rating: record.rating,
    review: record.review,
    displayName: record.displayName,
    approvedAt: new Date().toISOString(),
  };
}

export async function onRequestGet({ request, env }) {
  if (!env.REVIEWS_KV) {
    return page(503, 'Approval storage is not connected yet', 'Create and bind a Cloudflare KV namespace named REVIEWS_KV before approving client notes.');
  }

  const token = new URL(request.url).searchParams.get('token') || '';
  if (!/^[a-f0-9]{32}$/.test(token)) {
    return page(400, 'Approval link is not valid', 'This review approval link is missing or malformed.');
  }

  const pendingKey = `pending-review:${token}`;
  const pending = await env.REVIEWS_KV.get(pendingKey, { type: 'json' });
  if (!pending) {
    return page(404, 'Review already handled', 'This client note may have already been approved, expired, or removed.');
  }

  if (!pending.publishPermission) {
    await env.REVIEWS_KV.delete(pendingKey);
    return page(403, 'Not approved for publishing', 'This client did not give permission to feature their note, so it was kept private.');
  }

  const approved = await env.REVIEWS_KV.get('approved-reviews', { type: 'json' });
  const reviews = Array.isArray(approved) ? approved : [];
  const nextReviews = [
    publicReview(pending),
    ...reviews.filter((review) => review.id !== pending.id),
  ].slice(0, 12);

  await env.REVIEWS_KV.put('approved-reviews', JSON.stringify(nextReviews));
  await env.REVIEWS_KV.delete(pendingKey);

  return page(200, 'Review approved', 'This client note is now approved and can appear on the Gallery & Client Notes page.');
}
