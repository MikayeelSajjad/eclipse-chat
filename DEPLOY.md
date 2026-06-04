# Deploy Eclipse (Vercel + Turso)

Netlify only hosts the **frontend**. Eclipse needs a **server + database**.  
Follow these steps once (about 15 minutes). All services have free tiers.

---

## Part 1 — Cloud database (Turso)

1. Open **https://turso.tech** and sign up (free).
2. Click **Create Database** → name it `eclipse-chat` → create.
3. On the database page, copy the **Database URL** (starts with `libsql://`).
4. Click **Create Token** → copy the **token** (long string starting with `eyJ`).

Keep both handy for Part 2.

Tables are created automatically on first signup — you do not need to run SQL manually.

---

## Part 2 — Deploy on Vercel

1. Push this project to **GitHub** (if it is not there yet).
2. Open **https://vercel.com** and sign up with GitHub.
3. Click **Add New → Project** → import your `chatting app` repo.
4. Before deploying, open **Environment Variables** and add:

   | Name | Value |
   |------|--------|
   | `TURSO_DATABASE_URL` | Your Turso Database URL (`libsql://...`) |
   | `TURSO_AUTH_TOKEN` | Your Turso token |

5. Click **Deploy** and wait until it finishes.
6. Open the URL Vercel gives you (e.g. `https://eclipse-xxx.vercel.app`).
7. Go to `/login` → **Signup** → create an account. It should work.

---

## Part 3 — Use your own domain (optional)

### Option A — Move from Netlify to Vercel

1. In Vercel: **Project → Settings → Domains** → add `eclipse-chating.netlify.app` is on Netlify, so add your real domain OR use the free `.vercel.app` URL.
2. To use a custom domain: add it in Vercel and update DNS at your registrar (Vercel shows the records).

### Option B — Keep Netlify URL

Netlify **cannot** run this app’s API. You must use the **Vercel URL** for the working chat app.

---

## Local development

1. Copy `.env.example` to `.env.local`:
   ```
   TURSO_DATABASE_URL=file:data/eclipse.db
   ```
2. Run:
   ```
   npm install
   npm run dev
   ```
3. Open http://localhost:3000 (or the port shown in the terminal).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Request failed** on signup | Deploy on **Vercel**, not Netlify only. Add Turso env vars. Redeploy. |
| **TURSO_DATABASE_URL is not set** | Add both env vars in Vercel → Settings → Environment Variables → **Redeploy**. |
| **Username already taken** | Account exists; use **Login** instead. |
| Works on PC but not phone | Use the **Vercel HTTPS URL**, not `localhost`. |

---

## Part 4 — Lemon Squeezy (Nitro subscriptions)

1. In [Lemon Squeezy](https://app.lemonsqueezy.com), create your store and two **subscription** products:
   - **Nitro Basic** — $1.99/month
   - **Nitro+** — $4.99/month
2. Copy from **Settings → API** and each product’s variant ID.
3. In Vercel → **Environment Variables**, add:

   | Name | Value |
   |------|--------|
   | `LEMONSQUEEZY_API_KEY` | API key from Lemon Squeezy |
   | `LEMONSQUEEZY_STORE_ID` | Your store ID |
   | `LEMONSQUEEZY_VARIANT_BASIC_ID` | Variant ID for Nitro Basic |
   | `LEMONSQUEEZY_VARIANT_PLUS_ID` | Variant ID for Nitro+ |
   | `LEMONSQUEEZY_WEBHOOK_SECRET` | Signing secret from your webhook |

4. **Webhook** (required for Nitro to activate after payment):
   - Store → **Webhooks** → Add endpoint  
   - URL: `https://YOUR-APP.vercel.app/api/lemonsqueezy/webhook`  
   - Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
5. Redeploy after adding env vars.

Use **Test mode** in Lemon Squeezy to try checkout without real charges.

---

## Routes

| URL | Purpose |
|-----|---------|
| `/` | Marketing landing (E2E, groups, Nitro) |
| `/chat` | Main app |
| `/login` | Sign in / sign up |
| `/nitro` | Subscribe to Nitro Basic ($1.99) or Nitro+ ($4.99) |

---

## What changed in the code

- Database moved from local SQLite file to **Turso** (works on Vercel).
- API routes run on Vercel as serverless functions.
- Signup/login write to Turso in the cloud.
- **E2E encryption** (Web Crypto): DMs and group messages encrypted in the browser; server stores ciphertext only.
- **Private groups** (Nitro Basic+): create, name, invite friends.
- **Nitro** friend limits: Free 20 · Basic 40 · Nitro+ 60.
- **Lemon Squeezy Checkout** for Nitro subscriptions.
