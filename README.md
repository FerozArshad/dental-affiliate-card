# Dental Scotland Gold Card

WhatsApp loyalty + referral system for **Dental Scotland** — *It's Time to Smile*.

**Repository:** [github.com/FerozArshad/dental-affiliate-card](https://github.com/FerozArshad/dental-affiliate-card)

**Key model:** No cash cashback. Referrers earn a **stored discount off their family's next treatment** (5% Silver, 7% Gold, 10% Platinum), redeemed at the front desk as credit toward treatment.

## Production stack

- Next.js 16 + React 19 + Tailwind CSS 4
- Prisma + **PostgreSQL** (Vercel Postgres / Neon)
- Deployed on **Vercel**

## Deployment (Vercel)

1. Set environment variables (see `.env.example`):
   - `DATABASE_URL` and `DIRECT_DATABASE_URL` (Vercel Postgres/Neon)
   - `NEXT_PUBLIC_APP_URL` = your live URL (used for QR + referral links)
   - WhatsApp + Stripe keys when ready
2. First-time schema + seed (run locally after `vercel env pull`):
   ```bash
   npm run db:push
   npm run db:seed
   ```
3. Deploy: push to `main` (Vercel auto-build runs `prisma generate && next build`).

> Note: DB-backed pages use `force-dynamic`, so the build does **not** require a
> database connection — this is what fixes the earlier Vercel build failure.

## Legal / UK compliance

- `/privacy` — UK GDPR privacy policy
- `/terms` — programme terms (GDC/ASA-aware wording, "credit toward treatment")
- `/cookies` — cookie policy
- Explicit opt-in + STOP opt-out in the WhatsApp signup bot

## Quick start

```bash
git clone https://github.com/FerozArshad/dental-affiliate-card.git
cd dental-affiliate-card
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Growth features

- **Tiers** — Silver (5%) → Gold (7%) → Platinum (10%) by completed referrals
- **Leaderboard** — `/leaderboard` + monthly prize campaign toggle
- **Double reward week** — admin toggle for 2× stored discounts
- **One-tap WhatsApp share** + **invite family pack** on every card
- **Desk QR** — `/desk` → scans to `/join` walk-in enroll
- **Member QR** — each card shows QR for `/refer/CODE`
- **Review engine** — optional Google review WhatsApp after visit
- **ROI stats** — referral revenue vs monthly fee on dashboard
- **Progress nudges** — admin can send tier progress WhatsApp

## Demo flows

1. **Home** — overview + links to pre-seeded member cards
2. **Dashboard** (`/dashboard`) — practice stats, record visits, simulated WhatsApp
3. **Enroll** (`/enroll`) — front desk enrolls new patient
4. **Member card** (`/member/GOLD-SMITH1`) — patient Gold Card view
5. **Referral** (`/refer/GOLD-JONES1`) — friend/family joins via referral link

## Discount process

| Step | Who | What happens |
|------|-----|----------------|
| 1 | Front desk | Enrolls patient → WhatsApp welcome + card link |
| 2 | Patient | Shares `/refer/{code}` with family/friend |
| 3 | Friend | Joins → pending referral created |
| 4 | Front desk | Records visit → friend gets **5% off today** |
| 5 | System | Referrer earns **5% stored discount** (not cash) |
| 6 | Family | Next visit → front desk applies stored discount |

## Pre-seeded demo data

- **Emma Jones** (`GOLD-JONES1`) — has 1 stored discount (Lucy referred)
- **Lucy Jones** (`GOLD-JONES2`) — completed visit with welcome discount
- **Sarah & Tom Smith** — family group, no referrals yet

## Tech

- Next.js 16, React 19, Tailwind CSS 4
- Prisma + SQLite (zero external setup for demo)
- Server Actions for all mutations
