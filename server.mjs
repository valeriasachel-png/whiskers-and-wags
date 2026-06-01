import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
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
    vetInfo: cleanText(input.vetInfo, 600),
    petProfiles: cleanText(input.petProfiles, 1200),
    careInstructions: cleanText(input.careInstructions),
    feedingSchedule: cleanText(input.feedingSchedule),
    medicalNeeds: cleanText(input.medicalNeeds),
    dailyRoutine: cleanText(input.dailyRoutine, 1200),
    accessInstructions: cleanText(input.accessInstructions, 1200),
    homeCareNotes: cleanText(input.homeCareNotes, 1200),
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
    ...(validation.details.address ? { address: 'Private Intake: Care Address' } : {}),
    ...(validation.details.vetInfo ? { vetInfo: 'Veterinarian Information' } : {}),
    ...(validation.details.petProfiles ? { petProfiles: 'Private Intake: Pet Names, Ages & Personalities' } : {}),
    ...(validation.details.careInstructions ? { careInstructions: 'Pet Care Instructions' } : {}),
    ...(validation.details.feedingSchedule ? { feedingSchedule: 'Private Intake: Feeding Schedule' } : {}),
    ...(validation.details.medicalNeeds ? { medicalNeeds: 'Private Intake: Medication or Special Needs' } : {}),
    ...(validation.details.dailyRoutine ? { dailyRoutine: 'Walks, Playtime & Daily Routine' } : {}),
    ...(validation.details.accessInstructions ? { accessInstructions: 'Access Instructions' } : {}),
    ...(validation.details.homeCareNotes ? { homeCareNotes: 'Home Care Notes' } : {}),
    ...(validation.details.emergencyContact ? { emergencyContact: 'Private Intake: Emergency Contact' } : {}),
    ...(validation.details.additionalNotes ? { additionalNotes: 'Additional Notes' } : {}),
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
        from: process.env.EMAIL_FROM || 'Whiskers and Wags <onboarding@resend.dev>',
        to: [destination],
        reply_to: validation.details.email,
        subject: `New ${validation.details.rating}-star client note from ${validation.details.displayName}`,
        text: body,
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
        text: body,
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
