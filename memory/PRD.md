# BloxDrops AI — Product Requirements

## Original problem statement
"i want to build an ai generator. what about a site like tiktok where people can battle? i want a better platform that does the same as ugcraft and more"

## What it is
BloxDrops AI is an AI Roblox UGC creator — turns text prompts and reference images into 3D Roblox-ready accessories & clothing, exported as GLB, with a TikTok-style feed, community battles, NFT-like scarcity (Rarity, Editions, Genesis drops), and a USD-cashable marketplace powered by Stripe Connect.

## User personas
- **Roblox creators (13-25)** — want to ship marketplace items fast, no 3D experience
- **Roblox players** — vote, remix, discover trending creations
- **Power creators** — daily challenges, leaderboards, paid subscriptions, real USD payouts

## Core requirements
- Text-to-3D and Image-to-3D generation (fal.ai Tripo)
- TikTok-style vertical feed + 1v1 Battles + daily challenges
- Stripe subscriptions & one-time BloxBucks top-ups
- Direct export to Roblox Open Cloud Assets API
- NFT-like scarcity: Rarity tiers, Editions, Genesis Collection (first 100 drops), Founder signed drops
- Internal Marketplace with BloxBucks currency + automated 5% creator royalty + 5% platform fee
- Stripe Connect Express for creator USD cash-outs

