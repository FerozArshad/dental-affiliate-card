import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Same-origin proxy for the QR image so it can be downloaded (as an
// attachment) without cross-origin/canvas tainting issues.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  const size = Math.min(Number(searchParams.get("size")) || 1000, 2000);
  const filename = (searchParams.get("filename") || "gold-card-qr").replace(
    /[^a-z0-9-_]/gi,
    "-"
  );

  if (!data) return new Response("Missing data", { status: 400 });

  const upstream = await fetch(
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
      data
    )}`
  );
  if (!upstream.ok) return new Response("QR generation failed", { status: 502 });

  const buf = await upstream.arrayBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
