"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createTreatmentCheckout } from "@/lib/payments";
import { sendWhatsApp } from "@/lib/whatsapp";
import { onQualifyingPurchase, releaseMaturedCredits } from "@/lib/rewards";
import { normalizePhone, writeAudit } from "@/lib/audit";
import {
  PRACTICE_NAME,
  REFERRAL_DISCOUNT_PERCENT,
  CREDIT_HOLD_DAYS,
  LEVEL2_OVERRIDE_PERCENT,
  getTier,
  stackDiscounts,
} from "@/lib/constants";
import { generateMemberCode } from "@/lib/utils";

async function getDefaultPractice() {
  const practice = await prisma.practice.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!practice) throw new Error("No practice configured");
  return practice;
}

function formatGbp(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/desk");
  revalidatePath("/join");
  revalidatePath("/leaderboard");
}

export async function enrollMember(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const familyName = String(formData.get("familyName") ?? "").trim();

  if (!name || !phone) {
    return { error: "Name and phone are required" };
  }

  const phoneNormalized = normalizePhone(phone);
  const dup = await prisma.member.findFirst({
    where: { OR: [{ phone }, { phoneNormalized }] },
  });
  if (dup) {
    return { error: "This phone is already registered", memberCode: dup.memberCode };
  }

  const practice = await getDefaultPractice();
  let memberCode = generateMemberCode(name);
  while (await prisma.member.findUnique({ where: { memberCode } })) {
    memberCode = generateMemberCode(name);
  }

  let familyGroupId: string | undefined;
  if (familyName) {
    const group = await prisma.familyGroup.create({
      data: { name: familyName },
    });
    familyGroupId = group.id;
  }

  const member = await prisma.member.create({
    data: {
      practiceId: practice.id,
      familyGroupId,
      name,
      phone,
      phoneNormalized,
      memberCode,
    },
  });

  await writeAudit({
    type: "member.enrolled",
    subjectId: member.id,
    meta: { memberCode, via: "enroll_form" },
  });

  await sendWhatsApp(
    phone,
    `Welcome to ${PRACTICE_NAME} Gold Card!\n\nYour code: ${memberCode}\nShare REF-${memberCode} — friends get ${REFERRAL_DISCOUNT_PERCENT}% off their first qualifying treatment; you earn ${REFERRAL_DISCOUNT_PERCENT}% after they complete it (held ${CREDIT_HOLD_DAYS} days). Level-2 override ${LEVEL2_OVERRIDE_PERCENT}%. No reward for signup alone.`,
    member.id
  );

  revalidateAll();
  return { success: true, memberCode: member.memberCode };
}

export async function enrollViaReferral(formData: FormData) {
  const referrerCode = String(formData.get("referrerCode") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "family").trim();

  if (!referrerCode || !name || !phone) {
    return { error: "All fields are required" };
  }

  const phoneNormalized = normalizePhone(phone);
  const dup = await prisma.member.findFirst({
    where: { OR: [{ phone }, { phoneNormalized }] },
  });
  if (dup) {
    return { error: "This phone is already registered", memberCode: dup.memberCode };
  }

  const referrer = await prisma.member.findUnique({
    where: { memberCode: referrerCode },
    include: {
      familyGroup: true,
      referralsMade: { where: { status: "completed" } },
      practice: true,
    },
  });

  if (!referrer) {
    return { error: "Invalid referral link" };
  }

  let familyGroupId = referrer.familyGroupId;
  if (relationship === "family") {
    if (!familyGroupId) {
      const group = await prisma.familyGroup.create({
        data: {
          name: `${referrer.name.split(" ")[1] ?? referrer.name} Family`,
        },
      });
      await prisma.member.update({
        where: { id: referrer.id },
        data: { familyGroupId: group.id },
      });
      familyGroupId = group.id;
    }
  }

  let memberCode = generateMemberCode(name);
  while (await prisma.member.findUnique({ where: { memberCode } })) {
    memberCode = generateMemberCode(name);
  }

  const member = await prisma.member.create({
    data: {
      practiceId: referrer.practiceId,
      familyGroupId: relationship === "family" ? familyGroupId : undefined,
      name,
      phone,
      phoneNormalized,
      memberCode,
    },
  });

  // Pending until qualifying purchase — no credit at signup.
  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredMemberId: member.id,
      relationship,
      status: "pending",
    },
  });

  const tier = getTier(referrer.referralsMade.length);

  await sendWhatsApp(
    phone,
    `Hi ${name}! Welcome to ${PRACTICE_NAME}.\n\nReferred by ${referrer.name}. Complete a qualifying treatment for ${REFERRAL_DISCOUNT_PERCENT}% off. Your Gold Card: ${memberCode} — share REF-${memberCode} going forward.`,
    member.id
  );

  await sendWhatsApp(
    referrer.phone,
    `${name} joined via your link (${relationship}). You'll earn ${REFERRAL_DISCOUNT_PERCENT}% after their first qualifying treatment (held ${CREDIT_HOLD_DAYS} days).\nTier: ${tier.name}.`,
    referrer.id
  );

  await writeAudit({
    type: "member.referred_signup",
    actorId: referrer.id,
    subjectId: member.id,
    meta: { memberCode, referrerCode },
  });

  revalidateAll();
  revalidatePath(`/member/${referrer.memberCode}`);
  return { success: true, memberCode: member.memberCode };
}

