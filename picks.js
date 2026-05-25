// AMAZON AFFILIATE EDIT: This is the public Associates tracking ID attached to every Amazon button.
// Replace this value only if Whiskers & Wags changes its Amazon tracking ID.
const amazonTrackingId = 'whiskersan07f-20';
// PRODUCT LINK EDIT: Product buttons currently open tagged searches for the named item.
// You can later replace the generated destinations with exact SiteStripe product URLs.
// PRODUCT IMAGES: Only add official images supplied through Amazon's linking/API tools; do not copy listing photos.
const categories = [
  {
    name: 'Pet Food & Treat Storage',
    art: 'storage',
    intro: 'Sealed, easy-to-clean storage helps keep feeding instructions simple and pantry areas tidy during visits.',
    products: [
      {
        name: 'Gamma2 Vittles Vault Pet Food Storage',
        description: 'An airtight kibble storage option for keeping bulk food organized between visits.',
        query: 'Gamma2 Vittles Vault Pet Food Storage Container',
      },
      {
        name: 'OXO Good Grips Pet POP Container',
        description: 'A compact clear container option for treats or smaller portions of dry food.',
        query: 'OXO Good Grips Pet POP Container',
      },
    ],
  },
  {
    name: 'Leashes, Collars & Harnesses',
    art: 'walking',
    intro: 'Comfortable, well-fitted walking gear can make scheduled outings calmer for pets and sitters alike.',
    products: [
      {
        name: 'RUFFWEAR Front Range Dog Harness',
        description: 'A padded everyday harness option designed for routine walks and adventures.',
        query: 'RUFFWEAR Front Range Dog Harness',
      },
      {
        name: 'Max and Neo Double Handle Traffic Leash',
        description: 'A leash with an additional handle option for close control during busy walks.',
        query: 'Max and Neo Double Handle Traffic Dog Leash',
      },
    ],
  },
  {
    name: 'Pet Beds & Blankets',
    art: 'bed',
    intro: 'Washable comfort items help maintain familiar, cozy resting places while a family is away.',
    products: [
      {
        name: 'Furhaven Orthopedic Dog Bed',
        description: 'A cushioned bed option for dogs who appreciate a supportive nap spot.',
        query: 'Furhaven Orthopedic Dog Bed',
      },
      {
        name: 'PetAmi Waterproof Dog Blanket',
        description: 'A washable blanket option that helps protect favorite furniture and car seats.',
        query: 'PetAmi Waterproof Dog Blanket',
      },
    ],
  },
  {
    name: 'Grooming Supplies',
    art: 'grooming',
    intro: 'Small grooming routines can help pets feel comfortable and help homes stay pleasantly maintained.',
    products: [
      {
        name: 'Hertzko Self-Cleaning Slicker Brush',
        description: 'A brush option for gentle coat maintenance and easier cleanup afterward.',
        query: 'Hertzko Self Cleaning Slicker Brush',
      },
      {
        name: 'Earth Rated Dog Wipes',
        description: 'A handy wipe option for muddy paws after neighborhood walks.',
        query: 'Earth Rated Dog Wipes',
      },
    ],
  },
  {
    name: 'Toys & Enrichment',
    art: 'toy',
    intro: 'Age- and size-appropriate enrichment can help keep pets engaged during quiet time at home.',
    products: [
      {
        name: 'KONG Classic Dog Toy',
        description: 'A durable enrichment toy option that can support a familiar treat routine.',
        query: 'KONG Classic Dog Toy',
      },
      {
        name: 'Catstages Tower of Tracks Cat Toy',
        description: 'An interactive track toy option for cats who enjoy batting and independent play.',
        query: 'Catstages Tower of Tracks Cat Toy',
      },
    ],
  },
  {
    name: 'Cleaning & Odor Control',
    art: 'cleaning',
    intro: 'Pet-friendly cleaning basics are useful to have ready for quick, calm household cleanups.',
    products: [
      {
        name: 'Rocco & Roxie Stain & Odor Eliminator',
        description: 'An enzyme cleaner option intended for common pet mess cleanup needs.',
        query: 'Rocco Roxie Stain Odor Eliminator',
      },
      {
        name: 'ChomChom Roller Pet Hair Remover',
        description: 'A reusable hair-removal option for sofas, blankets, and fabric seating.',
        query: 'ChomChom Roller Pet Hair Remover',
      },
    ],
  },
  {
    name: 'Home Safety Items',
    art: 'safety',
    intro: 'Simple boundary and monitoring tools may support the home routine chosen by each pet family.',
    products: [
      {
        name: 'Carlson Extra Wide Walk-Through Pet Gate',
        description: 'A gate option for maintaining approved pet areas inside the home.',
        query: 'Carlson Extra Wide Walk Through Pet Gate',
      },
      {
        name: 'Blink Mini Indoor Security Camera',
        description: 'An indoor camera option for owners who want remote home check-ins.',
        query: 'Blink Mini Indoor Security Camera',
      },
    ],
  },
  {
    name: 'Travel Pet Supplies',
    art: 'travel',
    intro: 'Packable food and water accessories make trips and sitter handoffs easier to organize.',
    products: [
      {
        name: 'COMSUN Collapsible Dog Bowls',
        description: 'Packable bowl options for water breaks and meals on the go.',
        query: 'COMSUN Collapsible Dog Bowls',
      },
      {
        name: 'Kurgo Kibble Carrier',
        description: 'A travel food-storage option for keeping measured meals close at hand.',
        query: 'Kurgo Kibble Carrier',
      },
    ],
  },
];

function amazonAffiliateLink(query) {
  const params = new URLSearchParams({ k: query, tag: amazonTrackingId });
  return `https://www.amazon.com/s?${params.toString()}`;
}

function productCard(product, art, categoryName) {
  const destination = amazonAffiliateLink(product.query);
  return `
    <article class="product-card">
      <div class="product-image product-image-${art}" role="img" aria-label="Illustrated ${categoryName.toLowerCase()} product preview">
        <span class="product-shape"></span>
      </div>
      <div class="product-body">
        <p class="product-category">${categoryName}</p>
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-pick" aria-label="Whiskers and Wags recommendation">
          <span aria-hidden="true">&#9733;</span> Whiskers &amp; Wags pick
        </div>
        <p class="product-detail">See Amazon for current options and availability.</p>
        <a class="amazon-link" href="${destination}" target="_blank" rel="sponsored noopener">
          Shop on Amazon <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </article>`;
}

document.querySelector('#product-categories').innerHTML = categories
  .map(
    (category) => `
      <section class="category">
        <div class="category-heading">
          <div>
            <h2>${category.name}</h2>
            <p class="category-intro">${category.intro}</p>
          </div>
          <span class="result-count">${category.products.length} picks</span>
        </div>
        <div class="products-grid">
          ${category.products.map((product) => productCard(product, category.art, category.name)).join('')}
        </div>
      </section>`,
  )
  .join('');
