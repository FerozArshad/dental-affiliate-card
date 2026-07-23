import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { QrPoster, type PosterSize } from "@/components/qr-poster";
import { PrintButton } from "@/components/print-button";
import { getMemberByCode, getPracticePublic } from "@/lib/actions";
import { getAppBaseUrl, REFERRAL_DISCOUNT_PERCENT } from "@/lib/constants";

export const dynamic = "force-dynamic";

const PAGE_SIZE: Record<PosterSize, string> = {
  a4: "A4 portrait",
  a5: "A5 portrait",
  tent: "A5 landscape",
};

export default async function PosterPage({
  searchParams,
}: {
  searchParams?: Promise<{ size?: string; code?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const size: PosterSize =
    sp.size === "a5" ? "a5" : sp.size === "tent" ? "tent" : "a4";

  const practice = await getPracticePublic();
  const base = getAppBaseUrl();

  // Referral mode: encode a specific member's referral link.
  const member = sp.code ? await getMemberByCode(sp.code) : null;
  const mode = member ? "refer" : "join";
  const qrUrl = member ? `${base}/refer/${member.memberCode}` : `${base}/join`;
  const practiceName = member?.practice.name ?? practice.name;

  const downloadHref = `/api/qr?size=1000&filename=${
    member ? `refer-${member.memberCode}` : "gold-card-join"
  }&data=${encodeURIComponent(qrUrl)}`;

  const sizeLink = (target: PosterSize) => {
    const params = new URLSearchParams();
    params.set("size", target);
    if (sp.code) params.set("code", sp.code);
    return `/desk/poster?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Standalone poster view: hide the site header/footer so it's a single
          clean poster on screen and in print. Force the print page size too. */}
      <style>{`
        body > header, body > footer { display: none !important; }
        @media print { @page { size: ${PAGE_SIZE[size]}; margin: 10mm; } }
      `}</style>

      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/desk"
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to desk
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={downloadHref}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
          >
            <Download className="h-4 w-4" /> Download QR (PNG)
          </a>
          <PrintButton label="Print / Save as PDF" />
        </div>
      </div>

      {/* Size selector */}
      <div className="no-print mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-stone-500">Size:</span>
        {(["a4", "a5", "tent"] as PosterSize[]).map((t) => (
          <Link
            key={t}
            href={sizeLink(t)}
            className={`rounded-lg px-3 py-1.5 font-medium ${
              size === t
                ? "bg-amber-400 text-stone-950"
                : "border border-white/10 text-stone-300 hover:bg-white/5"
            }`}
          >
            {t === "a4"
              ? "A4 poster"
              : t === "a5"
                ? "A5 flyer"
                : "Table tent"}
          </Link>
        ))}
      </div>

      <p className="no-print mb-4 text-center text-sm text-stone-500">
        {mode === "refer"
          ? `Referral poster for ${member?.name}. `
          : "Reception join poster. "}
        Click <span className="text-amber-300">Print / Save as PDF</span> — pick
        “Save as PDF” as the printer for a file, and enable “Background graphics”
        for the branded bands.
      </p>

      <QrPoster
        qrUrl={qrUrl}
        practiceName={practiceName}
        discountPercent={REFERRAL_DISCOUNT_PERCENT}
        size={size}
        mode={mode}
        referrerName={member?.name}
      />
    </div>
  );
}
