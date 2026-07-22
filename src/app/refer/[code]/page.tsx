import { notFound } from "next/navigation";
import { ReferralForm } from "@/components/referral-form";
import { getMemberByCode } from "@/lib/actions";
import { REFERRAL_DISCOUNT_PERCENT } from "@/lib/constants";

export default async function ReferPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const member = await getMemberByCode(code);

  if (!member) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
          You&apos;ve been invited
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">
          Get {REFERRAL_DISCOUNT_PERCENT}% off your treatment
        </h1>
        <p className="mt-3 text-stone-400">
          {member.name} shared their {member.practice.name} Gold Card with you.
          Join now — your welcome discount is applied at your first visit.
        </p>
      </div>
      <div className="mt-8">
        <ReferralForm referrerCode={member.memberCode} referrerName={member.name} />
      </div>
      <div className="mt-6 space-y-2 text-center text-xs text-stone-500">
        <p>
          After your visit, {member.name.split(" ")[0]} earns{" "}
          {REFERRAL_DISCOUNT_PERCENT}% off their family&apos;s next treatment
          (stored on their card — not cash).
        </p>
        <p>
          You also get your own Gold Card and referral link, so you can invite
          others and earn stored discounts too.
        </p>
      </div>
    </div>
  );
}
