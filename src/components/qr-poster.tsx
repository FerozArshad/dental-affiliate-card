import Image from "next/image";
import { QrCode, Share2, Gift } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { qrImageUrl } from "@/lib/utils";

export type PosterSize = "a4" | "a5" | "tent";

const SIZE_MAP: Record<
  PosterSize,
  { maxW: string; qr: number; h1: string; pad: string }
> = {
  a4: { maxW: "max-w-[794px]", qr: 300, h1: "text-4xl", pad: "px-10 py-10" },
  a5: { maxW: "max-w-[559px]", qr: 210, h1: "text-3xl", pad: "px-8 py-7" },
  tent: { maxW: "max-w-[480px]", qr: 180, h1: "text-2xl", pad: "px-6 py-6" },
};

export function QrPoster({
  qrUrl,
  practiceName,
  discountPercent,
  size = "a4",
  mode = "join",
  referrerName,
}: {
  qrUrl: string;
  practiceName: string;
  discountPercent: number;
  size?: PosterSize;
  mode?: "join" | "refer";
  referrerName?: string;
}) {
  const s = SIZE_MAP[size];
  const isRefer = mode === "refer";

  const headline = isRefer ? (
    <>
      {referrerName ? `${referrerName} invites you` : "You're invited"}
      <br />
      to our Gold Card.
    </>
  ) : (
    <>
      Refer family &amp; friends.
      <br />
      Everyone saves.
    </>
  );

  const subline = isRefer
    ? `Scan to join and get ${discountPercent}% off your first treatment — plus your own card to share with family.`
    : `Scan to join in seconds. Your family & friends get ${discountPercent}% off their treatment — and you earn stored discounts on your next visit.`;

  return (
    <div
      className={`qr-poster mx-auto w-full ${s.maxW} overflow-hidden rounded-3xl bg-white shadow-2xl`}
    >
      {/* Header band */}
      <div className="flex flex-col items-center gap-2 bg-stone-950 px-8 py-6 text-center">
        <Image
          src={BRAND.logo}
          alt={BRAND.name}
          width={260}
          height={104}
          className="h-14 w-auto"
          priority
        />
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-300">
          {BRAND.tagline}
        </p>
      </div>

      {/* Body */}
      <div className={`${s.pad} text-center`}>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
          {isRefer ? "Personal invitation" : "The Gold Card"}
        </p>
        <h1 className={`mt-2 ${s.h1} font-extrabold leading-tight text-stone-900`}>
          {headline}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-stone-600">
          {subline}
        </p>

        {/* QR */}
        <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-3xl border-4 border-stone-900 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl(qrUrl, s.qr * 2)}
            alt={`${practiceName} — scan to join the Gold Card`}
            width={s.qr}
            height={s.qr}
            style={{ width: s.qr, height: s.qr }}
          />
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-stone-800">
            <QrCode className="h-4 w-4" /> Scan with your phone camera
          </p>
          <p className="mt-1 max-w-[260px] break-all text-[10px] text-stone-500">
            {qrUrl}
          </p>
        </div>

        {/* Steps (hidden on the compact table-tent) */}
        {size !== "tent" && (
          <div className="mt-8 grid grid-cols-3 gap-3 text-left">
            <Step
              icon={<QrCode className="h-5 w-5" />}
              title="1. Scan & join"
              body="Get your digital Gold Card instantly on your phone."
            />
            <Step
              icon={<Share2 className="h-5 w-5" />}
              title="2. Share"
              body={`Send your REF code — they get ${discountPercent}% off first paid treatment.`}
            />
            <Step
              icon={<Gift className="h-5 w-5" />}
              title="3. Earn"
              body={`You earn ${discountPercent}% after they complete treatment (held 14 days).`}
            />
          </div>
        )}
      </div>

      {/* Footer band */}
      <div className="flex items-center justify-between bg-stone-950 px-8 py-4 text-sm text-stone-300">
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
