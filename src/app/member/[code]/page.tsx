import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Trophy } from "lucide-react";
import { GoldCard } from "@/components/gold-card";
import { ShareActions } from "@/components/share-actions";
import { QrBlock } from "@/components/qr-block";
import { PayOnline } from "@/components/pay-online";
import { Card } from "@/components/ui/card";
import { getMemberByCode } from "@/lib/actions";
import { getAppBaseUrl, getTier } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ paid?: string; canceled?: string }>;
}) {
  const { code } = await params;
  const sp = (await searchParams) ?? {};
  const member = await getMemberByCode(code);

  if (!member) notFound();

  const availableCredits = member.discountCredits.filter(
    (d) => d.status === "available"
  );
  const availableDiscounts = availableCredits.length;
  const storedPercents = availableCredits.map((d) => d.percent);
  const bestStoredPercent = storedPercents.length
    ? Math.max(...storedPercents)
    : 0;
  const completedReferrals = member.referralsMade.filter(
    (r) => r.status === "completed"
  ).length;
  const tier = getTier(completedReferrals);
  const baseUrl = getAppBaseUrl();
  const referUrl = `${baseUrl}/refer/${member.memberCode}`;

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
              storedPercents={storedPercents}
              familyName={member.familyGroup?.name}
              tier={tier.name}
              cashbackPercent={tier.cashbackPercent}
              completedReferrals={completedReferrals}
              nextTierAt={tier.nextAt}
              prizeActive={member.practice.prizeCampaignActive}
              prizeLabel={member.practice.prizeLabel}
              doubleReward={member.practice.doubleRewardActive}
            />
          </div>

          <div className="mt-6">
            <ShareActions
              practiceName={member.practice.name}
              memberCode={member.memberCode}
              memberName={member.name}
              baseUrl={baseUrl}
            />
          </div>

          <div className="mt-4">
            <QrBlock url={referUrl} label="Scan to join via this member" />
          </div>

          <div className="mt-3 text-center">
            <Link
              href={`/desk/poster?code=${member.memberCode}`}
              className="text-sm text-amber-300 hover:underline"
            >
              Print a branded referral poster →
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {sp.paid === "1" && (
            <Card className="border-emerald-400/30 bg-emerald-400/10">
              <p className="flex items-center gap-2 font-semibold text-emerald-100">
                <CheckCircle2 className="h-4 w-4" /> Payment successful
              </p>
              <p className="mt-1 text-sm text-emerald-100/80">
                Thanks! Your treatment payment was received.
              </p>
            </Card>
          )}
          {sp.canceled === "1" && (
            <Card className="border-white/10 bg-white/5">
              <p className="text-sm text-stone-400">
                Payment was cancelled — no charge was made.
              </p>
            </Card>
          )}

          <Card>
            <h2 className="font-semibold text-white">Pay for treatment</h2>
            <p className="mt-1 text-sm text-stone-500">
              {bestStoredPercent > 0
                ? `Your ${bestStoredPercent}% stored discount is applied automatically.`
                : "Pay securely online."}
            </p>
            <div className="mt-4">
              <PayOnline
                memberCode={member.memberCode}
                bestStoredPercent={bestStoredPercent}
              />
            </div>
          </Card>

          {(member.practice.prizeCampaignActive ||
            member.practice.doubleRewardActive) && (
            <Card className="border-amber-400/30 bg-amber-400/10">
              <p className="flex items-center gap-2 font-semibold text-amber-100">
                <Trophy className="h-4 w-4" /> Growth boosts active
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-100/80">
                {member.practice.prizeCampaignActive && (
                  <li>Monthly prize: {member.practice.prizeLabel}</li>
                )}
                {member.practice.doubleRewardActive && (
                  <li>Double reward week — 2× stored discounts</li>
                )}
              </ul>
              <Link
                href="/leaderboard"
                className="mt-3 inline-block text-sm text-amber-200 hover:underline"
              >
                View leaderboard →
              </Link>
            </Card>
          )}

          <Card>
            <h2 className="font-semibold text-white">Stored discounts</h2>
            <p className="mt-1 text-sm text-stone-500">
              Not cash — applied at front desk on next family treatment
            </p>
            <div className="mt-4 space-y-2">
              {member.discountCredits.length === 0 && (
                <p className="text-sm text-stone-500">
                  No discounts yet. Refer someone!
                </p>
              )}
              {member.discountCredits.map((credit) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {credit.label}
                    </p>
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
                    <Link
                      href={`/member/${ref.referred.memberCode}`}
                      className="text-amber-300 hover:underline"
                    >
                      {ref.referred.name}
                    </Link>{" "}
                    <span className="text-stone-500">({ref.relationship})</span>
                  </p>
                  <p className="text-xs text-stone-500">
                    {ref.status === "completed"
                      ? `Completed — they have their own card & can refer too`
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
                    <span className="text-white">
                      {formatDate(visit.createdAt)}
                    </span>
                    <span className="font-medium text-emerald-300">
                      {formatCurrency(visit.finalAmount)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Treatment {formatCurrency(visit.treatmentValue)}
                    {visit.discountAmount > 0 &&
                      ` — discount applied`}
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
