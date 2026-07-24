import { prisma } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import {
  PRACTICE_NAME,
  REFERRAL_DISCOUNT_PERCENT,
  CREDIT_HOLD_DAYS,
  LEVEL2_OVERRIDE_PERCENT,
  getAppBaseUrl,
} from "@/lib/constants";
import { writeAudit, normalizePhone } from "@/lib/audit";

/** Pull REF-GOLD-XXXX or GOLD-XXXX from inbound WhatsApp text. */
export function extractReferralCode(text: string): string | null {
  const upper = text.toUpperCase();
  const gold = upper.match(/GOLD-[A-Z0-9]+/);
  if (gold) return gold[0];
  const ref = upper.match(/REF[-:\s]+([A-Z0-9-]+)/);
  if (ref?.[1]) {
    return ref[1].startsWith("GOLD-") ? ref[1] : `GOLD-${ref[1]}`;
  }
  return null;
}

/**
 * Conversational onboarding over WhatsApp Business API.
 * Steps: start → name → email → confirm → done
 */
export async function handleInboundWhatsApp(opts: {
  phone: string;
  text: string;
}) {
  const phone = opts.phone;
  const text = opts.text.trim();
  const phoneNormalized = normalizePhone(phone);

  await prisma.whatsAppMessage.create({
    data: { phone, body: text, direction: "inbound" },
  });

  // STOP / opt-out
  if (/^(stop|unsubscribe|opt\s*out)$/i.test(text)) {
    await prisma.member.updateMany({
      where: {
        OR: [{ phone }, { phoneNormalized }],
      },
      data: { optedIn: false },
    });
    await sendWhatsApp(
      phone,
      `You've been opted out of ${PRACTICE_NAME} Gold Card messages. Reply START to opt back in.`
    );
    await writeAudit({ type: "whatsapp.opt_out", meta: { phone: phoneNormalized } });
    return;
  }

  if (/^(start|unstop)$/i.test(text)) {
    await prisma.member.updateMany({
      where: { OR: [{ phone }, { phoneNormalized }] },
      data: { optedIn: true },
    });
  }

  // Already a member?
  const existing = await prisma.member.findFirst({
    where: { OR: [{ phone }, { phoneNormalized }] },
  });
  if (existing) {
    const cardUrl = `${getAppBaseUrl()}/member/${existing.memberCode}`;
    await sendWhatsApp(
      phone,
      `You're already on the Gold Card (${existing.memberCode}).\n\nOpen your card: ${cardUrl}\nShare REF-${existing.memberCode} so friends get ${REFERRAL_DISCOUNT_PERCENT}% off their first paid treatment — you earn ${REFERRAL_DISCOUNT_PERCENT}% after they complete it.`,
      existing.id
    );
    return;
  }

  let session = await prisma.whatsAppSession.findUnique({ where: { phone } });
  const refFromText = extractReferralCode(text);

  if (!session) {
    session = await prisma.whatsAppSession.create({
      data: {
        phone,
        step: "name",
        referrerCode: refFromText ?? undefined,
      },
    });

    const refNote = refFromText
      ? `We see referral code ${refFromText}. `
      : "";
    await sendWhatsApp(
      phone,
      `Welcome to ${PRACTICE_NAME} Gold Card!\n\n${refNote}By continuing you agree to our Privacy Policy (${getAppBaseUrl()}/privacy) and to receive Gold Card messages. Reply STOP anytime to opt out.\n\nRewards are stored treatment discounts (not cash), paid only after a qualifying treatment — never for signup alone.\n\nWhat's your full name?`
    );
    return;
  }

  // Update referrer if they send REF later
  if (refFromText && !session.referrerCode) {
    session = await prisma.whatsAppSession.update({
      where: { phone },
      data: { referrerCode: refFromText },
    });
  }

  if (session.step === "name") {
    if (text.length < 2 || /^(hi|hello|hey|ref[-:\s])/i.test(text)) {
      await sendWhatsApp(phone, "Please reply with your full name (e.g. Sarah Smith).");
      return;
    }
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { name: text, step: "email" },
    });
    await sendWhatsApp(
      phone,
      `Thanks ${text.split(" ")[0]}! What's your email address? (or reply SKIP)`
    );
    return;
  }

  if (session.step === "email") {
    const email =
      /^skip$/i.test(text) || text === "-"
        ? ""
        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
          ? text
          : null;
    if (email === null) {
      await sendWhatsApp(phone, "That doesn't look like an email. Try again or reply SKIP.");
      return;
    }
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { email, step: "confirm" },
    });
    await sendWhatsApp(
      phone,
      `Almost done!\n\nName: ${session.name}\nEmail: ${email || "—"}\nReferral: ${session.referrerCode || "walk-in"}\n\nReply YES to create your Gold Card. You'll get your own share code. Discounts unlock after a qualifying paid treatment.`
    );
    return;
  }

  if (session.step === "confirm") {
    if (!/^yes|y|ok|confirm$/i.test(text)) {
      await sendWhatsApp(phone, "Reply YES to confirm and create your Gold Card, or START to begin again.");
      if (/^start$/i.test(text)) {
        await prisma.whatsAppSession.delete({ where: { phone } });
      }
      return;
    }

    const { botRegister } = await import("@/lib/actions");
    const result = await botRegister({
      name: session.name || "Member",
      email: session.email || "",
      phone,
      referrerCode: session.referrerCode || undefined,
    });

    await prisma.whatsAppSession.update({
      where: { phone },
      data: { step: "done" },
    });

    if (result.error) {
      await sendWhatsApp(phone, `Sorry: ${result.error}`);
      return;
    }

    const cardUrl = `${getAppBaseUrl()}/member/${result.memberCode}`;
    await sendWhatsApp(
      phone,
      `You're in! ✅ Gold Card: ${result.memberCode}\n\nOpen: ${cardUrl}\n\nShare with friends using: REF-${result.memberCode}\nThey get ${REFERRAL_DISCOUNT_PERCENT}% off their first qualifying treatment; you earn ${REFERRAL_DISCOUNT_PERCENT}% after they complete it (held ${CREDIT_HOLD_DAYS} days). Level-2 network override is ${LEVEL2_OVERRIDE_PERCENT}% — nothing beyond that.`
    );

    await writeAudit({
      type: "whatsapp.onboarded",
      subjectId: result.memberCode,
      meta: { phone: phoneNormalized, referrerCode: session.referrerCode },
    });
    return;
  }

  // done / unknown
  await sendWhatsApp(
    phone,
    `You're registered. Open your card anytime via the link we sent, or visit ${getAppBaseUrl()}/join`
  );
}
