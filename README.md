# Whiskers & Wags

A responsive multi-page website for a pet sitting and home sitting business. It includes:

- Welcoming home page with services and calls to action
- Accessible request form with multi-date calendar selection
- Gallery and testimonial placeholders ready for client content
- Affiliate product recommendations with Amazon disclosure
- Server-side form delivery through Resend
- Basic bot-trap and rate-limit protection for request submissions

## Run Locally

This site has no third-party runtime dependencies. In this workspace, start it with:

```bash
./start.sh
```

Open [http://localhost:4173](http://localhost:4173).

On a machine with Node.js 18 or newer already installed, `node server.mjs` works as well.

## Connect Request Emails

The form deliberately does not use `mailto:` or put credentials in browser code. Requests post to `/api/requests`, where `server.mjs` validates them and sends email through [Resend](https://resend.com).

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

For deployment, host this as a Node service and configure those same environment variables in the hosting dashboard. Do not commit `.env` or expose `RESEND_API_KEY` in frontend files.

## Customize Content

- Business contact information and navigation: `shared.js`
- Destination email and sender configuration: `.env`
- Hero image shown on the site: `assets/hero-pets.jpg` (the original generated PNG is retained for future edits)
- Gallery photo placeholders and testimonials: `gallery.html`
- Product recommendations and Amazon affiliate URLs: `picks.js`

Replace gallery placeholders only with client photos and quotes you have permission to publish.

## Publish on Render

This project includes `render.yaml` for a paid Render web service, which is appropriate for an official business launch because it keeps the booking form backend running.

Before creating the live service:

1. Put the project in a GitHub repository.
2. In Render, choose **New > Blueprint** and connect the repository.
3. Render reads `render.yaml` and creates the `whiskers-and-wags` Node web service.
4. Add these secret environment variables when prompted:
   - `BUSINESS_EMAIL`: the inbox that should receive customer requests.
   - `RESEND_API_KEY`: your Resend sending key.
   - `EMAIL_FROM`: the verified-domain sender, for example `Whiskers & Wags <bookings@whiskersandwagsms.com>`.
5. Verify the Render-provided public URL before connecting a custom domain.
6. Add your purchased domain in the Render dashboard and follow Render's DNS instructions in Cloudflare.

The server provides `/health` for Render health checks and applies security headers to published pages.

## Public Launch Checklist

Do not announce or submit the website to Amazon Associates until these are complete:

- Confirm the public email, both displayed phone numbers, and service areas in `shared.js`.
- Configure booking email delivery and send a successful test request.
- Keep the gallery and testimonials as coming-soon placeholders until you have client permission.
- Purchased domain: `whiskersandwagsms.com` (registered through Cloudflare on May 24, 2026).
- Connect `whiskersandwagsms.com` to the Render service after its first successful deploy.
- Review your local business requirements, insurance, scheduling policies, and privacy handling for customer addresses and pet-care details.

## Amazon Associates Setup

The Pet Care Picks page contains real curated product candidates, but its links stay as ordinary Amazon searches until your own official affiliate links are added.

1. Publish the site to a public web address. Amazon's current Participation Requirements say an application site must contain original content and be publicly available; `localhost` does not qualify.
2. Apply at [Amazon Associates Central](https://affiliate-program.amazon.com/) using that public site address. Complete account, identity, tax, and payment information directly with Amazon.
3. After applying, use Amazon's own link-building tools, such as SiteStripe or Product Linking, to generate a Special Link for each recommended product.
4. Paste each Special Link into the matching `affiliateLink` value in `picks.js`. When a value is present, the card changes from `View on Amazon` to `Shop on Amazon`, marks the link as sponsored, and activates the required Associate disclosure near the top of the page.
5. For product photos, use only images supplied through Amazon's approved linking/API tools. The current category icons avoid misrepresenting an actual listing.

The page intentionally does not show prices or claim current availability. Amazon's current policies restrict displaying those details unless Amazon serves them or they are obtained through an approved API.

Official references:

- [Amazon Associates Central](https://affiliate-program.amazon.com/)
- [Associates Program Policies](https://affiliate-program.amazon.com/help/operating/policies)
- [Associates Program Operating Agreement](https://affiliate-program.amazon.com/help/operating/agreement/)
