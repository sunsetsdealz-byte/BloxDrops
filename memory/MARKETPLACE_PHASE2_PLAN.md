# BloxDrops · Phase 2 Marketplace Plan

## Locked Decisions (2026-02-18)
- **(a) USD creator payouts**: **Stripe Connect Express** — creators do hosted KYC onboarding (~5 min). Platform collects sale + Stripe routes splits (creator 95% / royalty receiver 5% / platform 0% for MVP).
- **(b) Robux side**: **BloxBucks** — internal credit currency. Users top-up via Stripe Checkout in USD. Spend BloxBucks on drops in-platform. Never touches Roblox API.
- **(c) Royalty**: **5% on every user-to-user sale**. The 5% is paid to the ORIGINAL CREATOR (recorded on the drop's `user_id`) regardless of who the current seller is. Applies to first sale, second sale, all resales.

## Database Schema Additions

### `users` (extend existing collection)
```
stripe_account_id: str | null            # Stripe Connect Express account id
stripe_charges_enabled: bool             # KYC complete + can receive funds
stripe_payouts_enabled: bool             # KYC complete + can payout
stripe_onboarded_at: iso datetime | null
bloxbucks_balance: int                   # BloxBucks credit balance (1 BB = 1 R$ display rate)
```

### `marketplace_listings` (new collection)
```
{
  _id, listing_id,
  generation_id, edition_number,         # which edition of which drop
  seller_user_id,                        # current owner listing it
  price_usd: float | null,               # null = not listed in USD
  price_bloxbucks: int | null,           # null = not listed in BB
  status: "open" | "sold" | "cancelled",
  listed_at, sold_at, sold_to_user_id,
  sold_price, sold_currency,             # "usd" | "bloxbucks"
}
```

### `ownerships` (new collection)
```
{
  _id, generation_id, edition_number,
  owner_user_id, acquired_at,
  acquisition_type: "mint" | "purchase" | "transfer",
  source_listing_id: str | null,
}
```
On drop creation: insert ownership row for creator (edition #1).
On sale: delete old row, insert new row for buyer.

### `bloxbucks_transactions` (new collection)
```
{
  _id, user_id, kind: "topup" | "spend" | "earn" | "withdraw",
  amount: int,                           # positive
  balance_after: int,
  related: { stripe_session_id?, listing_id?, generation_id? },
  created_at,
}
```

### `payment_transactions` (extend existing)
Add `purpose: "subscription" | "boost" | "bloxbucks_topup" | "marketplace_purchase"` so flows don't collide.

## API Endpoints (new)

### Stripe Connect onboarding
- `POST /api/connect/onboard` — create or fetch Express account for current user, return `account_link.url` for hosted KYC.
- `GET /api/connect/status` — fetch latest from Stripe, sync `stripe_charges_enabled` / `stripe_payouts_enabled` to DB.
- Webhook `account.updated` handled in `/api/webhook/stripe`.

### BloxBucks
- `GET /api/bloxbucks/me` — current balance + last 20 tx.
- `POST /api/bloxbucks/topup` — body { package_id, origin_url }; returns Stripe Checkout url. Packages: 1000 BB = $9.99, 5000 BB = $44.99, 10000 BB = $79.99. Credit on `checkout.session.completed` webhook.

### Marketplace
- `POST /api/marketplace/list` — body { generation_id, edition_number, price_usd?, price_bloxbucks? }. Caller must be current owner.
- `POST /api/marketplace/unlist/:listing_id` — caller must be seller.
- `GET /api/marketplace?sort=floor&tier=&genesis=` — list open listings.
- `POST /api/marketplace/buy/:listing_id` — body { currency: "bloxbucks" }; deducts buyer balance, credits seller's BB balance (minus 5% to creator), transfers ownership. Returns ownership receipt.
- `POST /api/marketplace/checkout/:listing_id` — body { origin_url }; Stripe Checkout for USD purchases. On webhook success: transfer ownership, credit seller's Stripe Connect account 95%, royalty creator's Stripe Connect account 5%. If seller is also creator → seller gets 100%.

### Withdrawals (BloxBucks → USD)
- `POST /api/bloxbucks/withdraw` — body { amount_bb }; require linked Stripe Connect. Initiates a Stripe Transfer for `amount_bb / 100` USD (or whatever exchange rate we set). Adds withdraw row.

## Royalty Math
On any user-to-user sale:
- Find drop's `user_id` → original_creator_id
- If seller == original_creator: seller gets 100% (no royalty split — it's the first sale)
- Else: seller gets 95%, original_creator gets 5%

> **Decision update needed**: user said "5% royalty on any sale from users". Interpretation: on every user-to-user sale a 5% royalty goes to the original creator. First-sale (creator → buyer #1) the creator gets 100% (no royalty since they ARE the creator). Subsequent sales (buyer #1 → buyer #2) the original creator earns 5%.

## Implementation Phases

### Phase 2.1 — Foundation (no real payouts yet)
- Add user fields (stripe_account_id stub, bloxbucks_balance)
- Create ownerships + listings + bloxbucks_transactions collections
- Implement list/unlist/buy with BloxBucks only (no USD yet)
- Marketplace page UI
- Admin can grant BloxBucks for testing

### Phase 2.2 — BloxBucks top-up
- Stripe Checkout for BB packages
- Webhook credits balance
- "Buy BloxBucks" CTA in header

### Phase 2.3 — Stripe Connect onboarding
- Express account creation + KYC link
- Status sync + webhook
- "Get paid" CTA in Profile

### Phase 2.4 — USD marketplace
- Stripe Checkout for listings priced in USD
- Webhook routes 95/5 split via Stripe Transfers
- Withdrawals (BB → USD via Connect transfer)

### Phase 2.5 — Polish
- Email notifications (Resend) for sale, royalty earned
- Floor price + 24h volume per drop
- Listing badge on the card

## Library Choice
- Use **emergentintegrations.payments.stripe.checkout** for buyer-side Checkout sessions (BloxBucks top-up + marketplace purchases). Already in use for subscriptions.
- Use **raw stripe-python SDK** for Connect-specific operations (Express account creation, account_links, Transfers, account.updated webhook). emergentintegrations doesn't expose Connect.

## Open Questions
1. Withdrawal exchange rate: BloxBucks → USD ratio? Suggestion: **100 BB = $1 USD** (round number, easy mental math).
2. Stripe Connect platform agreement: Express requires us to sign Stripe's Connected Account Agreement on production. Test mode works without it.
3. Minimum listing prices? Suggestion: $0.99 USD / 100 BB to prevent dust spam.
