// SOCIAL & EVENTS CONTENT: Starter entries are used only when a free live feed is unavailable.
const fallbackStories = [
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
];

const fallbackEvents = [
  {
    title: 'Global pet adoption awareness days',
    location: 'Worldwide',
    date: 'Seasonal',
    summary: 'A fallback slot for adoption drives, shelter campaigns, and animal welfare awareness dates.',
  },
  {
    title: 'Dog walks, fun runs, and charity events',
    location: 'Worldwide',
    date: 'Current feed backup',
    summary: 'A backup slot for public dog walks, charity events, shelter fundraisers, and animal-friendly outings.',
  },
  {
    title: 'Pet expos and animal education events',
    location: 'United States and beyond',
    date: 'Ready to update',
    summary: 'Use this for expos, adoption events, animal shows, rescue fundraisers, and educational events.',
  },
];

const fallbackPlaces = [
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
];

const petTips = [
  ['Dogs', 'Pack a familiar blanket or toy before travel days to lower stress during routine changes.'],
  ['Cats', 'Keep feeding spots, litter areas, and hiding places predictable when you are away.'],
  ['Birds', 'Leave clear cage, lighting, food, and quiet-time notes for anyone helping with care.'],
  ['Reptiles', 'Temperature and humidity notes matter. Write exact ranges, timers, and feeding preferences.'],
  ['Small pets', 'Rabbits, guinea pigs, hamsters, and ferrets need careful enclosure checks and fresh water.'],
  ['Fish', 'Pre-portion food if possible. Overfeeding is one of the easiest mistakes for helpers to make.'],
  ['Senior pets', 'Note mobility needs, favorite resting spots, and any changes that should be watched closely.'],
  ['Unique pets', 'The more unusual the pet, the more useful a simple daily checklist becomes.'],
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function safeUrl(value, fallback = '#') {
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) || url.origin === window.location.origin ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function cardTemplate(item) {
  const link = safeUrl(item.link, '/gallery');
  const external = link.startsWith('http') && !link.startsWith(window.location.origin);
  return `
    <article class="social-card">
      <span>${escapeHtml(item.type || 'Animal story')}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <a href="${escapeHtml(link)}" ${external ? 'target="_blank" rel="noopener"' : ''} data-track="social_story_click">Read story</a>
    </article>
  `;
}

function eventTemplate(item) {
  const title = escapeHtml(item.title);
  const link = item.link ? safeUrl(item.link) : '';
  return `
    <article class="event-card">
      <div>
        <span>${escapeHtml(item.date || 'Date TBA')}</span>
        <h3>${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener" data-track="social_event_click">${title}</a>` : title}</h3>
        <p>${escapeHtml(item.summary)}</p>
      </div>
      <strong>${escapeHtml(item.location || 'Location TBA')}</strong>
    </article>
  `;
}

function placeTemplate(item) {
  const title = escapeHtml(item.title);
  const link = item.link ? safeUrl(item.link) : '';
  return `
    <article class="pet-place-card">
      <span>${escapeHtml(item.area || 'Jackson metro')}</span>
      <h3>${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener" data-track="pet_place_click">${title}</a>` : title}</h3>
      <p>${escapeHtml(item.note)}</p>
    </article>
  `;
}

function tipTemplate([petType, tip]) {
  return `
    <article class="tip-card">
      <strong>${escapeHtml(petType)}</strong>
      <p>${escapeHtml(tip)}</p>
    </article>
  `;
}

function renderFeed(feed, fromLiveEndpoint = false) {
  document.querySelector('#animal-stories').innerHTML = (feed.stories || fallbackStories).map(cardTemplate).join('');
  document.querySelector('#event-list').innerHTML = (feed.events || fallbackEvents).map(eventTemplate).join('');
  document.querySelector('#pet-friendly-places').innerHTML = (feed.places || fallbackPlaces).map(placeTemplate).join('');

  const updated = document.querySelector('#events-updated');
  if (updated) {
    const date = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(feed.updatedAt || Date.now()));
    const status = ['live_event_calendar', 'live_google_news'].includes(feed.status?.events)
      ? 'Current events'
      : feed.status?.places === 'live_openstreetmap' || feed.status?.news === 'live_gdelt'
        ? 'Partly live'
        : fromLiveEndpoint
          ? 'Feed fallback'
          : 'Starter feed';
    updated.textContent = `${status} checked ${date}`;
  }
}

async function hydrateLiveFeed() {
  renderFeed({ stories: fallbackStories, events: fallbackEvents, places: fallbackPlaces });
  try {
    const response = await fetch('/api/social-feed', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Feed unavailable');
    const feed = await response.json();
    renderFeed(feed, true);
  } catch {
    renderFeed({ stories: fallbackStories, events: fallbackEvents, places: fallbackPlaces });
  }
}

document.querySelector('#pet-tips').innerHTML = petTips.map(tipTemplate).join('');
hydrateLiveFeed();
