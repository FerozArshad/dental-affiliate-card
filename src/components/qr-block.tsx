import { qrImageUrl } from "@/lib/utils";

export function QrBlock({
  url,
  label,
  size = 180,
}: {
  url: string;
  label: string;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white p-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrImageUrl(url, size)}
        alt={label}
        width={size}
        height={size}
        className="rounded-lg"
      />
      <p className="mt-3 text-xs font-medium text-stone-700">{label}</p>
      <p className="mt-1 max-w-[200px] break-all text-[10px] text-stone-400">
        {url}
      </p>
    </div>
  );
}
