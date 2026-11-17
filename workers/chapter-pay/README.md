# Chapter payments: Cloudflare Worker

The book-chapter shop's payment backend. It is modelled on the TAIIS 2026 conference payment engine: the same NewebPay AES/SHA scheme, PayPal checked on the server, a KV order ledger and a standalone `/admin` dashboard. It runs apart from the portal, so gateway keys never sit on the VPS, and payment callbacks still arrive while the portal is being deployed.

## How a purchase flows

1. **Checkout.** The reader presses *Place order* on `/checkout`. The portal's `POST /api/checkout` then calls the Worker's `POST /order`, server to server, with `Bearer PORTAL_SECRET`.
2. **The Worker creates the order.**
   - The portal prices each chapter from `src/lib/cart/pricing.ts` (the browser never sends a price). The Worker checks every price is within US$1–500, totals the order, and stores `order:<NC…>` in KV.
   - It returns `/pay/<order>?t=<signed token>`.
3. **Payment.** The reader pays on the Worker's page.
   - **PayPal (USD).** The capture is re-read from PayPal's API. It must be `COMPLETED`, carry our order number as `invoice_id`, and match the amount exactly.
   - **NewebPay (NT$ at the live rate).** Each hand-off uses a fresh `MerchantOrderNo`, which avoids the MPG03008 error. `/notify` and `/return` are both signature-checked. The amount must match.
4. **Back to the portal.** The Worker redirects to `/checkout/complete?o=&t=`.
   - The portal reads `GET /status` on the server.
   - On success, it removes the paid chapters from the cart.
5. **Confirmation email.** The Worker sends it once, guarded by a `mailsent:` marker. The 15-minute cron retries failed sends.

## Dashboards

- **Inside the portal:** *Admin → Chapter orders* (`/admin/orders`). It reads `GET /admin/orders.json` with `Bearer ADMIN_API_TOKEN`.
- **Standalone:** `https://<worker>/admin`, which needs `ADMIN_USER` / `ADMIN_PASSWORD`, plus `/admin.csv` for accounting. Use it when the portal is down.

## Setup

```bash
cd workers/chapter-pay
npx wrangler kv namespace create ORDERS     # put the id in wrangler.toml
npx wrangler secret put PORTAL_SECRET       # long random string
npx wrangler secret put ADMIN_API_TOKEN     # long random string
npx wrangler secret put RECEIPT_SECRET      # set once, never change (old links stop working)
npx wrangler secret put ADMIN_USER
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put PAYPAL_CLIENT_ID
npx wrangler secret put PAYPAL_CLIENT_SECRET   # add PAYPAL_SANDBOX=1 while testing
# optional
npx wrangler secret put NEWEBPAY_MERCHANT_ID
npx wrangler secret put NEWEBPAY_HASH_KEY
npx wrangler secret put NEWEBPAY_HASH_IV
npx wrangler secret put HOSTINGER_MAIL_TOKEN
npx wrangler deploy
curl https://<worker>/ping
```

Then set these on the portal server (`/etc/ngiq-portal.env` or equivalent), and restart:

```
PAY_API_URL=https://ngiq-chapter-pay.<account>.workers.dev
PAY_PORTAL_SECRET=<same as PORTAL_SECRET>
PAY_ADMIN_TOKEN=<same as ADMIN_API_TOKEN>
```

While `PAY_API_URL` is unset, checkout keeps going to the "coming soon" page, as before.

Register the NewebPay URLs with NewebPay: NotifyURL `https://<worker>/notify` and ReturnURL `https://<worker>/return`.

## Not done yet

- **Chapter delivery.** Bind the `ngiq-publications` R2 bucket to the Worker. Then add `GET /download/<order>/<chapter>?t=` to stream the PDF of a paid chapter, and put those links in the confirmation email. This needs each chapter mapped to its PDF key, from `book_chapters.pdf_upload_id`.
- **Catalogue check.** The Worker currently accepts any well-formed chapter id. Add a portal endpoint listing purchasable chapters, and have `/order` check against it.
- **Taiwan uniform invoice (統一發票)** for NT$ sales, if NextGenIQ Press needs one. The ezPay and paper-book code from the TAIIS engine can be ported over.
