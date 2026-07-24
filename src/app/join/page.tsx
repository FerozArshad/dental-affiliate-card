import { BotChat } from "@/components/bot-chat";
import { getPracticePublic } from "@/lib/actions";
import { REFERRAL_DISCOUNT_PERCENT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const practice = await getPracticePublic();

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
          Walk-in join
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">
          Chat to join {practice.name}
        </h1>
        <p className="mt-3 text-stone-400">
          Sign up in a few taps — get your Gold Card with{" "}
          {REFERRAL_DISCOUNT_PERCENT}% stored, ready to use. Then share your link
          so friends get {REFERRAL_DISCOUNT_PERCENT}% too.
        </p>
      </div>
      <div className="mt-8">
        <BotChat
          practiceName={practice.name}
          discountPercent={REFERRAL_DISCOUNT_PERCENT}
        />
      </div>
    </div>
  );
}
