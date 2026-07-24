import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import {
  CREDIT_HOLD_DAYS,
  LEVEL2_OVERRIDE_PERCENT,
  MAX_REFERRALS_PER_MONTH,
  REFERRAL_DISCOUNT_PERCENT,
  getTier,
} from "@/lib/constants";
import { sendWhatsApp } from "@/lib/whatsapp";

function holdUntil(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + CREDIT_HOLD_DAYS);
  return d;
}

/** Flip matured pending credits to available. */
export async function releaseMaturedCredits() {
  const result = await prisma.discountCredit.updateMany({
    where: {
      status: "pending",
      availableAt: { lte: new Date() },
    },
    data: { status: "available" },
  });
  return result.count;
}

async function referralsCompletedThisMonth(referrerId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return prisma.referral.count({
    where: {
      referrerId,
      status: "completed",
      completedAt: { gte: monthStart },
    },
  });
}

/**
 * After a real paid / desk-recorded treatment for `memberId`:
 * - Complete pending referral (if any)
 * - L1: referrer gets 5% held credit (capped per month)
 * - L2: referrer's referrer gets 2% held override (max depth 2)
 * Never rewards signup alone.
 */
export async function onQualifyingPurchase(opts: {
  memberId: string;
  visitId: string;
  treatmentValue: number;
}) {
  await releaseMaturedCredits();

  const member = await prisma.member.findUnique({
    where: { id: opts.memberId },
    include: {
      practice: true,
      referredBy: {
        include: {
          referrer: {
            include: {
              practice: true,
              referredBy: { include: { referrer: true } },
            },
          },
        },
      },
    },
  });

  if (!member?.referredBy) {
    await writeAudit({
      type: "purchase.no_referral",
      subjectId: opts.memberId,
      meta: { visitId: opts.visitId, treatmentValue: opts.treatmentValue },
    });
    return { level1: false, level2: false };
  }

  const referral = member.referredBy;
  const referrer = referral.referrer;
  let level1Granted = false;
  let level2Granted = false;

  // --- Level 1 (direct) ---
  const existingL1 = await prisma.discountCredit.findFirst({
    where: { referralId: referral.id, rewardLevel: 1 },
  });

  if (!existingL1) {
    const monthCount = await referralsCompletedThisMonth(referrer.id);
    if (monthCount >= MAX_REFERRALS_PER_MONTH) {
      await writeAudit({
        type: "reward.blocked_monthly_cap",
        actorId: referrer.id,
        subjectId: member.id,
        meta: {
          monthCount,
          cap: MAX_REFERRALS_PER_MONTH,
          visitId: opts.visitId,
        },
      });
      // Still mark referral completed so they don't retry forever
      if (referral.status === "pending") {
        await prisma.referral.update({
          where: { id: referral.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }
    } else {
      if (referral.status === "pending") {
        await prisma.referral.update({
          where: { id: referral.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }

      const percent = referrer.practice.doubleRewardActive
        ? REFERRAL_DISCOUNT_PERCENT * 2
        : REFERRAL_DISCOUNT_PERCENT;
      const availableAt = holdUntil();

      await prisma.discountCredit.create({
        data: {
          memberId: referrer.id,
          referralId: referral.id,
          rewardLevel: 1,
          percent,
          label: `${percent}% L1 — ${member.name} completed treatment`,
          status: "pending",
          availableAt,
          sourceVisitId: opts.visitId,
        },
      });
      level1Granted = true;

      const completed = await prisma.referral.count({
        where: { referrerId: referrer.id, status: "completed" },
      });
      const tier = getTier(completed);

      await sendWhatsApp(
        referrer.phone,
        `Great news! ${member.name} completed a qualifying treatment.\n\nYou've earned ${percent}% stored on your Gold Card (available in ${CREDIT_HOLD_DAYS} days — return window).\nTier: ${tier.name}. Max depth is 2 levels.`,
        referrer.id
      );

      await writeAudit({
        type: "reward.level1_granted",
        actorId: referrer.id,
        subjectId: member.id,
        meta: {
          percent,
          visitId: opts.visitId,
          availableAt: availableAt.toISOString(),
        },
      });
    }
  } else if (referral.status === "pending") {
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "completed", completedAt: new Date() },
    });
  }

  // --- Level 2 (override only — no level 3+) ---
  const grandReferrer = referrer.referredBy?.referrer;
  if (grandReferrer) {
    const existingL2 = await prisma.discountCredit.findFirst({
      where: { referralId: referral.id, rewardLevel: 2 },
    });
    if (!existingL2) {
      const availableAt = holdUntil();
      await prisma.discountCredit.create({
        data: {
          memberId: grandReferrer.id,
          referralId: referral.id,
          rewardLevel: 2,
          percent: LEVEL2_OVERRIDE_PERCENT,
          label: `${LEVEL2_OVERRIDE_PERCENT}% L2 override — via ${referrer.name} → ${member.name}`,
          status: "pending",
          availableAt,
          sourceVisitId: opts.visitId,
        },
      });
      level2Granted = true;

      await sendWhatsApp(
        grandReferrer.phone,
        `Level-2 update: someone in your network completed treatment.\n\nYou've earned a ${LEVEL2_OVERRIDE_PERCENT}% override on your Gold Card (available in ${CREDIT_HOLD_DAYS} days). Nothing pays beyond level 2.`,
        grandReferrer.id
      );

      await writeAudit({
        type: "reward.level2_granted",
        actorId: grandReferrer.id,
        subjectId: member.id,
        meta: {
          percent: LEVEL2_OVERRIDE_PERCENT,
          viaReferrerId: referrer.id,
          visitId: opts.visitId,
        },
      });
    }
  }

  return { level1: level1Granted, level2: level2Granted };
}
