import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { onQualifyingPurchase, releaseMaturedCredits } from "@/lib/rewards";
import { sendWhatsApp } from "@/lib/whatsapp";

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

  const existing = await prisma.visit.findUnique({
    where: { stripeSessionId: sessionId },
  });
  if (existing) return;

  await releaseMaturedCredits();

  const treatmentValue = Number(meta.treatmentValue) || 0;
  const storedDiscountPct = Number(meta.storedDiscountPct) || 0;
  const friendDiscountPct = Number(meta.friendDiscountPct) || 0;
  const discountAmount = Number(meta.discountAmount) || 0;
  const finalAmount =
    Number(meta.finalAmount) ||
    (session.amount_total != null ? session.amount_total / 100 : 0);
  const creditIds = (meta.creditIds || meta.creditId || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { referredBy: true },
  });

  const visit = await prisma.visit.create({
    data: {
      memberId,
      treatmentValue,
      friendDiscountPct,
      storedDiscountPct,
      discountAmount,
      finalAmount,
      fromReferral: Boolean(member?.referredBy),
      paidOnline: true,
      stripeSessionId: sessionId,
      notes: "Paid online via Stripe",
    },
  });

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

  // Qualifying purchase → L1 / L2 held rewards
  await onQualifyingPurchase({
    memberId,
    visitId: visit.id,
    treatmentValue,
  });

  if (member) {
    await sendWhatsApp(
      member.phone,
      `Payment received: £${finalAmount.toFixed(2)}` +
        (discountAmount > 0
          ? ` — Gold Card discount applied (£${discountAmount.toFixed(2)}).`
          : ".") +
        " Thank you!",
      member.id
    );
  }
}
