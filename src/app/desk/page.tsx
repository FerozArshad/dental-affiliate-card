import { QrBlock } from "@/components/qr-block";
import { Card } from "@/components/ui/card";
import { getPracticePublic } from "@/lib/actions";
import { getWhatsAppBusinessDigits } from "@/lib/constants";
import { joinDeepLink } from "@/lib/utils";
import Link from "next/link";
import { Printer } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DeskPage() {
  const practice = await getPracticePublic();
  const joinUrl = joinDeepLink();
  const waConfigured = Boolean(getWhatsAppBusinessDigits());

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
        Reception desk
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white">Scan to join</h1>
      <p className="mt-2 text-stone-400">
        {waConfigured
          ? "QR opens WhatsApp with a referral code. Patient hits Send → bot onboards them."
          : "QR opens the web join chat. Add NEXT_PUBLIC_WHATSAPP_NUMBER to switch to WhatsApp deep links."}
      </p>

      <div className="mx-auto mt-8 flex justify-center">
        <QrBlock
          url={joinUrl}
          label={`${practice.name} — walk-in join`}
          size={240}
        />
      </div>
      <p className="mt-3 break-all px-4 font-mono text-xs text-stone-500">
        {joinUrl}
      </p>

      <div className="mt-6">
        <Link
          href="/desk/poster"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-5 py-2.5 text-sm font-semibold text-stone-950 hover:brightness-105"
        >
          <Printer className="h-4 w-4" /> Print branded poster
        </Link>
      </div>

      <Card className="mt-8 text-left">
        <h2 className="font-semibold text-white">Staff script</h2>
        <ol className="mt-3 space-y-2 text-sm text-stone-300">
          <li>1. “Would you like our Gold Card? Scan this QR.”</li>
          <li>2. Patient joins → gets card + own REF code (no discount yet).</li>
          <li>
            3. “Share with family — they get 5% on their first paid treatment;
            you earn 5% after they complete it.”
          </li>
        </ol>
        <Link
          href="/enroll"
          className="mt-4 inline-block text-sm text-amber-300 hover:underline"
        >
          Or enroll manually →
        </Link>
        <Link
          href="/join"
          className="mt-2 block text-sm text-stone-500 hover:text-amber-300"
        >
          Web join chat (fallback) →
        </Link>
      </Card>
    </div>
  );
}
