# Whiskers & Wags

A responsive multi-page website for a pet sitting and home sitting business. It includes:

- Welcoming home page with services and calls to action
- Accessible three-step request flow with multi-date calendar selection and essential-first intake
- Photo gallery with testimonials ready for approved client quotes
- Exact Amazon product recommendations with active Associates tracking disclosure
- Server-side form delivery through a Cloudflare Pages Function and Resend
- Basic bot-trap protection for request submissions

## Run Locally

This site has no third-party runtime dependencies. In this workspace, start it with:

```bash
./start.sh
```

Open [http://localhost:4173](http://localhost:4173).

On a machine with Node.js 18 or newer already installed, `node server.mjs` works as well.

## Connect Request Emails

The form deliberately does not use `mailto:` or put credentials in browser code. On the live site, requests post to `/api/requests`, where `functions/api/requests.js` validates them and sends email through [Resend](https://resend.com). `server.mjs` provides the same endpoint for local testing.

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

For deployment, configure the same values in Cloudflare Pages. Save `RESEND_API_KEY` as an encrypted secret. Do not commit `.env` or expose `RESEND_API_KEY` in frontend files.

## Customize Content

- Business contact information and navigation: `shared.js`
- Booking steps, service areas, and reply methods: `request.html`, `request.js`, and `functions/api/requests.js`
- Live destination email and sender configuration: Cloudflare Pages **Settings > Variables and Secrets**
- Local-only email testing configuration: `.env`
- Hero and story photos shown on the home page: `index.html` and `assets/gallery/`
- Gallery photos and approved testimonials: `gallery.html`
- Product recommendations and Amazon tracking ID: `picks.js`

Publish client photos and quotes only when you have permission to use them.

## Publish on Cloudflare Pages

Cloudflare Pages hosts the website and runs the booking email handler at `/api/requests` through `functions/api/requests.js`, so a continuously running paid server is not required.

1. In Cloudflare, open **Workers & Pages > Create application > Pages > Import an existing Git repository**.
2. Connect the GitHub repository and select `whiskers-and-wags`.
3. Set the production branch to `main`, the build command to `exit 0`, and the build output directory to `/`.
4. Deploy once to receive a temporary `*.pages.dev` address.
5. Open the Pages project **Settings > Variables and Secrets** and add:
   - `BUSINESS_EMAIL`: `whiskersandwags811@gmail.com`
   - `EMAIL_FROM`: `Whiskers & Wags <bookings@whiskersandwagsms.com>`
   - `RESEND_API_KEY`: the Resend sending key, saved as an encrypted secret
6. Redeploy after saving the variables, then submit a real test request.
7. Under the Pages project **Custom domains**, add `whiskersandwagsms.com` and `www.whiskersandwagsms.com`.

The `_headers` file provides browser security headers on Cloudflare Pages. The booking function keeps the Resend API key on Cloudflare, never in the public website code.

## Public Launch Checklist

Do not announce or submit the website to Amazon Associates until these are complete:

- Confirm the public email, both displayed phone numbers, and service areas in `shared.js`.
- Configure booking email delivery and send a successful test request.
- Keep the gallery and testimonials as coming-soon placeholders until you have client permission.
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
