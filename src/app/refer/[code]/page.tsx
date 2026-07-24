import { notFound } from "next/navigation";
import { BotChat } from "@/components/bot-chat";
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
          Get {REFERRAL_DISCOUNT_PERCENT}% on your Gold Card
        </h1>
        <p className="mt-3 text-stone-400">
          {member.name} shared their {member.practice.name} Gold Card. Chat with
          our assistant to join — {REFERRAL_DISCOUNT_PERCENT}% is stored on your
          card as soon as you sign up.
        </p>
      </div>
      <div className="mt-8">
        <BotChat
          practiceName={member.practice.name}
          discountPercent={REFERRAL_DISCOUNT_PERCENT}
          referrerCode={member.memberCode}
          referrerName={member.name}
          relationshipDefault="family"
        />
      </div>
      <div className="mt-6 space-y-2 text-center text-xs text-stone-500">
        <p>
          You get {REFERRAL_DISCOUNT_PERCENT}% stored when you join. After your
          first visit, {member.name.split(" ")[0]} earns another stored family
          discount (not cash).
        </p>
        <p>
          You also get your own Gold Card and referral link to invite others.
        </p>
      </div>
    </div>
  );
}
