// AMAZON AFFILIATE EDIT: This is the public Associates tracking ID attached to every Amazon button.
// Replace this value only if Whiskers & Wags changes its Amazon tracking ID.
const amazonTrackingId = 'whiskersan07f-20';
// PRODUCT LISTING EDIT: Add only a specific Amazon listing URL/ASIN and details verified on that listing.
// PRODUCT IMAGES: Use Amazon-hosted listing images supplied by Amazon, not generated stand-ins.
const categories = [
  {
    name: 'Pet Food & Treat Storage',
    label: 'Food storage',
    intro: 'Verified products from exact Amazon listings.',
    products: [
      {
        asin: 'B0002DJOOI',
        name: 'Gamma2 Vittles Vault Pet Food Storage Container',
        description: 'Sealed dog and cat food storage container that fits up to 50 lbs, in Granite Stone.',
        details: ['Airtight lid', 'BPA Free', 'Made in the USA'],
        image: 'https://m.media-amazon.com/images/I/81IfhdDWS5L._AC_SL1000_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B0002DJOOI',
      },
      {
        asin: 'B09T78KX6G',
        name: 'OXO Good Grips Pet POP Container - 6.0 Qt/5.7 L with Half Scoop',
        description: 'Airtight clear storage container for up to 6.5 lbs of dog food or 4.5 lbs of cat food.',
        details: ['Airtight lid', 'Detachable 1/2 cup scoop', 'BPA Free'],
        image: 'https://m.media-amazon.com/images/I/91xwPWieobL._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B09T78KX6G',
      },
    ],
  },
  {
    name: 'Leashes, Collars & Harnesses',
    label: 'Walk gear',
    intro: 'Everyday walking gear chosen for secure, comfortable outings.',
    products: [
      {
        asin: 'B01NBOWPPD',
        name: 'Max and Neo Triple Handle Traffic Dog Leash Reflective',
        description: 'A reflective traffic leash with three padded handles for closer control when needed.',
        details: ['Triple handle design', 'Reflective stitching', 'Rescue donation program'],
        image: 'https://m.media-amazon.com/images/I/61IbEWUHP9L._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B01NBOWPPD',
      },
    ],
  },
  {
    name: 'Pet Beds & Blankets',
    label: 'Cozy beds',
    intro: 'Cozy comfort pieces for naps, furniture protection, and quiet time.',
    products: [
      {
        asin: 'B08FF9YJ7Y',
        name: 'Furhaven Orthopedic Dog Bed with Removable Bolsters & Washable Cover',
        description: 'Plush and velvet comfort sofa bed in Brownstone for dogs up to 55 lbs.',
        details: ['Large size', 'Removable bolsters', 'Washable cover'],
        image: 'https://m.media-amazon.com/images/I/61M2LeVvFfL._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B08FF9YJ7Y',
      },
      {
        asin: 'B07W7KHJHH',
        name: 'PetAmi Waterproof Dog Blanket for Couch - Extra Large 80 x 60',
        description: 'Reversible sherpa fleece pet throw and furniture protector in Light Grey.',
        details: ['Waterproof', 'Reversible fleece', 'Washable cover'],
        image: 'https://m.media-amazon.com/images/I/81qUmggXIsL._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B07W7KHJHH',
      },
    ],
  },
  {
    name: 'Grooming Supplies',
    label: 'Grooming',
    intro: 'Simple grooming essentials for cleanups between care visits.',
    products: [
      {
        asin: 'B00ZGPI3OY',
        name: 'Hertzko Self Cleaning Slicker Brush for Dogs and Cats',
        description: 'Pet hair brush for shedding, long hair, and short hair with easy-clean retractable bristles.',
        details: ['Self cleaning', 'Retractable bristles', 'Dogs and cats'],
        image: 'https://m.media-amazon.com/images/I/41R1fyIl85L._SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B00ZGPI3OY',
      },
      {
        asin: 'B0CCBK2QY1',
        name: 'Earth Rated Vet-Developed Dog Eye Wipes - 70 Count',
        description: 'Hypoallergenic pet wipes for dogs and cats to remove dirt and discharge.',
        details: ['Fragrance free', '70 count', 'Dogs and cats'],
        image: 'https://m.media-amazon.com/images/I/61L3yonhTOL._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B0CCBK2QY1',
      },
    ],
  },
  {
    name: 'Toys & Enrichment',
    label: 'Playtime',
    intro: 'Engaging favorites for play, treats, and indoor stimulation.',
    products: [
      {
        asin: 'B000AYN7LU',
        name: 'KONG Classic Stuffable Dog Toy for Medium Dogs',
        description: 'Fetch and chew toy with treat-filling capability and erratic bounce for extended play.',
        details: ['Natural rubber', 'Stuffable', 'Medium dogs'],
        image: 'https://m.media-amazon.com/images/I/61eVAqrR7uL._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B000AYN7LU',
      },
      {
        asin: 'B00DT2WL26',
        name: 'Catstages Tower of Tracks Cat Toy',
        description: 'Three-level track tower with six balls for interactive indoor cat enrichment.',
        details: ['3-level tower', '6 balls', 'Indoor enrichment'],
        image: 'https://m.media-amazon.com/images/I/81cJvfOdmlL._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B00DT2WL26',
      },
    ],
  },
  {
    name: 'Cleaning & Odor Control',
    label: 'Clean home',
    intro: 'Practical choices for fur, accidents, and fresh-feeling spaces.',
    products: [
      {
        asin: 'B00J9MYM5O',
        name: 'Rocco & Roxie Stain & Strong Odor Eliminator - 1 Gallon',
        description: 'Enzyme cleaner and pet odor eliminator for cat and dog urine stains in the home.',
        details: ['Enzyme cleaner', '1-gallon size', 'Stain and odor care'],
        image: 'https://m.media-amazon.com/images/I/71HPej1hPTL._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B00J9MYM5O',
      },
      {
        asin: 'B00BAGTNAQ',
        name: 'ChomChom Roller Pet Hair Remover - Original Size',
        description: 'Reusable lint roller for cat and dog hair on furniture, carpet, cars, rugs, and bedding.',
        details: ['Reusable', 'Portable', 'White'],
        image: 'https://m.media-amazon.com/images/I/71mmJsbMGZL._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B00BAGTNAQ',
      },
    ],
  },
  {
    name: 'Home Safety Items',
    label: 'Home safety',
    intro: 'Helpful home-check tools for comfortable stays and peace of mind.',
    products: [
      {
        asin: 'B000JJDI0G',
        name: 'Carlson Extra Wide Dog Gate with Small Pet Door',
        description: 'Walk-through pressure mounted indoor pet safety gate fitting openings 29.5 to 36.5 inches wide.',
        details: ['30 inches tall', 'Small pet door', 'Walk-through latch'],
        image: 'https://m.media-amazon.com/images/I/61vIdFLFtgL._AC_SX300_SY300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B000JJDI0G',
      },
      {
        asin: 'B07X6C9RMF',
        name: 'Blink Mini Indoor Plug-In Smart Security Camera',
        description: 'Compact white indoor camera with 1080p HD video, night vision, motion detection, and two-way audio.',
        details: ['1080p HD video', 'Motion detection', 'Two-way audio'],
        image: 'https://m.media-amazon.com/images/I/51vncWY4ROL._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B07X6C9RMF',
      },
    ],
  },
  {
    name: 'Travel Pet Supplies',
    label: 'Travel',
    intro: 'Packable food and water solutions for road trips and adventures.',
    products: [
      {
        asin: 'B073XKD21N',
        name: 'Comsun 2-Pack Extra Large Collapsible Dog Bowl',
        description: 'Foldable, expandable blue and green bowls for pet food and water while traveling.',
        details: ['2-pack', 'Up to 4 cups / 34 oz', 'Collapsible'],
        image: 'https://m.media-amazon.com/images/I/71y9F5cLH4L._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B073XKD21N',
      },
      {
        asin: 'B07MWB9XW1',
        name: 'Kurgo Kibble Carrier - Portable Dog Food Dry Bag',
        description: 'Coastal Blue compact travel storage bag with roll-top closure and 5 lb capacity.',
        details: ['5 lb capacity', 'Roll-top closure', 'Food-safe liner'],
        image: 'https://m.media-amazon.com/images/I/71zIRJbbDaL._AC_SY300_SX300_QL70_FMwebp_.jpg',
        amazonUrl: 'https://www.amazon.com/dp/B07MWB9XW1',
      },
    ],
  },
];

