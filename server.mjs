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
    petNames: cleanText(input.petNames, 160),
    petTypes: cleanText(input.petTypes, 100),
    petCount: cleanText(input.petCount, 3),
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

  const required = [
    'fullName',
    'address',
    'phone',
    'email',
    'serviceType',
    'petNames',
    'petTypes',
    'petCount',
    'careInstructions',
    'emergencyContact',
  ];
  if (required.some((field) => !details[field]) || !dates.length) {
    return { error: 'Please complete all required fields and select at least one date.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    return { error: 'Please enter a valid email address.' };
  }
  if (!['Pet Sitting', 'Home Sitting', 'Both'].includes(details.serviceType)) {
    return { error: 'Please choose a valid service type.' };
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

  const labels = {
    fullName: 'Full Name',
    address: 'Address',
    phone: 'Phone Number',
    email: 'Email Address',
    requestedDates: 'Requested Dates',
    serviceType: 'Type of Service',
    petNames: 'Pet Names',
    petTypes: 'Type of Pets',
    petCount: 'Number of Pets',
    careInstructions: 'Pet Care Instructions',
    feedingSchedule: 'Feeding Schedule',
    medicalNeeds: 'Medication or Special Needs',
    emergencyContact: 'Emergency Contact',
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

async function serveStatic(request, response, url) {
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
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
  if (request.method === 'GET' || request.method === 'HEAD') return serveStatic(request, response, url);
  response.writeHead(405, { Allow: 'GET, HEAD, POST' });
  response.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Whiskers and Wags is available at http://localhost:${PORT}`);
});
