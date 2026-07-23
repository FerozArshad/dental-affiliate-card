import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";

// Stripe webhooks need the Node runtime (raw body + crypto) and must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return new Response("Stripe not configured", { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  // Raw body is required for signature verification.
  const body = await req.text();

  const StripeCtor = (await import("stripe")).default;
  const stripe = new StripeCtor(key);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verification error";
    return new Response(`Webhook signature verification failed: ${msg}`, {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    await handleCompletedCheckout(
      event.data.object as Stripe.Checkout.Session
    );
  }

  return new Response("ok", { status: 200 });
}

async function handleCompletedCheckout(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const memberId = meta.memberId;
  const sessionId = session.id;
  if (!memberId || !sessionId) return;

  // Idempotency: if this session was already processed, do nothing.
  const existing = await prisma.visit.findUnique({
    where: { stripeSessionId: sessionId },
  });
  if (existing) return;

  const treatmentValue = Number(meta.treatmentValue) || 0;
  const storedDiscountPct = Number(meta.storedDiscountPct) || 0;
  const discountAmount = Number(meta.discountAmount) || 0;
  const finalAmount =
    Number(meta.finalAmount) ||
    (session.amount_total != null ? session.amount_total / 100 : 0);
  // Newer sessions carry a comma-separated `creditIds`; fall back to the older
  // single `creditId` for any in-flight sessions created before the change.
  const creditIds = (meta.creditIds || meta.creditId || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const visit = await prisma.visit.create({
    data: {
      memberId,
      treatmentValue,
      storedDiscountPct,
      discountAmount,
      finalAmount,
      paidOnline: true,
      stripeSessionId: sessionId,
      notes: "Paid online via Stripe",
    },
  });

  // Redeem the stored discounts that were applied — only those still available
  // (updateMany makes this safely idempotent).
  if (creditIds.length) {
    await prisma.discountCredit.updateMany({
      where: { id: { in: creditIds }, status: "available" },
      data: {
        status: "redeemed",
        redeemedAt: new Date(),
        redeemedForMemberId: memberId,
        visitId: visit.id,
      },
    });
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (member) {
    await prisma.whatsAppMessage.create({
      data: {
        memberId: member.id,
        phone: member.phone,
        body:
          `Payment received: £${finalAmount.toFixed(2)}` +
          (storedDiscountPct > 0
            ? ` — your ${storedDiscountPct}% Gold Card discount${
                creditIds.length > 1
                  ? ` (${creditIds.length} stored discounts combined)`
                  : ""
              } was applied.`
            : ".") +
          " Thank you!",
      },
    });
  }
}
