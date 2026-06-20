# BloxDrops Migration — Off Emergent

This codebase has been refactored to run on **any** standard infrastructure.
No more lock-in to Emergent's proprietary `emergentintegrations` wrapper.

## What changed

| File | Before | After |
|---|---|---|
| `backend/llm_client.py` | (new) | OpenAI-SDK wrapper pointing at OpenRouter (Claude / GPT / Gemini all from one key) |
| `backend/generation_routes.py` | `LlmChat` via `emergentintegrations` | `complete_text` via OpenRouter |
| `backend/vfx_detector.py` | `LlmChat` + `ImageContent` | `complete_vision` via OpenRouter |
| `backend/payment_routes.py` | `StripeCheckout` wrapper | Native `stripe` SDK (`stripe.checkout.Session.create`) |
| `backend/bloxbucks_routes.py` | `StripeCheckout` wrapper | Native `stripe` SDK |
| `backend/server.py` | `sk_test_emergent` placeholder override | Removed — uses `STRIPE_API_KEY` env var directly |
| `backend/requirements.txt` | `emergentintegrations==0.2.0` + custom litellm wheel | Removed both — standard PyPI only |
| `railway.json` + `Procfile` | (new) | Railway/Heroku-style start commands |

## Deploy

### 1. MongoDB Atlas
- Sign up at https://mongodb.com/cloud/atlas
- Create a free M0 cluster
- Add user + allow access from `0.0.0.0/0`
- Copy the connection string

### 2. Railway (Backend)
- Sign up at https://railway.com using GitHub
- New Project → Deploy from GitHub repo → pick `BloxDrops`
- Railway will auto-detect `railway.json` and run the start command
- Add env vars from `backend/.env.example` (`MONGO_URL`, `STRIPE_API_KEY`, `FAL_KEY`, `OPENROUTER_API_KEY`, etc.)
- Once deployed, copy the public URL (`https://xxx.up.railway.app`)

### 3. Vercel (Frontend)
- Sign up at https://vercel.com
- New → Import `BloxDrops` repo
- **Root Directory: `frontend`** (critical)
- Framework Preset: Create React App
- Environment Variable: `REACT_APP_BACKEND_URL=https://xxx.up.railway.app`
- Deploy

### 4. Stripe Webhook
- Go to https://dashboard.stripe.com/webhooks
- "Add endpoint" → URL: `https://xxx.up.railway.app/api/webhook/stripe`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- Copy the signing secret (`whsec_...`) → add as `STRIPE_WEBHOOK_SECRET` on Railway

### 5. DNS
- Point `bloxdrops.com` (apex) and `www` to Vercel
- Optionally point an `api.bloxdrops.com` subdomain at Railway

## Costs
- Vercel Hobby: **$0**
- Railway: ~**$5/mo** (covered by free credit if usage is low)
- MongoDB Atlas M0: **$0**
- Cloudflare R2 (optional, for GLB storage): **$0** for first 10GB
- Total: **$0–5/mo** vs. Emergent's $125/mo. 🎉