export type BotRegisterInput = {
  name: string;
  email: string;
  phone: string;
  referrerCode?: string;
  relationship?: string;
};

export async function botRegister(input: BotRegisterInput) {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const referrerCode = input.referrerCode?.trim();
  const relationship = (input.relationship ?? "family").trim();

  if (!name || !phone) {
    return { error: "Name and phone are required" };
  }

  const phoneNormalized = normalizePhone(phone);
  const existing = await prisma.member.findFirst({
    where: { OR: [{ phone }, { phoneNormalized }] },
  });
  if (existing) {
    return {
      success: true,
      alreadyMember: true,
      memberCode: existing.memberCode,
      name: existing.name,
    };
  }

  let referrer = null as Awaited<
    ReturnType<typeof prisma.member.findUnique>
  > | null;

  if (referrerCode) {
    referrer = await prisma.member.findUnique({
      where: { memberCode: referrerCode },
    });
    if (!referrer) {
      return { error: "Invalid referral link" };
    }
  }

  const practice = referrer
    ? await prisma.practice.findUnique({ where: { id: referrer.practiceId } })
    : await getDefaultPractice();
  if (!practice) return { error: "No practice configured" };

  let familyGroupId: string | undefined;
  if (referrer && relationship === "family") {
    if (referrer.familyGroupId) {
      familyGroupId = referrer.familyGroupId;
    } else {
      const group = await prisma.familyGroup.create({
        data: {
          name: `${referrer.name.split(" ")[1] ?? referrer.name} Family`,
        },
      });
      await prisma.member.update({
        where: { id: referrer.id },
        data: { familyGroupId: group.id },
      });
      familyGroupId = group.id;
    }
  }

  let memberCode = generateMemberCode(name);
  while (await prisma.member.findUnique({ where: { memberCode } })) {
    memberCode = generateMemberCode(name);
  }

  const member = await prisma.member.create({
    data: {
      practiceId: practice.id,
      familyGroupId,
      name,
      phone,
      phoneNormalized,
      email: email || undefined,
      memberCode,
    },
  });

  await prisma.whatsAppMessage.create({
    data: {
      memberId: member.id,
      phone,
      direction: "inbound",
      body: `[Bot signup] Name: ${name} | Email: ${email || "—"}${
        referrer ? ` | Referred by: ${referrer.name} (${relationship})` : ""
      }`,
    },
  });

  if (referrer) {
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredMemberId: member.id,
        relationship,
        status: "pending",
      },
    });

    await sendWhatsApp(
      phone,
      `Welcome ${name.split(" ")[0]}! You're registered at ${practice.name}.\n\nReferred by ${referrer.name} — book a qualifying treatment for ${REFERRAL_DISCOUNT_PERCENT}% off.\nYour Gold Card: ${memberCode}\nShare REF-${memberCode} with others.`,
      member.id
    );

    await sendWhatsApp(
      referrer.phone,
      `${name} joined via your referral link (${relationship}). You'll earn ${REFERRAL_DISCOUNT_PERCENT}% after their first qualifying treatment (held ${CREDIT_HOLD_DAYS} days).`,
      referrer.id
    );
  } else {
    await sendWhatsApp(
      phone,
      `Welcome ${name.split(" ")[0]}! You're registered at ${practice.name}.\n\nYour Gold Card: ${memberCode}\nShare REF-${memberCode} — friends get ${REFERRAL_DISCOUNT_PERCENT}% on first qualifying treatment; you earn ${REFERRAL_DISCOUNT_PERCENT}% after they complete it. Level-2 override ${LEVEL2_OVERRIDE_PERCENT}%.`,
      member.id
    );
  }

  await writeAudit({
    type: "member.bot_registered",
    subjectId: member.id,
    actorId: referrer?.id,
    meta: { memberCode, referrerCode: referrerCode || null },
  });

  revalidateAll();
  if (referrer) revalidatePath(`/member/${referrer.memberCode}`);

  return {
    success: true,
    alreadyMember: false,
    memberCode: member.memberCode,
    name: member.name,
    referrerName: referrer?.name ?? null,
  };
}

