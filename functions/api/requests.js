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

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json(405, { message: 'Method not allowed.' });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json(400, { message: 'Please submit valid request details.' });
  }

  // Simple honeypot: automated submissions often populate this invisible field.
  if (cleanText(input.website, 100)) return json(201, { message: 'Request sent.' });

  const validation = validateRequest(input);
  if (validation.error) return json(400, { message: validation.error });

  // BUSINESS EMAIL: Configure these in Cloudflare Pages settings, never frontend files.
  const destination = env.BUSINESS_EMAIL;
  const apiKey = env.RESEND_API_KEY;
  if (!destination || !apiKey || apiKey.includes('your_api_key')) {
    return json(503, {
      message: 'Online request delivery is being set up. Please contact Whiskers & Wags directly for now.',
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
        from: env.EMAIL_FROM || 'Whiskers & Wags <onboarding@resend.dev>',
        to: [destination],
        reply_to: validation.details.email,
        subject: `New sitting request from ${validation.details.fullName}`,
        text: body,
      }),
    });

    if (!emailResponse.ok) {
      console.error('Email provider rejected request:', emailResponse.status);
      return json(502, { message: 'We could not send your request right now. Please try again shortly.' });
    }
    return json(201, { message: 'Request sent.' });
  } catch (error) {
    console.error('Email request failed:', error.message);
    return json(502, { message: 'We could not send your request right now. Please try again shortly.' });
  }
}
