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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function makeId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function siteUrl(request, env) {
  return String(env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
}

function publicReview(record) {
  return {
    id: record.id,
    rating: record.rating,
    review: record.review,
    displayName: record.displayName,
    approvedAt: record.approvedAt,
  };
}

async function readApprovedReviews(env) {
  if (!env.REVIEWS_KV) return [];
  const reviews = await env.REVIEWS_KV.get('approved-reviews', { type: 'json' });
  return Array.isArray(reviews) ? reviews.slice(0, 12) : [];
}

async function savePendingReview(env, review) {
  if (!env.REVIEWS_KV) return false;
  await env.REVIEWS_KV.put(`pending-review:${review.token}`, JSON.stringify(review), {
    expirationTtl: 60 * 60 * 24 * 90,
  });
  return true;
}

export async function onRequest({ request, env }) {
  if (request.method === 'GET') {
    const reviews = await readApprovedReviews(env);
    return json(200, { reviews });
  }

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
  if (!env.REVIEWS_KV) {
    return json(503, {
      message: 'Review approval storage is being set up. Please contact Whiskers & Wags directly for now.',
    });
  }

  const reviewRecord = {
    id: makeId(),
    token: makeId(),
    status: 'pending',
    rating: validation.details.rating,
    review: validation.details.review,
    displayName: validation.details.displayName.split(/\s+/)[0],
    email: validation.details.email,
    publishPermission: validation.details.publishPermission,
    createdAt: new Date().toISOString(),
  };
  await savePendingReview(env, reviewRecord);

  const approvalUrl = `${siteUrl(request, env)}/api/review-approve?token=${encodeURIComponent(reviewRecord.token)}`;
  const permissionCopy = reviewRecord.publishPermission
    ? `Accept and publish this note: ${approvalUrl}`
    : 'The client did not give permission to feature this note, so no approval link was included.';

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
    .join('\n\n') + `\n\n${permissionCopy}`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#24352f;line-height:1.5;max-width:640px">
      <h1 style="color:#24352f;font-size:24px;margin:0 0 8px">New client note</h1>
      <p style="margin:0 0 18px">A client submitted a ${reviewRecord.rating}-star note for Whiskers &amp; Wags.</p>
      <div style="background:#fff7f5;border:1px solid #f1c7cf;border-radius:18px;padding:18px;margin:0 0 18px">
        <p><strong>Display name:</strong> ${escapeHtml(reviewRecord.displayName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(reviewRecord.email)}</p>
        <p><strong>Rating:</strong> ${'★'.repeat(reviewRecord.rating)}${'☆'.repeat(5 - reviewRecord.rating)}</p>
        <p><strong>Permission:</strong> ${reviewRecord.publishPermission ? 'Yes, first name and note may be featured after review.' : 'No, keep private for now.'}</p>
        <p><strong>Client note:</strong><br>${escapeHtml(reviewRecord.review).replace(/\n/g, '<br>')}</p>
      </div>
      ${reviewRecord.publishPermission ? `
        <a href="${escapeHtml(approvalUrl)}" style="display:inline-block;background:#2f6f59;color:#ffffff;text-decoration:none;font-weight:700;border-radius:999px;padding:13px 20px">Accept &amp; Publish Review</a>
        <p style="font-size:13px;color:#66756e;margin-top:12px">Clicking the button approves this note and allows it to appear on the Gallery &amp; Client Notes page.</p>
      ` : `
        <p style="background:#f8eadf;border-radius:14px;padding:12px 14px"><strong>Private only:</strong> The client did not grant publishing permission.</p>
      `}
    </div>
  `;

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
        html,
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