export async function completeVisit(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  const treatmentValue = Number(formData.get("treatmentValue"));
  const applyStoredDiscount = formData.get("applyStoredDiscount") === "on";
  const requestReview = formData.get("requestReview") === "on";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!memberId || !treatmentValue || treatmentValue <= 0) {
    return { error: "Valid member and treatment value required" };
  }

  await releaseMaturedCredits();

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      referredBy: { include: { referrer: true } },
      familyGroup: { include: { members: true } },
      practice: true,
    },
  });

  if (!member) return { error: "Member not found" };

  let friendDiscountPct = 0;
  let storedDiscountPct = 0;
  let discountAmount = 0;
  let redeemedCreditIds: string[] = [];
  const pendingReferral = member.referredBy?.status === "pending";
  const fromReferral = Boolean(member.referredBy);

  // First qualifying visit as a referred friend → 5% welcome on this bill
  if (pendingReferral) {
    friendDiscountPct = REFERRAL_DISCOUNT_PERCENT;
    discountAmount += (treatmentValue * friendDiscountPct) / 100;
  }

  if (applyStoredDiscount) {
    const familyMemberIds = member.familyGroup?.members.map((m) => m.id) ?? [
      member.id,
    ];
    const availableCredits = await prisma.discountCredit.findMany({
      where: {
        memberId: { in: familyMemberIds },
        status: "available",
      },
      orderBy: { percent: "desc" },
    });

    const stacked = stackDiscounts(availableCredits);
    if (stacked.creditIds.length) {
      storedDiscountPct = stacked.percent;
      discountAmount += (treatmentValue * storedDiscountPct) / 100;
      redeemedCreditIds = stacked.creditIds;
    }
  }

  const finalAmount = Math.max(treatmentValue - discountAmount, 0);

  const visit = await prisma.visit.create({
    data: {
      memberId,
      treatmentValue,
      friendDiscountPct,
      storedDiscountPct,
      discountAmount,
      finalAmount,
      fromReferral,
      notes: notes || undefined,
    },
  });

  if (redeemedCreditIds.length) {
    await prisma.discountCredit.updateMany({
      where: { id: { in: redeemedCreditIds }, status: "available" },
      data: {
        status: "redeemed",
        redeemedAt: new Date(),
        redeemedForMemberId: memberId,
        visitId: visit.id,
      },
    });

    await sendWhatsApp(
      member.phone,
      `Your stored ${storedDiscountPct}% family discount was applied. Treatment: ${formatGbp(treatmentValue)} → You pay: ${formatGbp(finalAmount)}`,
      member.id
    );
  }

  // Purchase-gated L1 / L2 rewards (not signup)
  await onQualifyingPurchase({
    memberId,
    visitId: visit.id,
    treatmentValue,
  });

  if (friendDiscountPct > 0) {
    await sendWhatsApp(
      member.phone,
      `Thanks for visiting! Your ${friendDiscountPct}% referral welcome discount was applied. Final: ${formatGbp(finalAmount)}\n\nShare REF-${member.memberCode} to grow your Gold Card.`,
      member.id
    );
  } else if (!redeemedCreditIds.length) {
    await sendWhatsApp(
      member.phone,
      `Visit recorded. Treatment: ${formatGbp(treatmentValue)}. Amount due: ${formatGbp(finalAmount)}`,
      member.id
    );
  }

  if (requestReview) {
    await prisma.reviewRequest.create({
      data: {
        memberId: member.id,
        visitId: visit.id,
        status: "sent",
      },
    });

    await sendWhatsApp(
      member.phone,
      `Thanks for visiting ${member.practice.name}!\n\nIf you were happy with your care, would you leave us a quick Google review?\n${member.practice.googleReviewUrl}\n\nHappy patients help families find great care.`,
      member.id
    );
  }

  revalidateAll();
  revalidatePath(`/member/${member.memberCode}`);
  if (member.referredBy) {
    revalidatePath(`/member/${member.referredBy.referrer.memberCode}`);
  }

  return { success: true, finalAmount };
}

