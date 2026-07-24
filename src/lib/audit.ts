import { prisma } from "@/lib/db";

export async function writeAudit(opts: {
  type: string;
  actorId?: string | null;
  subjectId?: string | null;
  meta?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      type: opts.type,
      actorId: opts.actorId ?? undefined,
      subjectId: opts.subjectId ?? undefined,
      meta: opts.meta ? JSON.stringify(opts.meta) : undefined,
    },
  });
}

/** Strip to digits; map UK leading 0 → 44 for duplicate checks. */
export function normalizePhone(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `44${digits.slice(1)}`;
  if (digits.startsWith("440")) digits = `44${digits.slice(3)}`;
  return digits;
}
