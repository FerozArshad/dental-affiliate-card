import { notFound } from "next/navigation";
import Link from "next/link";
import { Share2, MessageCircle, CheckCircle2, Clock } from "lucide-react";
import { GoldCard } from "@/components/gold-card";
import { Card } from "@/components/ui/card";
import { getMemberByCode } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function MemberPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const member = await getMemberByCode(code);

  if (!member) notFound();

  const availableDiscounts = member.discountCredits.filter(
    (d) => d.status === "available"
  ).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-sm text-stone-500">Patient view (WhatsApp card)</p>
          <div className="mt-4">
            <GoldCard
              name={member.name}
              memberCode={member.memberCode}
              memberSince={member.memberSince}
              practiceName={member.practice.name}
              availableDiscounts={availableDiscounts}
              familyName={member.familyGroup?.name}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/refer/${member.memberCode}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20"
            >
              <Share2 className="h-4 w-4" />
              Refer a family member or friend
            </Link>
            <p className="text-center text-xs text-stone-500">
              In production this opens a pre-written WhatsApp share message
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              Stored discounts
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Not cash — applied at front desk on next family treatment
            </p>
            <div className="mt-4 space-y-2">
              {member.discountCredits.length === 0 && (
                <p className="text-sm text-stone-500">No discounts yet. Refer someone!</p>
              )}
              {member.discountCredits.map((credit) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{credit.label}</p>
                    <p className="text-xs text-stone-500">
                      Earned {formatDate(credit.earnedAt)}
                    </p>
                  </div>
                  {credit.status === "available" ? (
                    <span className="flex items-center gap-1 text-xs text-amber-300">
                      <Clock className="h-3.5 w-3.5" /> Ready
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Used
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-white">Referrals made</h2>
            <div className="mt-4 space-y-2">
              {member.referralsMade.length === 0 && (
                <p className="text-sm text-stone-500">No referrals yet</p>
              )}
              {member.referralsMade.map((ref) => (
                <div
                  key={ref.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <p className="text-sm font-medium text-white">
                    {ref.referred.name}{" "}
                    <span className="text-stone-500">({ref.relationship})</span>
                  </p>
                  <p className="text-xs text-stone-500">
                    {ref.status === "completed"
                      ? `Completed ${ref.completedAt ? formatDate(ref.completedAt) : ""} — you earned 5% stored discount`
                      : "Pending first visit"}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-white">Recent visits</h2>
            <div className="mt-4 space-y-2">
              {member.visits.length === 0 && (
                <p className="text-sm text-stone-500">No visits recorded</p>
              )}
              {member.visits.map((visit) => (
                <div
                  key={visit.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <div className="flex justify-between">
                    <span className="text-white">{formatDate(visit.createdAt)}</span>
                    <span className="font-medium text-emerald-300">
                      {formatCurrency(visit.finalAmount)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Treatment {formatCurrency(visit.treatmentValue)}
                    {visit.discountAmount > 0 &&
                      ` — ${visit.friendDiscountPct + visit.storedDiscountPct}% discount applied`}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