export async function togglePrizeCampaign() {
  const practice = await getDefaultPractice();
  await prisma.practice.update({
    where: { id: practice.id },
    data: { prizeCampaignActive: !practice.prizeCampaignActive },
  });
  revalidateAll();
  return { success: true };
}

export async function toggleDoubleReward() {
  const practice = await getDefaultPractice();
  await prisma.practice.update({
    where: { id: practice.id },
    data: { doubleRewardActive: !practice.doubleRewardActive },
  });
  revalidateAll();
  return { success: true };
}

export async function sendProgressNudge(memberId: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      referralsMade: { where: { status: "completed" } },
      practice: true,
    },
  });
  if (!member) return { error: "Member not found" };

  const tier = getTier(member.referralsMade.length);
  const remaining = tier.nextAt
    ? Math.max(tier.nextAt - member.referralsMade.length, 0)
    : 0;

  const body =
    remaining > 0
      ? `Hi ${member.name.split(" ")[0]}! You're ${remaining} completed referral(s) away from the next Gold Card tier.\n\nShare your link and earn a bigger stored family discount. ${member.practice.prizeCampaignActive ? `This month's prize: ${member.practice.prizeLabel}.` : ""}`
      : `Hi ${member.name.split(" ")[0]}! You're Platinum — top tier. Keep sharing to stay on the monthly leaderboard${member.practice.prizeCampaignActive ? ` for ${member.practice.prizeLabel}` : ""}.`;

  await sendWhatsApp(member.phone, body, member.id);
  revalidateAll();
  return { success: true };
}

