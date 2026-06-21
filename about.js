// CARE MAP LOCATIONS: Replace demo entries with real countries, cities, photos, and pet stories later.
const careLocations = [
  {
    country: 'United States',
    status: 'Current service home',
    places: ['Madison, MS', 'Flowood, MS', 'Ridgeland, MS', 'Gluckstadt, MS', 'Northeast Jackson, MS'],
    note: 'Local pet and home sitting service area for Whiskers & Wags.',
  },
  {
    country: 'United Kingdom',
    status: 'Future story slot',
    places: ['Add city later'],
    note: 'Placeholder for a future pet-sitting memory, travel story, or client-approved care location.',
  },
  {
    country: 'France',
    status: 'Future story slot',
    places: ['Add city later'],
    note: 'Ready for a country highlight when you provide the details.',
  },
  {
    country: 'Mexico',
    status: 'Future story slot',
    places: ['Add city later'],
    note: 'Ready for a care story, photo, or travel note.',
  },
  {
    country: 'Brazil',
    status: 'Future story slot',
    places: ['Add city later'],
    note: 'A placeholder country for the interactive globe module.',
  },
  {
    country: 'South Africa',
    status: 'Future story slot',
    places: ['Add city later'],
    note: 'Add approved pet-sitting or animal-care context here later.',
  },
  {
    country: 'Australia',
    status: 'Future story slot',
    places: ['Add city later'],
    note: 'Ready for future care locations or animal stories.',
  },
  {
    country: 'Japan',
    status: 'Future story slot',
    places: ['Add city later'],
    note: 'A future clickable country highlight.',
  },
];

const chipGrid = document.querySelector('#country-chips');
const detail = document.querySelector('#map-detail');
const mapTargets = Array.from(document.querySelectorAll('.map-country, .map-pin'));

function renderLocation(location) {
  detail.innerHTML = `
    <span class="gallery-label">${location.status}</span>
    <h3>${location.country}</h3>
    <p>${location.note}</p>
    <div class="map-place-list">
      ${location.places.map((place) => `<span>${place}</span>`).join('')}
    </div>
  `;

  document.querySelectorAll('.country-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.country === location.country);
    chip.setAttribute('aria-pressed', String(chip.dataset.country === location.country));
  });
  mapTargets.forEach((target) => {
    target.classList.toggle('active', target.dataset.country === location.country);
  });
}

chipGrid.innerHTML = careLocations
  .map((location) => `<button class="country-chip" type="button" data-country="${location.country}" aria-pressed="false">${location.country}</button>`)
  .join('');

chipGrid.addEventListener('click', (event) => {
  const chip = event.target.closest('.country-chip');
  if (!chip) return;
  const location = careLocations.find((item) => item.country === chip.dataset.country);
  if (location) renderLocation(location);
});

mapTargets.forEach((target) => {
  target.setAttribute('tabindex', '0');
  target.setAttribute('role', 'button');
  target.setAttribute('aria-label', `Show ${target.dataset.country}`);
  target.addEventListener('click', () => {
    const location = careLocations.find((item) => item.country === target.dataset.country);
    if (location) renderLocation(location);
  });
  target.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const location = careLocations.find((item) => item.country === target.dataset.country);
    if (location) renderLocation(location);
  });
});

renderLocation(careLocations[0]);
