function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=21600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function fallbackFeed(ticketmasterConfigured = false) {
  return {
    updatedAt: new Date().toISOString(),
    status: {
      news: 'fallback',
      events: ticketmasterConfigured ? 'fallback' : 'needs_ticketmaster_key',
      places: 'fallback',
    },
    stories: [
      {
        title: 'Rescue wins and adoption updates',
        type: 'Community story',
        summary: 'Feature a local shelter win, foster story, or happy adoption update with permission and a source link.',
        link: '/gallery',
      },
      {
        title: 'Animal art, photos, and tiny moments',
        type: 'Cute find',
        summary: 'Share wholesome pet art, sweet photos, or a short animal story that feels on-brand for Whiskers & Wags.',
        link: '/gallery',
      },
      {
        title: 'Helpful animal science made simple',
        type: 'Learning note',
        summary: 'Turn a useful pet behavior or care article into a warm, easy-to-read summary for local families.',
        link: '/picks',
      },
    ],
    events: [
      {
        title: 'Global pet adoption awareness days',
        location: 'Worldwide',
        date: 'Seasonal',
        summary: 'Add the free Ticketmaster developer key to unlock live pet and animal event listings.',
      },
      {
        title: 'Dog walks, fun runs, and charity events',
        location: 'Worldwide',
        date: 'Live feed ready',
        summary: 'This slot is wired for Ticketmaster Discovery API results once the key is connected.',
      },
      {
        title: 'Pet expos and animal education events',
        location: 'United States and beyond',
        date: 'Ready to update',
        summary: 'Use this for expos, adoption events, animal shows, rescue fundraisers, and educational events.',
      },
    ],
    places: [
      {
        title: 'Pet-friendly patios',
        area: 'Madison, Flowood, Ridgeland',
        note: 'Great for calm dogs when weather is comfortable. Always call first to confirm current patio rules.',
      },
      {
        title: 'Walking trails and green spaces',
        area: 'Jackson metro',
        note: 'Leashed walks, cleanup bags, water, and heat awareness make outings easier and safer.',
      },
      {
        title: 'Pet supply stops',
        area: 'Nearby communities',
        note: 'Trusted local stores and supply stops can be featured here as they are verified.',
      },
      {
        title: 'Travel-friendly public spots',
        area: 'Ask before visiting',
        note: 'Some hotels, markets, and outdoor spaces welcome pets with rules. Verify before bringing them along.',
      },
    ],
  };
}

function cleanText(value, maxLength = 240) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function formatDate(value) {
  if (!value) return 'Date TBA';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Date TBA';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
    method: options.method || 'GET',
    body: options.body,
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}`);
  return response.json();
}

async function fetchOverpassJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'WhiskersAndWags/1.0 (https://whiskersandwagsms.com)',
    },
  });
  if (!response.ok) throw new Error(`Overpass failed ${response.status}`);
  return response.json();
}

async function getAnimalStories() {
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.searchParams.set('query', '"animal rescue" OR "pet adoption" OR wildlife OR "animal shelter"');
  url.searchParams.set('mode', 'ArtList');
  url.searchParams.set('format', 'json');
  url.searchParams.set('maxrecords', '6');
  url.searchParams.set('sort', 'DateDesc');

  const data = await fetchJson(url);
  return (data.articles || []).slice(0, 6).map((article) => ({
    title: cleanText(article.title, 120) || 'Animal story',
    type: cleanText(article.domain, 60) || 'Animal news',
    summary: cleanText(article.seendate ? `Seen ${formatDate(article.seendate)}. Tap through to read the full source story.` : 'Tap through to read the full source story.', 190),
    link: article.url || '#',
  }));
}

async function getAnimalEvents(apiKey) {
  if (!apiKey || apiKey.includes('your_ticketmaster')) return null;
  const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('keyword', 'pet dog cat animal adoption rescue expo');
  url.searchParams.set('size', '6');
  url.searchParams.set('sort', 'date,asc');

  const data = await fetchJson(url);
  const events = data?._embedded?.events || [];
  return events.slice(0, 6).map((event) => {
    const venue = event?._embedded?.venues?.[0];
    const city = venue?.city?.name;
    const state = venue?.state?.stateCode || venue?.country?.countryCode;
    return {
      title: cleanText(event.name, 120) || 'Animal event',
      location: cleanText([city, state].filter(Boolean).join(', ') || venue?.name || 'Location TBA', 90),
      date: formatDate(event.dates?.start?.localDate || event.dates?.start?.dateTime),
      summary: cleanText(event.info || event.pleaseNote || 'Tap through for event details, availability, and current rules.', 190),
      link: event.url || '',
    };
  });
}

async function getPetFriendlyPlaces() {
  const query = `[out:json][timeout:12];
    (
      node["leisure"="dog_park"](32.19,-90.23,32.67,-89.86);
      way["leisure"="dog_park"](32.19,-90.23,32.67,-89.86);
      node["shop"="pet"](32.19,-90.23,32.67,-89.86);
      way["shop"="pet"](32.19,-90.23,32.67,-89.86);
      node["amenity"="veterinary"](32.19,-90.23,32.67,-89.86);
      way["amenity"="veterinary"](32.19,-90.23,32.67,-89.86);
    );
    out center tags 8;`;
  const url = new URL('https://overpass-api.de/api/interpreter');
  url.searchParams.set('data', query);

  const data = await fetchOverpassJson(url);
  return (data.elements || [])
    .filter((place) => place.tags?.name)
    .slice(0, 8)
    .map((place) => {
      const tags = place.tags || {};
      const city = tags['addr:city'] || 'Jackson metro';
      const kind = tags.leisure === 'dog_park'
        ? 'Dog park / outdoor spot'
        : tags.shop === 'pet'
          ? 'Pet supply stop'
          : tags.amenity === 'veterinary'
            ? 'Veterinary resource'
            : 'Pet-friendly resource';
      return {
        title: cleanText(tags.name, 90),
        area: cleanText(city, 60),
        note: cleanText(`${kind}. ${tags.website ? 'Website available from map data.' : 'Confirm hours, pet rules, and services before visiting.'}`, 170),
        link: tags.website || `https://www.openstreetmap.org/${place.type}/${place.id}`,
      };
    });
}

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') {
    return json(405, { message: 'Method not allowed.' });
  }

  const fallback = fallbackFeed(Boolean(env.TICKETMASTER_API_KEY));
  const result = {
    ...fallback,
    status: { ...fallback.status },
  };

  const [stories, events, places] = await Promise.allSettled([
    getAnimalStories(),
    getAnimalEvents(env.TICKETMASTER_API_KEY),
    getPetFriendlyPlaces(),
  ]);

  if (stories.status === 'fulfilled' && stories.value.length) {
    result.stories = stories.value;
    result.status.news = 'live_gdelt';
  }
  if (events.status === 'fulfilled' && events.value?.length) {
    result.events = events.value;
    result.status.events = 'live_ticketmaster';
  }
  if (places.status === 'fulfilled' && places.value.length) {
    result.places = places.value;
    result.status.places = 'live_openstreetmap';
  }

  return json(200, result);
}