export async function getDashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const practice = await getDefaultPractice();

  const [
    memberCount,
    earnedThisMonth,
    redeemedThisMonth,
    referrals,
    members,
    messages,
    reviewsThisMonth,
    referralRevenueAgg,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.discountCredit.count({
      where: {
        earnedAt: { gte: monthStart },
        status: { in: ["available", "redeemed"] },
      },
    }),
    prisma.discountCredit.count({
      where: { redeemedAt: { gte: monthStart }, status: "redeemed" },
    }),
    prisma.referral.findMany({
      include: { referrer: true, referred: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.member.findMany({
      include: {
        discountCredits: { where: { status: "available" } },
        referralsMade: { where: { status: "completed" } },
        referredBy: true,
        familyGroup: true,
        visits: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { member: true },
    }),
    prisma.reviewRequest.count({
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.visit.aggregate({
      where: { fromReferral: true, createdAt: { gte: monthStart } },
      _sum: { treatmentValue: true },
    }),
  ]);

  const leaderboard = members
    .map((m) => ({
      id: m.id,
      name: m.name,
      memberCode: m.memberCode,
      completed: m.referralsMade.length,
      stored: m.discountCredits.length,
      tier: getTier(m.referralsMade.length),
    }))
    .sort((a, b) => b.completed - a.completed);

  const conversionTotal = await prisma.referral.count();
  const conversionCompleted = await prisma.referral.count({
    where: { status: "completed" },
  });

  // All-time counts so the dashboard reflects outstanding value, not just
  // what happened in the current calendar month.
  const storedOutstanding = await prisma.discountCredit.count({
    where: { status: "available" },
  });
  const redeemedTotal = await prisma.discountCredit.count({
    where: { status: "redeemed" },
  });

  const referralRevenue = referralRevenueAgg._sum.treatmentValue ?? 0;

  return {
    practice,
    memberCount,
    earnedThisMonth,
    redeemedThisMonth,
    storedOutstanding,
    redeemedTotal,
    referrals,
    members,
    messages,
    leaderboard,
    topReferrers: leaderboard.slice(0, 5),
    reviewsThisMonth,
    referralRevenue,
    roiMultiple:
      practice.monthlyFee > 0
        ? Math.round((referralRevenue / practice.monthlyFee) * 10) / 10
        : 0,
    conversionRate:
      conversionTotal > 0
        ? Math.round((conversionCompleted / conversionTotal) * 100)
        : 0,
  };
}

export async function getMemberByCode(code: string) {
  await releaseMaturedCredits();
  return prisma.member.findUnique({
    where: { memberCode: code },
    include: {
      practice: true,
      familyGroup: { include: { members: true } },
      discountCredits: { orderBy: { earnedAt: "desc" } },
      referralsMade: {
        include: { referred: true },
        orderBy: { createdAt: "desc" },
      },
      referredBy: { include: { referrer: true } },
      visits: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function getPracticePublic() {
  return getDefaultPractice();
}

/**
 * Start an online card payment for a treatment.
 * Auto-applies available (post-hold) stored family discounts.
 */
export async function startTreatmentPayment(formData: FormData) {
  const memberCode = String(formData.get("memberCode") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!memberCode || !amount || amount <= 0) {
    return { error: "Enter a valid treatment amount." };
  }

  await releaseMaturedCredits();

  const member = await prisma.member.findUnique({
    where: { memberCode },
    include: {
      practice: true,
      familyGroup: { include: { members: true } },
      referredBy: true,
    },
  });
  if (!member) return { error: "Member not found." };

  const familyMemberIds = member.familyGroup?.members.map((m) => m.id) ?? [
    member.id,
  ];
  const availableCredits = await prisma.discountCredit.findMany({
    where: { memberId: { in: familyMemberIds }, status: "available" },
    orderBy: { percent: "desc" },
  });

  const { percent, creditIds } = stackDiscounts(availableCredits);

  // First qualifying visit as referred friend → bake welcome 5% into Stripe amount
  let friendPct = 0;
  if (member.referredBy?.status === "pending") {
    friendPct = REFERRAL_DISCOUNT_PERCENT;
  }

  const totalPct = Math.min(percent + friendPct, 100);
  const discountAmount = Math.round(((amount * totalPct) / 100) * 100) / 100;
  const discounted = Math.round((amount - discountAmount) * 100) / 100;

  const description =
    totalPct > 0
      ? `Treatment at ${member.practice.name} (${totalPct}% Gold Card discount applied)`
      : `Treatment at ${member.practice.name}`;

  const res = await createTreatmentCheckout({
    memberCode,
    description,
    amountGbp: discounted,
    metadata: {
      memberId: member.id,
      treatmentValue: String(amount),
      storedDiscountPct: String(percent),
      friendDiscountPct: String(friendPct),
      discountAmount: String(discountAmount),
      finalAmount: String(discounted),
      creditIds: creditIds.join(","),
    },
  });

  if (res.url) {
    redirect(res.url);
  }
  return { error: res.error ?? "Could not start payment." };
}