## Tech stack
- Backend: FastAPI + MongoDB (motor) + bcrypt + PyJWT + fal-client + stripe (raw SDK for Connect) + emergentintegrations (Claude Sonnet)
- Frontend: React 19 + react-router 7 + react-three-fiber + drei + framer-motion + sonner + @phosphor-icons/react
- Theme: Dark obsidian (#09090B) + Electric Volt (#CCFF00) + Hot Magenta (#FF0055) + Cyan (#00F0FF). Unbounded display + Outfit body.

## What's been implemented
**2026-02-18 — MVP**
- JWT auth + admin seeding
- Text/Image-to-3D via fal.ai + Claude Sonnet prompt enhancer
- Feed, Battle Arena, Challenges, Pricing, Profile pages
- Stripe checkout for Creator/Pro plans

**2026-06 — Rebrand + NFT mechanics + Marketplace**
- Global rebrand BloxCraft → **BloxDrops** with animated CSS logo
- NFT layer: Rarity tiers, Editions, Founder signatures, Genesis Collection (first 100 drops with live counter)
- CreationCard redesign with ImageZoomModal (click-to-zoom replacing hover-3D)
- Landing page: MonetizationSection + NFT explainer
- **Marketplace** (Phase 2.1): BloxBucks currency, list-for-sale, buy/unlist, with auto-split 5% royalty (original creator) + 5% platform fee
- **BloxBucks Top-Up** (Phase 2.2): Stripe Checkout + Admin Earnings widget
- **BloxBucksExplainer**: visual Framer Motion explanation of the BB economy
- **Stripe Connect Express** (Phase 2.3): backend `/api/connect/onboard|status|login-link|configured` + `ConnectPayoutsCard.jsx` UI on Profile page. **LIVE as of 2026-06-18** with user's BloxDrops Sandbox.

- **BloxBucks pricing** (2026-06-18 evening): Starter $19.99 / 1,000 BB · Pro $49.99 / 5,000 BB (+100% value) · Whale Pack $199.99 / 25,000 BB (+150% value).
- **Header + button** correctly opens TopUpModal (was previously broken — modal state existed but `<TopUpModal>` was never rendered in Header.jsx). Removed `Test mode · use card 4242 4242 4242 4242` hint since we're in live mode.
- **Admin user management** (2026-06-18): `/api/admin/users/{id}/ban|unban|reset-password|DELETE`. Banned users get 403 on login. Passwords are bcrypt-hashed (one-way) — admins can RESET to a known value but not READ originals. Seed admin protected.
- **Banned filter chips** + **Audit log**: User table has filter chips (All / Active / Banned / Admins) with counts. New `admin_audit_log` collection captures every admin action (ban/unban/delete/reset_password/promote/demote) with actor+target email+timestamp. UI section "LAST N ACTIONS" with color-coded badges below the user table.

## Key technical notes
- `load_dotenv(override=True)` in server.py ensures backend/.env takes precedence over shell-level env vars.
- **🔴 LIVE MODE (2026-06-18):** `STRIPE_API_KEY` is `sk_live_...` — Connect onboarding creates real connected accounts; payments charge real cards; payouts wire real USD.
- Admin user `admin@bloxdrops.com` is fully Connect-verified (`acct_1TjbA4Rh6bf5vlv1`, charges_enabled=true).
- Platform owner (`is_platform_owner=True`, email `noelcampos11211@yahoo.com`) automatically receives 5% of all marketplace sales.
- Roblox Open Cloud Assets API uses per-user API keys (Profile → Roblox Connection).
- **Admin user actions** (2026-06-18 evening): `POST /api/admin/users/{id}/ban`, `/unban`, `/reset-password`, and `DELETE /api/admin/users/{id}`. Banned users get 403 on login. Passwords are stored as bcrypt hashes — original values cannot be retrieved (industry standard); admins can only RESET passwords to a known value.

## P0 — In Progress
(none — Phase 2.4 USD marketplace is LIVE)

## What's been implemented — appended
**2026-06-18 (later)**
- **Phase 2.4 — USD Marketplace + Stripe Transfers**: USD listings via Stripe Checkout with Connect destination charges (90% to seller / 5% creator royalty as BB / 5% platform fee retained as USD). Endpoints: `POST /api/marketplace/buy_usd/{listing_id}`, `GET /api/marketplace/buy_usd/status/{session_id}`. UI: dual BB+USD listing modal in Marketplace.jsx with auto-detection of seller Connect KYC status.
- **Admin Creator Connect KYC Panel**: `GET /api/admin/creators-connect-status` returns onboarded/pending/never_started buckets. UI section "KYC PIPELINE" on /admin with 3 status columns + count chips.
- **Landing "How BloxBucks Work" deep link**: yellow CTA banner on Landing page → /marketplace#bloxbucks-explainer with smooth-scroll.
- **Battle Arena fix**: Re-enabled `seed_demo_creations()` so Feed/Battle have 12 starter drops + added empty-state UI for Battle (no more stacked error toasts).
- **Founder reserve price**: removed misleading "50,000 R$" — now shows "$50,000 USD" only.

- **Verified Creator badge** (2026-06-18): Marketplace listing cards display a green `✓ Verified` chip when the seller has completed Stripe Connect KYC (`stripe_charges_enabled=true`). `/api/marketplace` browse now returns `seller_verified` per listing.
- **Removed demo seed**: All 12 fake demo creations wiped from DB. Battle Arena's empty-state UI now correctly displays for new users until real drops exist.

**2026-06-19**
- **NFT Metadata Editor**: New owner-only `PATCH /api/generations/{id}/metadata` with display_name, description (lore), and OpenSea-style key/value traits[]. Locked once any marketplace listing exists for the drop (admin bypass). Frontend `NFTMetadataModal.jsx` + provenance panel displays display name, description, and trait grid. **Tested 9/9 backend + Playwright UI = 100%**.
- **Share NFT Card**: Client-side HTML5 Canvas renderer producing a 1080×1080 PNG (brand header, rarity-tinted aura, edition pill, drop thumbnail with vignette, display name, description, traits grid, Mint ID, live URL). Three CTAs: Download PNG, Copy to clipboard, Tweet. Mounted via `studio-share-card` button on every completed drop. **Tested 6/6 acceptance criteria = 100%**.
- **Roblox API key length fix**: Bumped Open Cloud key max from 400 → 2048 chars (real keys are signed JWTs ~600-1000 chars).

## P1 — Backlog
- Regenerate Founder Avatar 3D model via fal.ai (blocked on user fal.ai balance top-up)
- Admin: encourage-email/notif tool for creators in "never_started" bucket
- Refactor: extract `_stripe()` helper to shared `stripe_utils.py` (currently duplicated in connect_routes.py + marketplace_routes.py)
- Refactor: wrap `_settle_purchase` in a Mongo transaction or compensating rollback for atomicity
- Refactor massive Landing.jsx into smaller components

## P2 — Future
- Collections & Sets gallery (group items logically)
- Burn-to-Upgrade + Staking mechanics for NFT drops
- Forgot/reset password
- Real-time notifications (likes, battle wins, sales)
- Creator analytics dashboard
- Social share + OG images
- Referral credits

## File structure
- Backend routes: `/app/backend/{server,connect_routes,marketplace_routes,bloxbucks_routes}.py`
- Frontend pages: `/app/frontend/src/pages/{Landing,Marketplace,Profile,Admin,Studio,Feed,Battle,Pricing}.jsx`
- Key components: `/app/frontend/src/components/{CreationCard,MonetizationSection,BloxBucksExplainer,ImageZoomModal,TopUpModal,ConnectPayoutsCard,DropBadges}.jsx`
