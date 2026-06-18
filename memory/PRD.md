# BloxCraft AI — Product Requirements

## Original problem statement
"i want to build an ai generator" → "a better platform that does the same as https://www.ugcraft.ai/ and more"

## What it is
BloxCraft AI is an AI Roblox UGC creator — turns text prompts and reference images into 3D Roblox-ready accessories & clothing (hats, hair, hoodies, weapons, etc.), exported as GLB. Plus community + battle + challenge features that ugcraft.ai doesn't have.

## User personas
- **Roblox creators (13-25)** — want to ship marketplace items fast, no 3D experience
- **Roblox players** — vote, remix, discover trending creations
- **Power creators** — daily challenges, leaderboards, paid subscriptions

## Core requirements
- Text-to-3D and Image-to-3D generation (fal.ai Tripo, with graceful demo mode when FAL_KEY missing)
- In-browser 3D viewer (react-three-fiber) — rotate, zoom, auto-spin
- AI prompt enhancer (Claude Sonnet via Emergent LLM key) — "cool hat" → 60-word vivid prompt
- JWT email/password auth
- Community gallery — Recent / Popular / Trending sorts, like, remix
- 1v1 Battle Arena — random pairs, vote, leaderboard
- Daily themed challenges (7 seeded themes rotating)
- Subscription tiers — Free (20 credits) / Creator $9 (300/mo) / Pro $18 (700/mo) via Stripe
- Credits-based generation
- Creator profile with creation history

## Tech stack
- Backend: FastAPI + MongoDB (motor) + bcrypt + PyJWT + fal-client + emergentintegrations (Stripe + LlmChat)
- Frontend: React 19 + react-router 7 + react-three-fiber + drei + framer-motion + sonner + @phosphor-icons/react
- Theme: Dark obsidian (#09090B) + Electric Volt (#CCFF00) + Hot Magenta (#FF0055) + Cyan (#00F0FF). Unbounded display + Outfit body.

## What's been implemented (2026-02-18)
- JWT auth with bcrypt + brute-force lockout
- Admin seeding (admin@bloxcraft.ai / BloxCraft2026!)
- 7 seeded daily challenges
- 6 seeded demo creations so gallery & battle aren't empty
- Text-to-3D + Image-to-3D endpoints with fal.ai integration (mock-fallback when FAL_KEY absent)
- Prompt enhancer via Claude Sonnet 4.6 (emergentintegrations)
- Feed (recent/popular/trending), like/unlike, remix
- 1v1 Battle Arena with vote tally → leaderboard
- Stripe checkout for Creator/Pro plans (sk_test_emergent) + webhook handler + idempotent credit grant
- Landing page (hero with live 3D viewer, marquee, features bento, gallery strip, CTA)
- Studio (control-room grid: prompt panel + viewer + history)
- Feed, Battle, Challenges, Pricing, Profile pages
- Glassmorphism header with credits pill, user menu

## P1 backlog
- Real fal.ai key wiring (user will add)
- Stripe subscription mode (currently one-time payments grant credits)
- Texture re-color / variations panel (placeholder UX, needs fal.ai re-roll integration)
- TikTok-style vertical scroll mobile feed
- Avatar try-on (current viewer is product-only)
- Image upload (currently URL only)
- Forgot/reset password
- Social share + OG images

## P2 backlog
- Roblox marketplace direct-upload integration
- Real-time notifications (likes, battle wins)
- Creator analytics dashboard
- Referral credits
