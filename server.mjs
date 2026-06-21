import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(root, '.env');

function loadLocalEnvironment() {
  if (!existsSync(envFile)) return;
  for (const rawLine of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadLocalEnvironment();

const PORT = Number(process.env.PORT || 4173);
const requestWindows = new Map();
const localPendingReviews = new Map();
let localApprovedReviews = [];
const REQUEST_LIMIT = 5;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let data = '';
  for await (const chunk of request) {
    data += chunk;
    if (data.length > 100_000) throw new Error('Request is too large.');
  }
  return JSON.parse(data || '{}');
}

function cleanText(value, maxLength = 4000) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function validateRequest(input) {
  const details = {
    fullName: cleanText(input.fullName, 120),
    address: cleanText(input.address, 250),
    phone: cleanText(input.phone, 60),
    email: cleanText(input.email, 160),
    serviceType: cleanText(input.serviceType, 40),
    serviceArea: cleanText(input.serviceArea, 60),
    preferredContact: cleanText(input.preferredContact, 20),
    petNames: cleanText(input.petNames, 160),
    petTypes: cleanText(input.petTypes, 100),
    petCount: cleanText(input.petCount, 3),
    initialNeeds: cleanText(input.initialNeeds),
    careInstructions: cleanText(input.careInstructions),
    feedingSchedule: cleanText(input.feedingSchedule),
    medicalNeeds: cleanText(input.medicalNeeds),
    emergencyContact: cleanText(input.emergencyContact, 200),
    additionalNotes: cleanText(input.additionalNotes),
  };
  const dates = Array.isArray(input.requestedDates)
    ? input.requestedDates.slice(0, 60).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    : [];
  details.requestedDates = dates.join(', ');

  const newFlow = Boolean(details.serviceArea || details.preferredContact || details.initialNeeds);
  const needsPetDetails = details.serviceType !== 'Home Sitting';
  const required = newFlow
    ? [
        'fullName',
        'phone',
        'email',
        'serviceType',
        'serviceArea',
        'preferredContact',
        ...(needsPetDetails ? ['petNames', 'petTypes', 'petCount', 'initialNeeds'] : []),
      ]
    : ['fullName', 'address', 'phone', 'email', 'serviceType', 'petNames', 'petTypes', 'petCount', 'careInstructions', 'emergencyContact'];
  if (required.some((field) => !details[field]) || !dates.length) {
    return { error: 'Please complete all required fields and select at least one date.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    return { error: 'Please enter a valid email address.' };
  }
  if (!['Pet Sitting', 'Home Sitting', 'Both'].includes(details.serviceType)) {
    return { error: 'Please choose a valid service type.' };
  }
  if (newFlow && !['Madison', 'Flowood', 'Ridgeland', 'Gluckstadt', 'Northeast Jackson', 'Other / Ask Us'].includes(details.serviceArea)) {
    return { error: 'Please choose a valid service area.' };
  }
  if (newFlow && !['Text', 'Call', 'Email'].includes(details.preferredContact)) {
    return { error: 'Please choose how you would like us to reply.' };
  }
  return { details };
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
  return randomBytes(16).toString('hex');
}

function siteUrl(request) {
  return String(process.env.SITE_URL || `http://${request.headers.host || `localhost:${PORT}`}`).replace(/\/$/, '');
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

function validateIntake(input) {
  const details = {
    clientName: cleanText(input.clientName, 120),
    phone: cleanText(input.phone, 60),
    email: cleanText(input.email, 160),
    address: cleanText(input.address, 500),
    emergencyContact: cleanText(input.emergencyContact, 500),
    vetInfo: cleanText(input.vetInfo, 600),
    petProfiles: cleanText(input.petProfiles, 1200),
    feedingSchedule: cleanText(input.feedingSchedule, 1200),
    medicationNeeds: cleanText(input.medicationNeeds, 1200),
    dailyRoutine: cleanText(input.dailyRoutine, 1200),
    accessInstructions: cleanText(input.accessInstructions, 1200),
    homeCareNotes: cleanText(input.homeCareNotes, 1200),
    additionalNotes: cleanText(input.additionalNotes, 1200),
  };

  const required = ['clientName', 'phone', 'email', 'address', 'emergencyContact', 'petProfiles', 'feedingSchedule'];
  if (required.some((field) => !details[field])) {
    return { error: 'Please complete all required intake fields before sending.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    return { error: 'Please enter a valid email address.' };
  }
  return { details };
}

function pdfText(value) {
  return String(value || '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+\n/g, '\n')
    .trim();
}

function escapePdf(value) {
  return pdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapPdfText(value, max = 88) {
  const text = pdfText(value || 'Not provided');
  const wrapped = [];
  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      wrapped.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > max && line) {
        wrapped.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) wrapped.push(line);
  }
  return wrapped;
}

function pdfDate() {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Chicago',
  }).format(new Date());
}

function makeSafeFilename(value) {
  return pdfText(value || 'client')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'client';
}

function createIntakePdf(details, labels) {
  const sections = [
    ['Client & Home', ['clientName', 'phone', 'email', 'address']],
    ['Emergency & Vet', ['emergencyContact', 'vetInfo']],
    ['Pet Routines', ['petProfiles', 'feedingSchedule', 'medicationNeeds', 'dailyRoutine']],
    ['Home Access & Notes', ['accessInstructions', 'homeCareNotes', 'additionalNotes']],
  ];
  const pages = [];
  let commands = [];
  let y = 760;
  const left = 54;
  const bottom = 54;

  function newPage() {
    if (commands.length) pages.push(commands.join('\n'));
    commands = [
      'BT',
      '/F2 18 Tf',
      `1 0 0 1 ${left} 792 Tm (Whiskers & Wags Private Client Intake) Tj`,
      '/F1 9 Tf',
      `1 0 0 1 ${left} 774 Tm (Generated ${escapePdf(pdfDate())}) Tj`,
      'ET',
    ];
    y = 742;
  }

  function ensureSpace(height) {
    if (y - height < bottom) newPage();
  }

  function addText(text, size = 10, font = 'F1', x = left) {
    commands.push('BT', `/${font} ${size} Tf`, `1 0 0 1 ${x} ${y} Tm (${escapePdf(text)}) Tj`, 'ET');
    y -= size + 5;
  }

  newPage();
  addText('Printable care summary for confirmed Whiskers & Wags clients.', 10);
  y -= 8;

  for (const [sectionTitle, keys] of sections) {
    ensureSpace(42);
    addText(sectionTitle, 13, 'F2');
    commands.push('0.76 0.55 0.61 RG', `${left} ${y + 7} 486 0.8 re S`, '0 0 0 RG');
    y -= 8;
    for (const key of keys) {
      const lines = wrapPdfText(details[key], 92);
      ensureSpace(22 + lines.length * 14);
      addText(labels[key], 10, 'F2');
      for (const line of lines) addText(line || 'Not provided', 10, 'F1', left + 12);
      y -= 8;
    }
    y -= 2;
  }

  pages.push(commands.join('\n'));

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${index + 4} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  pages.forEach((content, index) => {
    const streamObjectNumber = pages.length + 4 + index;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 ${pages.length * 2 + 4} 0 R >> >> /Contents ${streamObjectNumber} 0 R >>`);
  });
  pages.forEach((content) => {
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function toBase64(value) {
  return Buffer.from(value, 'binary').toString('base64');
}

function requestAllowed(request) {
  const forwardedAddress = cleanText(request.headers['x-forwarded-for'], 100).split(',')[0].trim();
  const address = forwardedAddress || request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recentRequests = (requestWindows.get(address) || []).filter((time) => now - time < REQUEST_WINDOW_MS);
  if (recentRequests.length >= REQUEST_LIMIT) return false;
  recentRequests.push(now);
  requestWindows.set(address, recentRequests);
  return true;
}

async function submitRequest(request, response) {
  let input;
  try {
    input = await readJson(request);
  } catch {
    return json(response, 400, { message: 'Please submit valid request details.' });
  }
  // Simple honeypot: automated submissions often populate this invisible field.
  if (cleanText(input.website, 100)) return json(response, 201, { message: 'Request sent.' });
  const validation = validateRequest(input);
  if (validation.error) return json(response, 400, { message: validation.error });
  if (!requestAllowed(request)) {
    return json(response, 429, { message: 'Too many requests have been submitted. Please try again a little later.' });
  }

  // BUSINESS EMAIL: Put the destination address and Resend API key in .env, never client-side code.
  const destination = process.env.BUSINESS_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!destination || destination.includes('PUT MY EMAIL HERE') || !apiKey || apiKey.includes('your_api_key')) {
    return json(response, 503, {
      message: 'Online request delivery is being set up. Please contact Whiskers and Wags directly for now.',
    });
  }

  const includePetDetails = validation.details.serviceType !== 'Home Sitting' || validation.details.petNames;
  const labels = {
    fullName: 'Full Name',
    phone: 'Phone Number',
    email: 'Email Address',
    preferredContact: 'Preferred Reply Method',
    requestedDates: 'Requested Dates',
    serviceType: 'Type of Service',
    serviceArea: 'Service Area',
    ...(includePetDetails
      ? {
          petNames: 'Pet Names',
          petTypes: 'Type of Pets',
          petCount: 'Number of Pets',
          initialNeeds: 'Initial Needs Note',
        }
      : {}),
    ...(validation.details.address ? { address: 'Address (legacy request)' } : {}),
    ...(validation.details.careInstructions ? { careInstructions: 'Pet Care Instructions' } : {}),
    ...(validation.details.feedingSchedule ? { feedingSchedule: 'Feeding Schedule' } : {}),
    ...(validation.details.medicalNeeds ? { medicalNeeds: 'Medication or Special Needs' } : {}),
    ...(validation.details.emergencyContact ? { emergencyContact: 'Emergency Contact' } : {}),
    ...(validation.details.additionalNotes ? { additionalNotes: 'Additional Notes' } : {}),
  };
  const body = Object.entries(labels)
    .map(([key, label]) => `${label}:\n${validation.details[key] || 'Not provided'}`)
    .join('\n\n');
  const pdf = createIntakePdf(validation.details, labels);
  const filename = `whiskers-wags-intake-${makeSafeFilename(validation.details.clientName)}.pdf`;

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Whiskers and Wags <onboarding@resend.dev>',
        to: [destination],
        reply_to: validation.details.email,
        subject: `New sitting request from ${validation.details.fullName}`,
        text: body,
      }),
    });
    if (!emailResponse.ok) {
      console.error('Email provider rejected request:', emailResponse.status, await emailResponse.text());
      return json(response, 502, { message: 'We could not send your request right now. Please try again shortly.' });
    }
    return json(response, 201, { message: 'Request sent.' });
  } catch (error) {
    console.error('Email request failed:', error.message);
    return json(response, 502, { message: 'We could not send your request right now. Please try again shortly.' });
  }
}

async function submitReview(request, response) {
  let input;
  try {
    input = await readJson(request);
  } catch {
    return json(response, 400, { message: 'Please submit valid review details.' });
  }
  // Simple honeypot: automated submissions often populate this invisible field.
  if (cleanText(input.website, 100)) return json(response, 201, { message: 'Review sent.' });
  const validation = validateReview(input);
  if (validation.error) return json(response, 400, { message: validation.error });
  if (!requestAllowed(request)) {
    return json(response, 429, { message: 'Too many notes have been submitted. Please try again a little later.' });
  }

  // BUSINESS EMAIL: Put the destination address and Resend API key in .env, never client-side code.
  const destination = process.env.BUSINESS_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!destination || destination.includes('PUT MY EMAIL HERE') || !apiKey || apiKey.includes('your_api_key')) {
    return json(response, 503, {
      message: 'Online review delivery is being set up. Please contact Whiskers and Wags directly for now.',
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
  localPendingReviews.set(reviewRecord.token, reviewRecord);

  const approvalUrl = `${siteUrl(request)}/api/review-approve?token=${encodeURIComponent(reviewRecord.token)}`;
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
        from: process.env.EMAIL_FROM || 'Whiskers and Wags <onboarding@resend.dev>',
        to: [destination],
        reply_to: validation.details.email,
        subject: `New ${validation.details.rating}-star client note from ${validation.details.displayName}`,
        text: body,
        html,
      }),
    });
    if (!emailResponse.ok) {
      console.error('Email provider rejected review:', emailResponse.status, await emailResponse.text());
      return json(response, 502, { message: 'We could not send your note right now. Please try again shortly.' });
    }
    return json(response, 201, { message: 'Review sent.' });
  } catch (error) {
    console.error('Email review failed:', error.message);
    return json(response, 502, { message: 'We could not send your note right now. Please try again shortly.' });
  }
}

function reviewApprovalPage(response, status, title, message) {
  response.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex,nofollow">
    <title>${escapeHtml(title)} | Whiskers &amp; Wags</title>
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
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <a href="/gallery">View Gallery &amp; Client Notes</a>
    </main>
  </body>
</html>`);
}

function listApprovedReviews(response) {
  return json(response, 200, { reviews: localApprovedReviews });
}

function approveReview(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const token = url.searchParams.get('token') || '';
  if (!/^[a-f0-9]{32}$/.test(token)) {
    return reviewApprovalPage(response, 400, 'Approval link is not valid', 'This review approval link is missing or malformed.');
  }

  const pending = localPendingReviews.get(token);
  if (!pending) {
    return reviewApprovalPage(response, 404, 'Review already handled', 'This client note may have already been approved, expired, or removed.');
  }

  if (!pending.publishPermission) {
    localPendingReviews.delete(token);
    return reviewApprovalPage(response, 403, 'Not approved for publishing', 'This client did not give permission to feature their note, so it was kept private.');
  }

  const approved = publicReview({ ...pending, approvedAt: new Date().toISOString() });
  localApprovedReviews = [
    approved,
    ...localApprovedReviews.filter((review) => review.id !== pending.id),
  ].slice(0, 12);
  localPendingReviews.delete(token);

  return reviewApprovalPage(response, 200, 'Review approved', 'This client note is now approved and can appear on the Gallery & Client Notes page.');
}

async function submitIntake(request, response) {
  let input;
  try {
    input = await readJson(request);
  } catch {
    return json(response, 400, { message: 'Please submit valid intake details.' });
  }
  // Simple honeypot: automated submissions often populate this invisible field.
  if (cleanText(input.website, 100)) return json(response, 201, { message: 'Intake sent.' });
  const validation = validateIntake(input);
  if (validation.error) return json(response, 400, { message: validation.error });
  if (!requestAllowed(request)) {
    return json(response, 429, { message: 'Too many intake forms have been submitted. Please try again a little later.' });
  }

  const destination = process.env.BUSINESS_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!destination || destination.includes('PUT MY EMAIL HERE') || !apiKey || apiKey.includes('your_api_key')) {
    return json(response, 503, {
      message: 'Online intake delivery is being set up. Please contact Whiskers and Wags directly for now.',
    });
  }

  const labels = {
    clientName: 'Client Name',
    phone: 'Phone Number',
    email: 'Email Address',
    address: 'Care Address',
    emergencyContact: 'Emergency Contact',
    vetInfo: 'Veterinarian Information',
    petProfiles: 'Pet Names, Ages & Personalities',
    feedingSchedule: 'Feeding Schedule',
    medicationNeeds: 'Medication or Special Needs',
    dailyRoutine: 'Walks, Playtime & Daily Routine',
    accessInstructions: 'Access Instructions',
    homeCareNotes: 'Home Care Notes',
    additionalNotes: 'Additional Notes',
  };
  const body = Object.entries(labels)
    .map(([key, label]) => `${label}:\n${validation.details[key] || 'Not provided'}`)
    .join('\n\n');

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Whiskers and Wags <onboarding@resend.dev>',
        to: [destination],
        reply_to: validation.details.email,
        subject: `Private client intake from ${validation.details.clientName}`,
        text: `${body}\n\nA printable PDF copy is attached for phone viewing or printing.`,
        attachments: [
          {
            filename,
            content: toBase64(pdf),
          },
        ],
      }),
    });
    if (!emailResponse.ok) {
      console.error('Email provider rejected intake:', emailResponse.status, await emailResponse.text());
      return json(response, 502, { message: 'We could not send your intake right now. Please try again shortly.' });
    }
    return json(response, 201, { message: 'Intake sent.' });
  } catch (error) {
    console.error('Email intake failed:', error.message);
    return json(response, 502, { message: 'We could not send your intake right now. Please try again shortly.' });
  }
}

