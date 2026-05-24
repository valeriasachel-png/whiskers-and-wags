// AMAZON AFFILIATE SETUP:
// 1. Apply through Amazon Associates using your public site URL.
// 2. In your Associates account, generate an official Special Link for each item below.
// 3. Paste each generated URL into its `affiliateLink` field.
// Until a Special Link is added, cards use an ordinary Amazon search link and do not earn commission.
// PRODUCT IMAGES: Only add official images supplied through Amazon's linking/API tools; do not copy listing photos.
const categories = [
  {
    name: 'Pet Food & Treat Storage',
    icon: '&#127869;',
    intro: 'Sealed, easy-to-clean storage helps keep feeding instructions simple and pantry areas tidy during visits.',
    products: [
      {
        name: 'Gamma2 Vittles Vault Pet Food Storage',
        description: 'An airtight kibble storage option for keeping bulk food organized between visits.',
        query: 'Gamma2 Vittles Vault Pet Food Storage Container',
        affiliateLink: '',
      },
      {
        name: 'OXO Good Grips Pet POP Container',
        description: 'A compact clear container option for treats or smaller portions of dry food.',
        query: 'OXO Good Grips Pet POP Container',
        affiliateLink: '',
      },
    ],
  },
  {
    name: 'Leashes, Collars & Harnesses',
    icon: '&#128062;',
    intro: 'Comfortable, well-fitted walking gear can make scheduled outings calmer for pets and sitters alike.',
    products: [
      {
        name: 'RUFFWEAR Front Range Dog Harness',
        description: 'A padded everyday harness option designed for routine walks and adventures.',
        query: 'RUFFWEAR Front Range Dog Harness',
        affiliateLink: '',
      },
      {
        name: 'Max and Neo Double Handle Traffic Leash',
        description: 'A leash with an additional handle option for close control during busy walks.',
        query: 'Max and Neo Double Handle Traffic Dog Leash',
        affiliateLink: '',
      },
    ],
  },
  {
    name: 'Pet Beds & Blankets',
    icon: '&#9729;',
    intro: 'Washable comfort items help maintain familiar, cozy resting places while a family is away.',
    products: [
      {
        name: 'Furhaven Orthopedic Dog Bed',
        description: 'A cushioned bed option for dogs who appreciate a supportive nap spot.',
        query: 'Furhaven Orthopedic Dog Bed',
        affiliateLink: '',
      },
      {
        name: 'PetAmi Waterproof Dog Blanket',
        description: 'A washable blanket option that helps protect favorite furniture and car seats.',
        query: 'PetAmi Waterproof Dog Blanket',
        affiliateLink: '',
      },
    ],
  },
  {
    name: 'Grooming Supplies',
    icon: '&#10024;',
    intro: 'Small grooming routines can help pets feel comfortable and help homes stay pleasantly maintained.',
    products: [
      {
        name: 'Hertzko Self-Cleaning Slicker Brush',
        description: 'A brush option for gentle coat maintenance and easier cleanup afterward.',
        query: 'Hertzko Self Cleaning Slicker Brush',
        affiliateLink: '',
      },
      {
        name: 'Earth Rated Dog Wipes',
        description: 'A handy wipe option for muddy paws after neighborhood walks.',
        query: 'Earth Rated Dog Wipes',
        affiliateLink: '',
      },
    ],
  },
  {
    name: 'Toys & Enrichment',
    icon: '&#10084;',
    intro: 'Age- and size-appropriate enrichment can help keep pets engaged during quiet time at home.',
    products: [
      {
        name: 'KONG Classic Dog Toy',
        description: 'A durable enrichment toy option that can support a familiar treat routine.',
        query: 'KONG Classic Dog Toy',
        affiliateLink: '',
      },
      {
        name: 'Catstages Tower of Tracks Cat Toy',
        description: 'An interactive track toy option for cats who enjoy batting and independent play.',
        query: 'Catstages Tower of Tracks Cat Toy',
        affiliateLink: '',
      },
    ],
  },
  {
    name: 'Cleaning & Odor Control',
    icon: '&#10024;',
    intro: 'Pet-friendly cleaning basics are useful to have ready for quick, calm household cleanups.',
    products: [
      {
        name: 'Rocco & Roxie Stain & Odor Eliminator',
        description: 'An enzyme cleaner option intended for common pet mess cleanup needs.',
        query: 'Rocco Roxie Stain Odor Eliminator',
        affiliateLink: '',
      },
      {
        name: 'ChomChom Roller Pet Hair Remover',
        description: 'A reusable hair-removal option for sofas, blankets, and fabric seating.',
        query: 'ChomChom Roller Pet Hair Remover',
        affiliateLink: '',
      },
    ],
  },
  {
    name: 'Home Safety Items',
    icon: '&#127968;',
    intro: 'Simple boundary and monitoring tools may support the home routine chosen by each pet family.',
    products: [
      {
        name: 'Carlson Extra Wide Walk-Through Pet Gate',
        description: 'A gate option for maintaining approved pet areas inside the home.',
        query: 'Carlson Extra Wide Walk Through Pet Gate',
        affiliateLink: '',
      },
      {
        name: 'Blink Mini Indoor Security Camera',
        description: 'An indoor camera option for owners who want remote home check-ins.',
        query: 'Blink Mini Indoor Security Camera',
        affiliateLink: '',
      },
    ],
  },
  {
    name: 'Travel Pet Supplies',
    icon: '&#128663;',
    intro: 'Packable food and water accessories make trips and sitter handoffs easier to organize.',
    products: [
      {
        name: 'COMSUN Collapsible Dog Bowls',
        description: 'Packable bowl options for water breaks and meals on the go.',
        query: 'COMSUN Collapsible Dog Bowls',
        affiliateLink: '',
      },
      {
        name: 'Kurgo Kibble Carrier',
        description: 'A travel food-storage option for keeping measured meals close at hand.',
        query: 'Kurgo Kibble Carrier',
        affiliateLink: '',
      },
    ],
  },
];

function amazonSearchLink(query) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
}

function productCard(product, icon, categoryName) {
  const hasAffiliateLink = Boolean(product.affiliateLink);
  const destination = hasAffiliateLink ? product.affiliateLink : amazonSearchLink(product.query);
  const label = hasAffiliateLink ? 'Shop on Amazon' : 'View on Amazon';
  return `
    <article class="product-card">
      <div class="product-image" aria-label="${categoryName} illustration">${icon}</div>
      <div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <a class="amazon-link" href="${destination}" target="_blank" rel="${hasAffiliateLink ? 'sponsored ' : ''}noopener">
          ${label} <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </article>`;
}

const hasActiveAffiliateLinks = categories.some((category) =>
  category.products.some((product) => Boolean(product.affiliateLink)),
);
document.querySelector('#affiliate-disclosure strong').textContent = hasActiveAffiliateLinks
  ? 'As an Amazon Associate, we may earn from qualifying purchases.'
  : 'Affiliate product recommendations are being prepared. Active affiliate links will be clearly disclosed here.';

document.querySelector('#product-categories').innerHTML = categories
  .map(
    (category) => `
      <section class="category">
        <h2>${category.name}</h2>
        <p class="category-intro">${category.intro}</p>
        <div class="products-grid">
          ${category.products.map((product) => productCard(product, category.icon, category.name)).join('')}
        </div>
      </section>`,
  )
  .join('');
