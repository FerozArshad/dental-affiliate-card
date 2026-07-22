# Dental Affiliate Card

WhatsApp loyalty + referral demo for Storm Marketing Studio.

**Repository:** [github.com/FerozArshad/dental-affiliate-card](https://github.com/FerozArshad/dental-affiliate-card)

**Key model:** No cash cashback. Referrers earn **5% off next family treatment**, stored on their Gold Card and redeemed at the front desk.

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
