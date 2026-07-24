import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  getAppBaseUrl,
  getWhatsAppBusinessDigits,
  REFERRAL_DISCOUNT_PERCENT,
} from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function generateMemberCode(name: string) {
  const prefix = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GOLD-${prefix}${suffix}`;
}

/** Prefill text for WhatsApp Business deep link: REF-GOLD-XXXX */
export function whatsappRefPrefill(memberCode?: string) {
  if (memberCode) return `REF-${memberCode}`;
  return "REF-JOIN";
}

/**
 * Preferred onboarding URL: wa.me/BUSINESS?text=REF-CODE when WhatsApp number is set.
 * Falls back to web /join or /refer/CODE.
 */
export function joinDeepLink(memberCode?: string) {
  const digits = getWhatsAppBusinessDigits();
  const prefill = whatsappRefPrefill(memberCode);
  if (digits) {
    return `https://wa.me/${digits}?text=${encodeURIComponent(prefill)}`;
  }
  if (memberCode) return `${getAppBaseUrl()}/refer/${memberCode}`;
  return `${getAppBaseUrl()}/join`;
}

export function referralShareMessage(
  practiceName: string,
  memberCode: string,
  referrerFirstName?: string
) {
  const link = joinDeepLink(memberCode);
  const who = referrerFirstName
    ? `${referrerFirstName} invited you`
    : "You're invited";
  return `${who} to ${practiceName}!\n\nReply on WhatsApp with REF-${memberCode} (or tap):\n${link}\n\nGet ${REFERRAL_DISCOUNT_PERCENT}% off your first qualifying treatment — then get your own Gold Card to share.`;
}

export function whatsappShareUrl(text: string, phone?: string) {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function qrImageUrl(data: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
