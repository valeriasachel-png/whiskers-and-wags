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

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json(405, { message: 'Method not allowed.' });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json(400, { message: 'Please submit valid intake details.' });
  }

  // Simple honeypot: automated submissions often populate this invisible field.
  if (cleanText(input.website, 100)) return json(201, { message: 'Intake sent.' });

  const validation = validateIntake(input);
  if (validation.error) return json(400, { message: validation.error });

  const destination = env.BUSINESS_EMAIL;
  const apiKey = env.RESEND_API_KEY;
  if (!destination || !apiKey || apiKey.includes('your_api_key')) {
    return json(503, {
      message: 'Online intake delivery is being set up. Please contact Whiskers & Wags directly for now.',
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
        from: env.EMAIL_FROM || 'Whiskers & Wags <onboarding@resend.dev>',
        to: [destination],
        reply_to: validation.details.email,
        subject: `Private client intake from ${validation.details.clientName}`,
        text: body,
      }),
    });

    if (!emailResponse.ok) {
      console.error('Email provider rejected intake:', emailResponse.status);
      return json(502, { message: 'We could not send your intake right now. Please try again shortly.' });
    }
    return json(201, { message: 'Intake sent.' });
  } catch (error) {
    console.error('Email intake failed:', error.message);
    return json(502, { message: 'We could not send your intake right now. Please try again shortly.' });
  }
}
