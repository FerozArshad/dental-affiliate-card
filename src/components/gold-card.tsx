import { formatDate } from "@/lib/utils";
import { Gift, Users } from "lucide-react";
import type { TierName } from "@/lib/constants";

type GoldCardProps = {
  name: string;
  memberCode: string;
  memberSince: Date | string;
  practiceName: string;
  availableDiscounts: number;
  familyName?: string | null;
  tier: TierName;
  cashbackPercent: number;
  completedReferrals: number;
  nextTierAt: number | null;
  prizeActive?: boolean;
  prizeLabel?: string;
  doubleReward?: boolean;
};

const tierStyles: Record<TierName, string> = {
  Silver: "from-stone-300 via-stone-400 to-stone-500",
  Gold: "from-amber-300 via-yellow-500 to-amber-700",
  Platinum: "from-sky-200 via-slate-300 to-cyan-500",
};

export function GoldCard({
  name,
  memberCode,
  memberSince,
  practiceName,
  availableDiscounts,
  familyName,
  tier,
  cashbackPercent,
  completedReferrals,
  nextTierAt,
  prizeActive,
  prizeLabel,
  doubleReward,
}: GoldCardProps) {
  const remaining =
    nextTierAt != null ? Math.max(nextTierAt - completedReferrals, 0) : 0;

  return (
    <div
      className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br ${tierStyles[tier]} p-[1px] shadow-2xl shadow-amber-500/20`}
    >
      <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-6 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-yellow-500/10 blur-2xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
                {tier} Member · {cashbackPercent}% rewards
              </p>
              <h2 className="mt-1 text-2xl font-bold">{name}</h2>
              <p className="text-sm text-stone-400">{practiceName}</p>
            </div>
            <div className="rounded-2xl bg-amber-400/15 px-3 py-2 text-center">
              <Gift className="mx-auto h-5 w-5 text-amber-300" />
              <p className="mt-1 text-lg font-bold text-amber-200">
                {availableDiscounts}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-amber-300/70">
                stored
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Tier progress</span>
              <span>
                {completedReferrals} referral
                {completedReferrals !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                style={{
                  width:
                    nextTierAt == null
                      ? "100%"
                      : `${Math.min((completedReferrals / nextTierAt) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-stone-500">
              {nextTierAt == null
                ? "Top tier unlocked"
                : remaining === 0
                  ? "Ready for next tier!"
                  : `${remaining} more completed referral(s) to next tier`}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-stone-500">Member code</p>
              <p className="font-mono text-lg tracking-wider text-amber-200">
                {memberCode}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-stone-500">Member since</p>
                <p className="text-sm font-medium">{formatDate(memberSince)}</p>
              </div>
              {familyName && (
                <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-stone-500">Family</p>
                  <p className="flex items-center gap-1 text-sm font-medium">
                    <Users className="h-3.5 w-3.5 text-amber-300" />
                    {familyName}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
            <p className="text-sm font-medium text-amber-100">
              {availableDiscounts > 0
                ? `${availableDiscounts}× stored family discount ready`
                : `Refer family to earn ${cashbackPercent}% off next treatment`}
            </p>
            <p className="mt-1 text-xs text-amber-200/70">
              Stored on your card — not cash. Usable by any family member.
              {doubleReward ? " Double reward week is ON." : ""}
            </p>
            {prizeActive && prizeLabel && (
              <p className="mt-2 text-xs font-medium text-amber-200">
                Monthly prize: {prizeLabel} — climb the leaderboard
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
