// SOCIAL & EVENTS CONTENT: Replace these starter entries with real stories, event feeds, and verified local places.
const animalStories = [
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

const starterEvents = [
  {
    title: 'Global pet adoption awareness days',
    location: 'Worldwide',
    date: 'Seasonal',
    summary: 'Use this card for adoption drives, shelter campaigns, and animal welfare awareness dates.',
  },
  {
    title: 'Dog walks, fun runs, and charity events',
    location: 'Worldwide',
    date: 'Daily feed ready',
    summary: 'This slot is built for live event sources once an API or approved event calendar is connected.',
  },
  {
    title: 'Pet expos and animal education events',
    location: 'United States and beyond',
    date: 'Updated manually for now',
    summary: 'List expos, training events, reptile shows, cat shows, and family-friendly animal events.',
  },
];

const petFriendlyPlaces = [
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
    note: 'Use this card for trusted local stores, grooming stops, and emergency supply options.',
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

function cardTemplate(item) {
  return `
    <article class="social-card">
      <span>${item.type}</span>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <a href="${item.link}" data-track="social_story_click">Read or share</a>
    </article>
  `;
}

function eventTemplate(item) {
  return `
    <article class="event-card">
      <div>
        <span>${item.date}</span>
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
      </div>
      <strong>${item.location}</strong>
    </article>
  `;
}

function placeTemplate(item) {
  return `
    <article class="pet-place-card">
      <span>${item.area}</span>
      <h3>${item.title}</h3>
      <p>${item.note}</p>
    </article>
  `;
}

function tipTemplate([petType, tip]) {
  return `
    <article class="tip-card">
      <strong>${petType}</strong>
      <p>${tip}</p>
    </article>
  `;
}

document.querySelector('#animal-stories').innerHTML = animalStories.map(cardTemplate).join('');
document.querySelector('#event-list').innerHTML = starterEvents.map(eventTemplate).join('');
document.querySelector('#pet-friendly-places').innerHTML = petFriendlyPlaces.map(placeTemplate).join('');
document.querySelector('#pet-tips').innerHTML = petTips.map(tipTemplate).join('');

const updated = document.querySelector('#events-updated');
if (updated) {
  updated.textContent = `Starter feed checked ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())}`;
}
