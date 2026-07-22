export const REFERRAL_DISCOUNT_PERCENT = 5;

export const DISCOUNT_LABEL = "5% off next family treatment";

export const PRACTICE_NAME = "Storm Dental Studio";

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
