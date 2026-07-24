import type { NextRequest } from "next/server";
import { handleInboundWhatsApp } from "@/lib/whatsapp-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Meta WhatsApp Cloud API webhook.
 * Set callback URL to: https://YOUR-DOMAIN/api/whatsapp/webhook
 * Verify token must match WHATSAPP_VERIFY_TOKEN.
 */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const verify = process.env.WHATSAPP_VERIFY_TOKEN || "goldcard-verify";

  if (mode === "subscribe" && token === verify && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  // Always 200 quickly so Meta doesn't retry storm; process inline for demo scale.
  try {
    const body = payload as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              from?: string;
              type?: string;
              text?: { body?: string };
            }>;
          };
        }>;
      }>;
    };

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const msg of change.value?.messages ?? []) {
          if (msg.type === "text" && msg.from && msg.text?.body) {
            await handleInboundWhatsApp({
              phone: `+${msg.from}`,
              text: msg.text.body,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("WhatsApp webhook error:", e);
  }

  return new Response("ok", { status: 200 });
}
