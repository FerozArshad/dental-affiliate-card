import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QrPoster } from "@/components/qr-poster";
import { PrintButton } from "@/components/print-button";
import { getPracticePublic } from "@/lib/actions";
import { getAppBaseUrl, REFERRAL_DISCOUNT_PERCENT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PosterPage() {
  const practice = await getPracticePublic();
  const joinUrl = `${getAppBaseUrl()}/join`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="no-print mb-8 flex items-center justify-between">
        <Link
          href="/desk"
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to desk
        </Link>
        <PrintButton />
      </div>

      <p className="no-print mb-4 text-center text-sm text-stone-500">
        Preview below. Click <span className="text-amber-300">Print poster</span>{" "}
        — choose A4 portrait. Tip: enable “Background graphics” for the branded
        bands.
      </p>

      <QrPoster
        joinUrl={joinUrl}
        practiceName={practice.name}
        discountPercent={REFERRAL_DISCOUNT_PERCENT}
      />
    </div>
  );
}
