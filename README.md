# Whiskers & Wags

A responsive multi-page website for a pet sitting and home sitting business. It includes:

- Welcoming home page with services and calls to action
- Accessible three-step request flow with multi-date calendar selection and essential-first intake
- Swipeable photo journal with all gallery photos and a client-notes area ready for approved quotes
- Exact Amazon product recommendations with active Associates tracking disclosure
- Server-side booking, private review delivery, and approval-based public reviews through Cloudflare Pages Functions, Cloudflare KV, and Resend
- Private `/admin` dashboard for editing announcement copy, homepage copy, gallery photos, featured notes, pet-of-the-week content, and care tips
- Basic bot-trap protection for request and review submissions

## Run Locally

This site has no third-party runtime dependencies. In this workspace, start it with:

```bash
./start.sh
```

Open [http://localhost:4173](http://localhost:4173).

On a machine with Node.js 18 or newer already installed, `node server.mjs` works as well.

## Connect Request Emails

The forms deliberately do not use `mailto:` or put credentials in browser code. On the live site, requests post to `/api/requests`, where `functions/api/requests.js` validates them and sends email through [Resend](https://resend.com). Client notes post privately to `/api/reviews`, where `functions/api/reviews.js` validates the 1-5 star rating, stores the note as pending in Cloudflare KV, and sends the review email with an approval button when the client gave publishing permission. `server.mjs` provides the same endpoints for local testing.

1. Copy `.env.example` to `.env`.
2. Confirm `BUSINESS_EMAIL=whiskersandwags811@gmail.com` is the inbox that should receive booking requests.
3. Create a Resend account and API key, then set `RESEND_API_KEY`.
4. While testing, Resend's `onboarding@resend.dev` sender can send to the email associated with the Resend account. For customer-facing deployment, verify a domain in Resend and change `EMAIL_FROM` to an address on that domain.
5. Restart `./start.sh` after editing `.env`.

Example local configuration:

```dotenv
BUSINESS_EMAIL=whiskersandwags811@gmail.com
RESEND_API_KEY=re_replace_with_real_key
EMAIL_FROM=Whiskers & Wags <bookings@whiskersandwagsms.com>
PORT=4173
```

Local admin testing:

```dotenv
ADMIN_PASSWORD=choose_a_private_password
ADMIN_SESSION_SECRET=use_a_long_random_string
```

If `ADMIN_PASSWORD` is omitted locally, `server.mjs` accepts `admin` for convenience. Do not use that for production.

For deployment, configure the same values in Cloudflare Pages. Save `RESEND_API_KEY` as an encrypted secret. Do not commit `.env` or expose `RESEND_API_KEY` in frontend files.

Client-note approval also requires a Cloudflare KV namespace bound to the Pages project with this exact binding name:

```text
REVIEWS_KV
```

The approval email button uses `SITE_URL` when it is present. Set `SITE_URL=https://whiskersandwagsms.com` in Cloudflare Pages variables.

## Admin Backend Setup

The private dashboard lives at `/admin`. It lets you sign in and update helpful website content without editing code.

For production, add these Cloudflare Pages variables and bindings:

```text
ADMIN_PASSWORD        Secret value. Use a strong password.
ADMIN_SESSION_SECRET  Secret value. Use a long random string.
SITE_CONTENT_KV       Cloudflare KV namespace binding for editable site content.
```

Recommended Cloudflare setup:

1. Create a new KV namespace named something like `whiskers_site_content`.
2. Bind it to the Pages project with the exact binding name `SITE_CONTENT_KV`.
3. Add `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` as encrypted secrets.
4. Redeploy.
5. Open `/admin`, sign in, make a small announcement edit, save, and verify it appears publicly.

Backend-uploaded photos are stored as image data in KV. Keep each image under about 2 MB. This is intended for convenient gallery updates; a larger media library should move to Cloudflare R2 later.

## Customize Content

- Business contact information and navigation: `shared.js`
- Booking steps, service areas, and reply methods: `request.html`, `request.js`, and `functions/api/requests.js`
- Live destination email and sender configuration: Cloudflare Pages **Settings > Variables and Secrets**
- Local-only email testing configuration: `.env`
- Hero and story photos shown on the home page: `index.html` and `assets/gallery/`
- Gallery photos, approved client notes, and review copy: `gallery.html`; viewer, swipe, and review-form behavior: `gallery.js`
- Product recommendations and Amazon tracking ID: `picks.js`

Publish client photos and quotes only when you have permission to use them.

## Publish on Cloudflare Pages

Cloudflare Pages hosts the website and runs the booking and review email handlers at `/api/requests` and `/api/reviews`, so a continuously running paid server is not required.

1. In Cloudflare, open **Workers & Pages > Create application > Pages > Import an existing Git repository**.
2. Connect the GitHub repository and select `whiskers-and-wags`.
3. Set the production branch to `main`, the build command to `exit 0`, and the build output directory to `/`.
4. Deploy once to receive a temporary `*.pages.dev` address.
5. Open the Pages project **Settings > Variables and Secrets** and add:
   - `BUSINESS_EMAIL`: `whiskersandwags811@gmail.com`
   - `EMAIL_FROM`: `Whiskers & Wags <bookings@whiskersandwagsms.com>`
   - `RESEND_API_KEY`: the Resend sending key, saved as an encrypted secret
   - `SITE_URL`: `https://whiskersandwagsms.com`
6. Create a Cloudflare KV namespace for reviews and bind it to the Pages project as `REVIEWS_KV`.
7. Redeploy after saving the variables, then submit a real test request and a client-note approval test.
8. Under the Pages project **Custom domains**, add `whiskersandwagsms.com` and `www.whiskersandwagsms.com`.

The `_headers` file provides browser security headers on Cloudflare Pages. The email functions keep the Resend API key on Cloudflare, never in the public website code.

## Public Launch Checklist

Do not announce or submit the website to Amazon Associates until these are complete:

- Confirm the public email, both displayed phone numbers, and service areas in `shared.js`.
- Configure booking email delivery and send a successful test request.
- Publish client notes only after receiving permission from the client.
- Purchased domain: `whiskersandwagsms.com` (registered through Cloudflare on May 24, 2026).
- Connect `whiskersandwagsms.com` to the Cloudflare Pages project after its first successful deploy.
- Review your local business requirements, insurance, scheduling policies, and privacy handling for customer addresses and pet-care details.

## Amazon Associates Setup

The Pet Care Picks page includes only products matched to a specific Amazon listing. Its Amazon buttons use the public Associates tracking ID configured in `picks.js` (`whiskersan07f-20`) so direct product referrals can be attributed to this store.

1. Keep the tracking ID in `amazonTrackingId` updated if the Amazon Associates store ID ever changes.
2. Add only products whose exact Amazon listing, ASIN, description details, and Amazon-hosted listing image have been verified.
3. The site appends the tracking ID to each exact product URL. A SiteStripe Special Link can be substituted for any item later.
4. Product photos displayed on the page must come from the matched Amazon listing or Amazon's approved linking/API tools.

The page intentionally does not show prices or claim current availability. Amazon's current policies restrict displaying those details unless Amazon serves them or they are obtained through an approved API.

Official references:

- [Amazon Associates Central](https://affiliate-program.amazon.com/)
- [Associates Program Policies](https://affiliate-program.amazon.com/help/operating/policies)
- [Associates Program Operating Agreement](https://affiliate-program.amazon.com/help/operating/agreement/)

## Deployment References

- [Cloudflare Pages static HTML deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare Pages variables and secrets](https://developers.cloudflare.com/pages/functions/bindings/)
