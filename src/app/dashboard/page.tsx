import { getDashboardStats } from "@/lib/actions";
import { VisitForm } from "@/components/visit-form";
import { CampaignToggles, NudgeButton } from "@/components/campaign-toggles";
import { Card, StatCard } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getTier } from "@/lib/constants";
import Link from "next/link";
import { MessageCircle, QrCode, Trophy, UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const memberOptions = stats.members.map((m) => {
    const familyIds = m.familyGroup
      ? stats.members
          .filter((x) => x.familyGroupId === m.familyGroupId)
          .map((x) => x.id)
      : [m.id];

    const availableFamilyDiscounts = stats.members
      .filter((x) => familyIds.includes(x.id))
      .reduce((sum, x) => sum + x.discountCredits.length, 0);

    return {
      id: m.id,
      name: m.name,
      memberCode: m.memberCode,
      hasPendingReferral: m.referredBy?.status === "pending",
      availableFamilyDiscounts,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Practice dashboard</h1>
          <p className="mt-1 text-stone-400">
            Members, growth tools, ROI, visits & WhatsApp
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/desk"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
          >
            <QrCode className="h-4 w-4" /> Desk QR
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
          >
            <Trophy className="h-4 w-4" /> Leaderboard
          </Link>
          <Link
            href="/enroll"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-300"
          >
            <UserPlus className="h-4 w-4" /> Enroll
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total members" value={stats.memberCount} />
        <StatCard
          label="Referral revenue (month)"
          value={formatCurrency(stats.referralRevenue)}
          hint="Treatment value from referred visits"
        />
        <StatCard
          label="ROI vs fee"
          value={`${stats.roiMultiple}×`}
          hint={`${formatCurrency(stats.practice.monthlyFee)}/mo fee`}
        />
        <StatCard
          label="Reviews sent (month)"
          value={stats.reviewsThisMonth}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Discounts earned"
          value={stats.earnedThisMonth}
          hint="Stored for next family treatment"
        />
        <StatCard label="Discounts redeemed" value={stats.redeemedThisMonth} />
        <StatCard label="Referral conversion" value={`${stats.conversionRate}%`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-white">Record visit</h2>
          <p className="mt-1 text-sm text-stone-500">
            Apply discounts + optional Google review request
          </p>
          <div className="mt-6">
            <VisitForm members={memberOptions} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-white">Growth campaigns</h2>
            <p className="mt-1 text-sm text-stone-500">
              Toggle prize + double-reward weeks
            </p>
            <div className="mt-4">
              <CampaignToggles
                prizeActive={stats.practice.prizeCampaignActive}
                doubleActive={stats.practice.doubleRewardActive}
                prizeLabel={stats.practice.prizeLabel}
              />
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Trophy className="h-5 w-5 text-amber-400" />
              Leaderboard
            </h2>
            <div className="mt-4 space-y-2">
              {stats.leaderboard.slice(0, 5).map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-sm font-bold text-amber-300">
                      #{i + 1}
                    </span>
                    <div>
                      <Link
                        href={`/member/${m.memberCode}`}
                        className="font-medium text-white hover:text-amber-300"
                      >
                        {m.name}
                      </Link>
                      <p className="text-xs text-stone-500">
                        {m.tier.name} · {m.completed} referrals
                      </p>
                    </div>
                  </div>
                  <NudgeButton memberId={m.id} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <MessageCircle className="h-5 w-5 text-emerald-400" />
            Simulated WhatsApp
          </h2>
          <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
            {stats.messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
              >
                <p className="text-xs text-emerald-300">
                  To: {msg.member?.name ?? msg.phone} ·{" "}
                  {formatDate(msg.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-300">
                  {msg.body}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">All members</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-stone-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Tier</th>
                  <th className="pb-2 pr-4">Stored</th>
                  <th className="pb-2">Refs</th>
                </tr>
              </thead>
              <tbody>
                {stats.members.map((m) => {
                  const tier = getTier(m.referralsMade.length);
                  return (
                    <tr key={m.id} className="border-b border-white/5">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/member/${m.memberCode}`}
                          className="text-amber-300 hover:underline"
                        >
                          {m.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-stone-300">{tier.name}</td>
                      <td className="py-3 pr-4">
                        {m.discountCredits.length > 0 ? (
                          <span className="text-amber-300">
                            {m.discountCredits.length}×
                          </span>
                        ) : (
                          <span className="text-stone-600">—</span>
                        )}
                      </td>
                      <td className="py-3">{m.referralsMade.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
