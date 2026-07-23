import Image from "next/image";
import { QrCode, Share2, Gift } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { qrImageUrl } from "@/lib/utils";

export function QrPoster({
  joinUrl,
  practiceName,
  discountPercent,
}: {
  joinUrl: string;
  practiceName: string;
  discountPercent: number;
}) {
  return (
    <div className="qr-poster mx-auto w-full max-w-[794px] overflow-hidden rounded-3xl bg-white shadow-2xl">
      {/* Header band */}
      <div className="flex flex-col items-center gap-2 bg-stone-950 px-8 py-8 text-center">
        <Image
          src={BRAND.logo}
          alt={BRAND.name}
          width={260}
          height={104}
          className="h-16 w-auto"
          priority
        />
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-300">
          {BRAND.tagline}
        </p>
      </div>

      {/* Body */}
      <div className="px-10 py-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
          The Gold Card
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-stone-900">
          Refer family &amp; friends.
          <br />
          Everyone saves.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
          Scan to join in seconds. Your family &amp; friends get{" "}
          <span className="font-semibold text-stone-900">
            {discountPercent}% off
          </span>{" "}
          their treatment — and you earn stored discounts on your next visit.
        </p>

        {/* QR */}
        <div className="mx-auto mt-8 inline-flex flex-col items-center rounded-3xl border-4 border-stone-900 p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl(joinUrl, 720)}
            alt={`${practiceName} — scan to join the Gold Card`}
            width={300}
            height={300}
            className="h-[300px] w-[300px]"
          />
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
            <QrCode className="h-4 w-4" /> Scan with your phone camera
          </p>
          <p className="mt-1 text-xs text-stone-500">{joinUrl}</p>
        </div>

        {/* Steps */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-left">
          <Step
            icon={<QrCode className="h-5 w-5" />}
            title="1. Scan & join"
            body="Get your digital Gold Card instantly on your phone."
          />
          <Step
            icon={<Share2 className="h-5 w-5" />}
            title="2. Share"
            body={`Send your link to family — they get ${discountPercent}% off.`}
          />
          <Step
            icon={<Gift className="h-5 w-5" />}
            title="3. Save"
            body="Earn stored discounts toward your family's next treatment."
          />
        </div>
      </div>

      {/* Footer band */}
      <div className="flex items-center justify-between bg-stone-950 px-10 py-5 text-sm text-stone-300">
        <span className="font-semibold text-white">{practiceName}</span>
        <span className="text-amber-300">
          {BRAND.website.replace(/^https?:\/\//, "")}
        </span>
      </div>
    </div>
  );
}

function Step({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-stone-950">
        {icon}
      </span>
      <p className="mt-2 font-semibold text-stone-900">{title}</p>
      <p className="mt-1 text-sm text-stone-600">{body}</p>
    </div>
  );
}
