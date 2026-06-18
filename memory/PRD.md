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

## Key technical notes
- `load_dotenv(override=True)` in server.py ensures backend/.env takes precedence over shell-level env vars (critical for `STRIPE_API_KEY` since the container ships with placeholder `sk_test_emergent`).
- Stripe Connect requires a **Sandbox-specific** API key, NOT the parent account's test key. The two have different account IDs and are isolated.
- Platform owner (`is_platform_owner=True`, email `noelcampos11211@yahoo.com`) automatically receives 5% of all marketplace sales.
- Roblox Open Cloud Assets API uses per-user API keys (Profile → Roblox Connection).

## P0 — In Progress
- **Phase 2.4** — USD Marketplace listings & Stripe Transfers (price_usd + Stripe Checkout → automatic Transfer 90% to seller's Connect account + 5% royalty as BB + 5% platform fee retained)

## P1 — Backlog
- Admin Platform Earnings panel showing creator KYC status (who has completed Connect onboarding vs pending)
- "How BloxBucks Work" link/button on Landing page → BloxBucksExplainer
- Regenerate Founder Avatar 3D model via fal.ai (blocked on user fal.ai balance top-up)
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
