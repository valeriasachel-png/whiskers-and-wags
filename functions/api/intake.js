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
  if (typeof btoa === 'function') return btoa(value);
  return Buffer.from(value, 'binary').toString('base64');
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
        from: env.EMAIL_FROM || 'Whiskers & Wags <onboarding@resend.dev>',
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
      console.error('Email provider rejected intake:', emailResponse.status);
      return json(502, { message: 'We could not send your intake right now. Please try again shortly.' });
    }
    return json(201, { message: 'Intake sent.' });
  } catch (error) {
    console.error('Email intake failed:', error.message);
    return json(502, { message: 'We could not send your intake right now. Please try again shortly.' });
  }
}
