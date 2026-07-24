import { prisma } from "@/lib/db";

export function isWhatsAppConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

/**
 * Send a WhatsApp text via Meta Cloud API when keys are set.
 * Always logs to the DB (dashboard "WhatsApp" feed).
 */
export async function sendWhatsApp(
  phone: string,
  body: string,
  memberId?: string
) {
  await prisma.whatsAppMessage.create({
    data: { phone, body, memberId, direction: "outbound" },
  });

  if (!isWhatsAppConfigured()) return { sent: false, reason: "not_configured" };

  const digits = phone.replace(/\D/g, "");
  const to = digits.startsWith("0") ? `44${digits.slice(1)}` : digits;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { preview_url: false, body },
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error("WhatsApp send failed:", errText);
      return { sent: false, reason: errText };
    }
    return { sent: true };
  } catch (e) {
    console.error("WhatsApp send error:", e);
    return { sent: false, reason: e instanceof Error ? e.message : "error" };
  }
}
