export const REFERRAL_DISCOUNT_PERCENT = 5;

export const DISCOUNT_LABEL = "5% off next family treatment";

// A member can stack multiple stored referral discounts into one treatment,
// capped so a single visit can never exceed this combined percentage.
export const MAX_STACKED_DISCOUNT_PERCENT = 20;

/**
 * Given available discount credits (each with a `percent` and `id`), greedily
 * stack the highest-value ones until the combined cap is reached.
 * Returns the applied percentage and the ids of the credits consumed, so the
 * caller can mark exactly those as redeemed (no credit is wasted past the cap).
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
    total += c.percent;
    creditIds.push(c.id);
  }
  return { percent: Math.min(total, cap), creditIds };
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

// Prize campaign is disabled for launch (kept in schema for later use).
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
