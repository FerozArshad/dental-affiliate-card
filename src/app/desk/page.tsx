import { QrBlock } from "@/components/qr-block";
import { Card } from "@/components/ui/card";
import { getPracticePublic } from "@/lib/actions";
import { getAppBaseUrl } from "@/lib/constants";
import Link from "next/link";

export default async function DeskPage() {
  const practice = await getPracticePublic();
  const joinUrl = `${getAppBaseUrl()}/join`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
        Reception desk
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white">Scan to join</h1>
      <p className="mt-2 text-stone-400">
        Put this QR at reception. Patients scan → get a Gold Card in seconds.
      </p>

      <div className="mx-auto mt-8 flex justify-center">
        <QrBlock url={joinUrl} label={`${practice.name} — walk-in join`} size={240} />
      </div>

      <Card className="mt-8 text-left">
        <h2 className="font-semibold text-white">Staff script</h2>
        <ol className="mt-3 space-y-2 text-sm text-stone-300">
          <li>1. “Would you like our Gold Card? Scan this QR.”</li>
          <li>2. Patient joins → gets card + referral link.</li>
          <li>3. “Share with family — they get 5% off, you earn a stored discount.”</li>
        </ol>
        <Link
          href="/enroll"
          className="mt-4 inline-block text-sm text-amber-300 hover:underline"
        >
          Or enroll manually →
        </Link>
      </Card>
    </div>
  );
}
