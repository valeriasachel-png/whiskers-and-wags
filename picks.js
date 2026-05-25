// AMAZON AFFILIATE EDIT: This is the public Associates tracking ID attached to every Amazon button.
// Replace this value only if Whiskers & Wags changes its Amazon tracking ID.
const amazonTrackingId = 'whiskersan07f-20';
// PRODUCT LISTING EDIT: Add only a specific Amazon listing URL/ASIN and details verified on that listing.
// PRODUCT IMAGES: Use Amazon-hosted listing images supplied by Amazon, not generated stand-ins.
const categories = [
  {
    name: 'Pet Food & Treat Storage',
    intro: 'Verified products from exact Amazon listings.',
    products: [
      {
        asin: 'B0002DJOOI',
        name: 'Gamma2 Vittles Vault Pet Food Storage Containers',
        description: 'Sealed dog and cat food storage container that fits up to 50 lbs, in Granite Stone.',
        details: ['Airtight lid', 'BPA Free', 'Made in the USA'],
        image: 'https://m.media-amazon.com/images/I/81IfhdDWS5L._AC_SL1000_.jpg',
        amazonUrl: 'https://www.amazon.com/Vittles-Vault-Outback-Airtight-Container/dp/B0002DJOOI',
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

document.querySelector('#product-categories').innerHTML = categories
  .map(
    (category) => `
      <section class="category">
        <div class="category-heading">
          <div>
            <h2>${category.name}</h2>
            <p class="category-intro">${category.intro}</p>
          </div>
          <span class="result-count">${category.products.length} ${category.products.length === 1 ? 'pick' : 'picks'}</span>
        </div>
        <div class="products-grid">
          ${category.products.map((product) => productCard(product, category.name)).join('')}
        </div>
      </section>`,
  )
  .join('');
