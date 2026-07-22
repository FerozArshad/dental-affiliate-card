import Link from "next/link";
import { Trophy } from "lucide-react";
import { getDashboardStats } from "@/lib/actions";
import { Card } from "@/components/ui/card";

export default async function LeaderboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <Trophy className="mx-auto h-8 w-8 text-amber-400" />
        <h1 className="mt-3 text-3xl font-bold text-white">Referral leaderboard</h1>
        <p className="mt-2 text-stone-400">
          {stats.practice.prizeCampaignActive
            ? `This month's prize: ${stats.practice.prizeLabel}`
            : "Prize campaign is currently off"}
        </p>
      </div>

      <Card className="mt-8">
        <div className="space-y-3">
          {stats.leaderboard.length === 0 && (
            <p className="text-sm text-stone-500">No members yet</p>
          )}
          {stats.leaderboard.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                i === 0
                  ? "border-amber-400/40 bg-amber-400/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 text-lg font-bold text-amber-300">
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
                    {m.tier.name} · {m.tier.cashbackPercent}% rewards
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">{m.completed}</p>
                <p className="text-xs text-stone-500">completed</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
