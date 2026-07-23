/**
 * Stripe payment scaffolding.
 *
 * Patients pay for treatment via Stripe (and WhatsApp Pay where available).
 * Full checkout is wired once the following env vars are set:
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 *
 * This module intentionally has no hard dependency on the `stripe` package yet,
 * so the app builds and deploys before keys are provided. When keys are ready,
 * we install `stripe` and implement createCheckoutSession below.
 */

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type TreatmentPaymentInput = {
  memberCode: string;
  description: string;
  amountGbp: number; // final amount after stored discount
};

export async function createTreatmentCheckout(
  input: TreatmentPaymentInput
): Promise<{ url?: string; error?: string }> {
  if (!isStripeConfigured()) {
    return {
      error:
        "Online card payments aren't switched on yet. Add STRIPE_SECRET_KEY to enable them.",
    };
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: input.description },
            unit_amount: Math.round(input.amountGbp * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/member/${input.memberCode}?paid=1`,
      cancel_url: `${base}/member/${input.memberCode}?canceled=1`,
      metadata: { memberCode: input.memberCode },
    });

    return { url: session.url ?? undefined };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not start payment.",
    };
  }
}
