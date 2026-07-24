export const REFERRAL_DISCOUNT_PERCENT = 5;

/** Level-2 override only — nothing pays beyond this depth. */
export const LEVEL2_OVERRIDE_PERCENT = 2;

/** Days before a earned credit becomes redeemable (return/cancel window). */
export const CREDIT_HOLD_DAYS = 14;

/** Max completed qualifying referrals a member can earn rewards for per calendar month. */
export const MAX_REFERRALS_PER_MONTH = 10;

export const DISCOUNT_LABEL = "5% off next family treatment";

// Stacked stored discounts on one bill cannot exceed this combined %.
export const MAX_STACKED_DISCOUNT_PERCENT = 20;

/**
 * Given available discount credits (each with a `percent` and `id`), greedily
 * stack the highest-value ones until the combined cap is reached without
 * consuming credits that would push past the cap unused.
 */
export function stackDiscounts<T extends { id: string; percent: number }>(
  credits: T[],
  cap: number = MAX_STACKED_DISCOUNT_PERCENT
): { percent: number; creditIds: string[] } {
  const sorted = [...credits].sort((a, b) => b.percent - a.percent);
  let total = 0;
  const creditIds: string[] = [];
  for (const c of sorted) {
    if (total >= cap) break;
    if (total + c.percent > cap) continue; // skip if this credit alone would overshoot
    total += c.percent;
    creditIds.push(c.id);
  }
  return { percent: total, creditIds };
}

export const PRACTICE_NAME = "Dental Scotland";

export const BRAND = {
  name: "Dental Scotland",
  tagline: "It's Time to Smile",
  logo: "/brand/dental-scotland-logo.png",
  website: "https://dentalscotland.com",
  supportEmail: "hello@dentalscotland.com",
  company: "Dental Scotland",
  established: 2005,
};

export const PRIZE_CAMPAIGN_ENABLED = false;

export type TierName = "Silver" | "Gold" | "Platinum";

export const TIERS = {
  Silver: {
    name: "Silver" as const,
    minReferrals: 0,
    cashbackPercent: 5,
    nextAt: 2,
    color: "stone",
  },
  Gold: {
    name: "Gold" as const,
    minReferrals: 2,
    cashbackPercent: 7,
    nextAt: 5,
    color: "amber",
  },
  Platinum: {
    name: "Platinum" as const,
    minReferrals: 5,
    cashbackPercent: 10,
    nextAt: null,
    color: "sky",
  },
} as const;

export function getTier(completedReferrals: number): (typeof TIERS)[TierName] {
  if (completedReferrals >= TIERS.Platinum.minReferrals) return TIERS.Platinum;
  if (completedReferrals >= TIERS.Gold.minReferrals) return TIERS.Gold;
  return TIERS.Silver;
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Business WhatsApp number digits for wa.me deep links (no +). */
export function getWhatsAppBusinessDigits() {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  return raw.replace(/\D/g, "");
}
