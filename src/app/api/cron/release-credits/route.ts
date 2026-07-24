import { NextResponse } from "next/server";
import { releaseMaturedCredits } from "@/lib/rewards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Release held credits whose return window has passed.
 * Optional: protect with CRON_SECRET header Authorization: Bearer …
 * Vercel Cron: GET /api/cron/release-credits daily.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const released = await releaseMaturedCredits();
  return NextResponse.json({ ok: true, released });
}
