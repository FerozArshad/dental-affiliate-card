import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getAppBaseUrl } from "@/lib/constants";

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

export function referralShareMessage(
  practiceName: string,
  memberCode: string,
  referrerFirstName?: string
) {
  const link = `${getAppBaseUrl()}/refer/${memberCode}`;
  const who = referrerFirstName ? `${referrerFirstName} invited you` : "You're invited";
  return `${who} to ${practiceName}!\n\nGet 5% off your treatment with my Gold Card link:\n${link}\n\nYou'll also get your own card to share with family.`;
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
