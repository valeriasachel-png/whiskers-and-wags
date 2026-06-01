function json(status, body = {}) {
  if (status === 204) {
    return new Response(null, {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function cleanText(value, maxLength = 120) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json(405, { message: 'Method not allowed.' });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json(400, { message: 'Please submit valid analytics details.' });
  }

  const event = {
    event: cleanText(input.event),
    path: cleanText(input.path, 220),
    target: cleanText(input.target, 300),
    timestamp: new Date().toISOString(),
  };

  if (!event.event) return json(204);

  // ANALYTICS EDIT: Add ANALYTICS_WEBHOOK_URL in Cloudflare if you want click events sent to a webhook.
  // Without a webhook, this endpoint safely accepts events without storing customer data.
  if (env.ANALYTICS_WEBHOOK_URL) {
    await fetch(env.ANALYTICS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch((error) => console.error('Analytics webhook failed:', error.message));
  }

  return json(204);
}
