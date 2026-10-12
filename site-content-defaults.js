// Original site content seeds the editor once. Version 2 saves are authoritative,
// including empty lists, so removed items never reappear during a later read.
const originalPhotos = [
  ['cozy-pair', 'Cozy Companions', 'Settled in together for a comfortable afternoon at home.'],
  ['indoor-duo', 'Calm Companions', 'A sweet cat-and-dog pair settled in for a cozy home visit.'],
  ['spectacled-hound', 'Smart Hound', 'Serious charm, soft ears, and a very polished lounge moment.'],
  ['blue-eyed-aussie', 'Bright Eyes', 'A gentle face ready for play, attention, and routine.'],
  ['table-tabby', 'Tabletop Supervisor', 'Keeping a watchful eye on all household activity.'],
  ['porch-panthers', 'Porch Pair', 'Two sleek companions sharing a quiet outdoor perch.'],
  ['lakeside-lab', 'Lakeside Pause', 'A peaceful outdoor pause with room to stretch out.'],
  ['ragdoll-cat', 'Favorite Chair', 'A soft landing spot for a calm, restful day.'],
  ['snuggle-pup', 'Snuggle Time', 'Cozy, content, and right where this pup wants to be.'],
  ['sunny-yard-duo', 'Sunny Yard Visit', 'Fresh grass, watchful eyes, and an easy outdoor check-in.'],
  ['sunny-calico', 'Sunny Seat', 'A curious cat enjoying a bright window-side perch.'],
  ['aussie-resting', 'Quiet Rest', 'A relaxed break between walks and playtime.'],
  ['tuxedo-cat', 'Laid-Back Lounger', 'Comfortable at home and taking it easy.'],
  ['pillow-pair', 'Pillow Pals', 'Two companions sharing their favorite cozy corner.'],
  ['armchair-pup', 'Chair of Honor', 'Ready for attention from the best seat in the house.'],
  ['garden-lab', 'Sunshine Break', 'A happy outdoor moment during a calm day at home.'],
  ['orange-tabby', 'Stretch and Settle', 'A favorite couch and plenty of time to unwind.'],
  ['tabby-chair', 'Cozy Lookout', 'Keeping company from a perfectly chosen perch.'],
  ['gentle-basset', 'Soft Eyes', 'A gentle check-in moment with plenty of personality.'],
];

const originalTips = [
  ['Dogs', 'Pack a familiar blanket or toy before travel days to lower stress during routine changes.'],
  ['Cats', 'Keep feeding spots, litter areas, and hiding places predictable when you are away.'],
  ['Birds', 'Leave clear cage, lighting, food, and quiet-time notes for anyone helping with care.'],
  ['Reptiles', 'Temperature and humidity notes matter. Write exact ranges, timers, and feeding preferences.'],
  ['Small pets', 'Rabbits, guinea pigs, hamsters, and ferrets need careful enclosure checks and fresh water.'],
  ['Fish', 'Pre-portion food if possible. Overfeeding is one of the easiest mistakes for helpers to make.'],
  ['Senior pets', 'Note mobility needs, favorite resting spots, and any changes that should be watched closely.'],
  ['Unique pets', 'The more unusual the pet, the more useful a simple daily checklist becomes.'],
];

export function hydrateExistingContent(content) {
  if (content.contentVersion === 2) return content;
  return {
    ...content,
    contentVersion: 2,
    home: {
      tagline: content.home?.tagline || "Love and care when you're not there!",
      intro: content.home?.intro || 'Whether it is a weekend getaway or a longer trip, we keep furry friends comfortable, routines steady, and your home thoughtfully checked in on.',
    },
    gallery: {
      ...content.gallery,
      photos: [...originalPhotos.map(([id, title, caption]) => ({ id: `original-${id}`, title, caption, image: `/assets/gallery/${id}.jpg` })), ...(content.gallery?.photos || [])],
      testimonials: content.gallery?.testimonials || [],
      hiddenReviewIds: content.gallery?.hiddenReviewIds || [],
    },
    social: {
      ...content.social,
      petOfWeekTitle: content.social?.petOfWeekTitle || 'Nominate a local sweetheart.',
      petOfWeekDescription: content.social?.petOfWeekDescription || 'This spotlight can feature a client pet, rescue pet, or local animal friend with permission. Add the pet name, a small story, and one approved photo when you are ready.',
      petOfWeekImage: content.social?.petOfWeekImage || '/assets/gallery/cozy-pair.jpg',
      tips: [...originalTips.map(([petType, tip]) => ({ petType, tip })), ...(content.social?.tips || [])],
    },
  };
}

// Include only the already-public fields from approved reviews, never private email.
export function includeApprovedReviews(content, reviews = []) {
  const hidden = new Set(content.gallery.hiddenReviewIds || []);
  const existing = new Set(content.gallery.testimonials.map((note) => note.sourceReviewId).filter(Boolean));
  return {
    ...content,
    gallery: {
      ...content.gallery,
      testimonials: [...content.gallery.testimonials, ...reviews
        .filter((review) => !hidden.has(review.id) && !existing.has(review.id))
        .map((review) => ({ id: `approved-${review.id}`, sourceReviewId: review.id, displayName: review.displayName, review: review.review, rating: review.rating }))],
    },
  };
}