async function submitEvent(request, response) {
  let input;
  try {
    input = await readJson(request);
  } catch {
    return json(response, 400, { message: 'Please submit valid analytics details.' });
  }
  const event = {
    event: cleanText(input.event, 120),
    path: cleanText(input.path, 220),
    target: cleanText(input.target, 300),
    timestamp: new Date().toISOString(),
  };
  if (event.event) console.log('conversion-event', event);
  response.writeHead(204, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  return response.end();
}

async function serveStatic(request, response, url) {
  const cleanRouteFiles = {
    '/request': '/request.html',
    '/gallery': '/gallery.html',
    '/picks': '/picks.html',
    '/privacy': '/privacy.html',
    '/client-intake': '/client-intake.html',
    '/social-events': '/social-events.html',
    '/about': '/about.html',
  };
  const requested =
    url.pathname === '/' ? '/index.html' : cleanRouteFiles[url.pathname] || decodeURIComponent(url.pathname);
  const filename = path.resolve(root, `.${requested}`);
  const permitted = filename.startsWith(`${root}${path.sep}`) && filename !== envFile;
  const extension = path.extname(filename).toLowerCase();
  if (!permitted || !contentTypes[extension]) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  try {
    const content = await readFile(filename);
    response.writeHead(200, {
      'Content-Type': contentTypes[extension],
      'Content-Security-Policy': "default-src 'self'; img-src 'self' https://m.media-amazon.com; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname === '/health') {
    if (request.method === 'HEAD') {
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      return response.end();
    }
    return json(response, 200, { status: 'ok' });
  }
  if (request.method === 'POST' && url.pathname === '/api/requests') {
    return submitRequest(request, response);
  }
  if (request.method === 'POST' && url.pathname === '/api/reviews') {
    return submitReview(request, response);
  }
  if (request.method === 'GET' && url.pathname === '/api/reviews') {
    return listApprovedReviews(response);
  }
  if (request.method === 'GET' && url.pathname === '/api/review-approve') {
    return approveReview(request, response);
  }
  if (request.method === 'POST' && url.pathname === '/api/intake') {
    return submitIntake(request, response);
  }
  if (request.method === 'POST' && url.pathname === '/api/events') {
    return submitEvent(request, response);
  }
  if (request.method === 'GET' || request.method === 'HEAD') return serveStatic(request, response, url);
  response.writeHead(405, { Allow: 'GET, HEAD, POST' });
  response.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Whiskers and Wags is available at http://localhost:${PORT}`);
});
