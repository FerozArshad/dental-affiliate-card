/**
 * Stripe Checkout for patient treatment payments.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL
 */

import { BRAND } from "@/lib/constants";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type TreatmentPaymentInput = {
  memberCode: string;
  description: string;
  amountGbp: number; // final amount after stored discount
  // Extra context recorded on the Stripe session so the webhook can
  // create the visit + redeem the discount automatically on payment.
  metadata?: Record<string, string>;
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
    const base =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://affiliate.dentalscotland.com";
    const logoUrl = `${base.replace(/\/$/, "")}${BRAND.logo}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "en-GB",
      // Dental Scotland branding on the hosted Stripe Checkout page
      branding_settings: {
        display_name: BRAND.name,
        background_color: "#0c0a09", // stone-950
        button_color: "#d97706", // amber-600 (Gold Card)
        border_style: "rounded",
        font_family: "inter",
        logo: {
          type: "url",
          url: logoUrl,
        },
      },
      custom_text: {
        submit: {
          message: `Paying ${BRAND.name} — Gold Card discounts are already applied to this total.`,
        },
        after_submit: {
          message: `Thank you. You'll return to your Gold Card. ${BRAND.tagline}.`,
        },
      },
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: input.description,
              description: `${BRAND.name} · Gold Card treatment payment`,
              images: [logoUrl],
            },
            unit_amount: Math.round(input.amountGbp * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/member/${input.memberCode}?paid=1`,
      cancel_url: `${base}/member/${input.memberCode}?canceled=1`,
      metadata: { memberCode: input.memberCode, ...(input.metadata ?? {}) },
    });

    return { url: session.url ?? undefined };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not start payment.",
    };
  }
}
