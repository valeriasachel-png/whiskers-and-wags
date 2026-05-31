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

function cleanText(value, maxLength = 2000) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function validateReview(input) {
  const details = {
    rating: Number(input.rating),
    review: cleanText(input.review, 1400),
    displayName: cleanText(input.displayName, 100),
    email: cleanText(input.email, 160),
    publishPermission: Boolean(input.publishPermission),
  };

  if (!Number.isInteger(details.rating) || details.rating < 1 || details.rating > 5) {
    return { error: 'Please choose a rating from 1 to 5 stars.' };
  }
  if (!details.review || !details.displayName || !details.email) {
    return { error: 'Please add your name, email, and review before sending.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    return { error: 'Please enter a valid email address.' };
  }

  return { details };
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json(405, { message: 'Method not allowed.' });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json(400, { message: 'Please submit valid review details.' });
  }

  // Simple honeypot: automated submissions often populate this invisible field.
  if (cleanText(input.website, 100)) return json(201, { message: 'Review sent.' });

  const validation = validateReview(input);
  if (validation.error) return json(400, { message: validation.error });

  // BUSINESS EMAIL: Configure these in Cloudflare Pages settings, never frontend files.
  const destination = env.BUSINESS_EMAIL;
  const apiKey = env.RESEND_API_KEY;
  if (!destination || !apiKey || apiKey.includes('your_api_key')) {
    return json(503, {
      message: 'Online review delivery is being set up. Please contact Whiskers & Wags directly for now.',
    });
  }

  const labels = {
    rating: 'Star Rating',
    displayName: 'Display Name',
    email: 'Private Email',
    publishPermission: 'Permission to Feature',
    review: 'Client Note',
  };
  const body = Object.entries(labels)
    .map(([key, label]) => {
      const value = key === 'publishPermission'
        ? (validation.details.publishPermission ? 'Yes, first name and note may be featured after review.' : 'No, keep private for now.')
        : validation.details[key];
      return `${label}:\n${value}`;
    })
    .join('\n\n');

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'Whiskers & Wags <onboarding@resend.dev>',
        to: [destination],
        reply_to: validation.details.email,
        subject: `New ${validation.details.rating}-star client note from ${validation.details.displayName}`,
        text: body,
      }),
    });

    if (!emailResponse.ok) {
      console.error('Email provider rejected review:', emailResponse.status);
      return json(502, { message: 'We could not send your note right now. Please try again shortly.' });
    }
    return json(201, { message: 'Review sent.' });
  } catch (error) {
    console.error('Email review failed:', error.message);
    return json(502, { message: 'We could not send your note right now. Please try again shortly.' });
  }
}