function amazonAffiliateLink(amazonUrl) {
  const destination = new URL(amazonUrl);
  destination.search = '';
  destination.searchParams.set('tag', amazonTrackingId);
  return destination.toString();
}

function productCard(product, categoryName) {
  const destination = amazonAffiliateLink(product.amazonUrl);
  return `
    <article class="product-card">
      <a class="product-image" href="${destination}" target="_blank" rel="sponsored noopener">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </a>
      <div class="product-body">
        <p class="product-category">${categoryName}</p>
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <ul class="product-details">${product.details.map((detail) => `<li>${detail}</li>`).join('')}</ul>
        <p class="product-detail">See Amazon for current options and availability.</p>
        <a class="amazon-link" href="${destination}" target="_blank" rel="sponsored noopener">
          Shop on Amazon <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </article>`;
}

const categoryFilters = document.querySelector('#category-filters');
const categoryResults = document.querySelector('#product-categories');

function renderCategory(activeIndex) {
  const category = categories[activeIndex];
  categoryFilters.querySelectorAll('button').forEach((button, index) => {
    button.classList.toggle('active', index === activeIndex);
    button.setAttribute('aria-selected', String(index === activeIndex));
    button.tabIndex = index === activeIndex ? 0 : -1;
  });

  categoryResults.innerHTML = `
    <section class="category" role="tabpanel" aria-labelledby="category-tab-${activeIndex}">
      <div class="category-heading">
        <div>
          <h3>${category.name}</h3>
          <p class="category-intro">${category.intro}</p>
        </div>
        <span class="result-count">${category.products.length} ${category.products.length === 1 ? 'pick' : 'picks'}</span>
      </div>
      <div class="products-grid">
        ${category.products.map((product) => productCard(product, category.name)).join('')}
      </div>
    </section>`;
}

categoryFilters.setAttribute('role', 'tablist');
categoryFilters.innerHTML = categories
  .map(
    (category, index) => `
      <button class="category-filter" id="category-tab-${index}" type="button" role="tab" aria-controls="product-categories" data-index="${index}">
        ${category.label}
      </button>`,
  )
  .join('');

categoryFilters.addEventListener('click', (event) => {
  const button = event.target.closest('.category-filter');
  if (!button) return;
  renderCategory(Number(button.dataset.index));
});

categoryFilters.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const currentIndex = Number(document.activeElement.dataset.index);
  const movement = event.key === 'ArrowRight' ? 1 : -1;
  const nextIndex = (currentIndex + movement + categories.length) % categories.length;
  categoryFilters.querySelector(`[data-index="${nextIndex}"]`).focus();
  renderCategory(nextIndex);
});

renderCategory(0);
