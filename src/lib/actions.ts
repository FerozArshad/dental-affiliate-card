"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createTreatmentCheckout } from "@/lib/payments";
import {
  PRACTICE_NAME,
  REFERRAL_DISCOUNT_PERCENT,
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

async function sendWhatsApp(phone: string, body: string, memberId?: string) {
  await prisma.whatsAppMessage.create({
    data: { phone, body, memberId, direction: "outbound" },
  });
}

/** Store a % discount on the member's Gold Card (not cash). */
async function grantStoredCredit(opts: {
  memberId: string;
  percent: number;
  label: string;
  referralId?: string;
}) {
  return prisma.discountCredit.create({
    data: {
      memberId: opts.memberId,
      percent: opts.percent,
      label: opts.label,
      status: "available",
      referralId: opts.referralId,
    },
  });
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
      memberCode,
    },
  });

  // Walk-in join → instant 5% stored on their Gold Card
  await grantStoredCredit({
    memberId: member.id,
    percent: REFERRAL_DISCOUNT_PERCENT,
    label: `${REFERRAL_DISCOUNT_PERCENT}% welcome — join bonus`,
  });

  await sendWhatsApp(
    phone,
    `Welcome to ${PRACTICE_NAME} Gold Card!\n\nYour code: ${memberCode}\nYou've got ${REFERRAL_DISCOUNT_PERCENT}% stored on your card — ready for your next treatment.\n\nShare your link: friends get ${REFERRAL_DISCOUNT_PERCENT}% when they join, and you get ${REFERRAL_DISCOUNT_PERCENT}% too (stored — not cash).`,
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
      memberCode,
    },
  });

  const rewardPercent = referrer.practice.doubleRewardActive
    ? REFERRAL_DISCOUNT_PERCENT * 2
    : REFERRAL_DISCOUNT_PERCENT;

  // Reward both sides immediately when friend joins (not after first visit).
  const referral = await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredMemberId: member.id,
      relationship,
      status: "completed",
      completedAt: new Date(),
    },
  });

  await grantStoredCredit({
    memberId: member.id,
    percent: REFERRAL_DISCOUNT_PERCENT,
    label: `${REFERRAL_DISCOUNT_PERCENT}% welcome — joined via ${referrer.name}`,
  });

  await grantStoredCredit({
    memberId: referrer.id,
    percent: rewardPercent,
    label: `${rewardPercent}% for referring ${name}`,
    referralId: referral.id,
  });

  const completedCount = referrer.referralsMade.length + 1;
  const tier = getTier(completedCount);
  const remaining = tier.nextAt
    ? Math.max(tier.nextAt - completedCount, 0)
    : 0;

  await sendWhatsApp(
    phone,
    `Hi ${name}! Welcome to ${PRACTICE_NAME}.\n\nReferred by ${referrer.name} — you've got ${REFERRAL_DISCOUNT_PERCENT}% stored on your Gold Card.\nYour code: ${memberCode}\nShare your own link to earn more.`,
    member.id
  );

  await sendWhatsApp(
    referrer.phone,
    `${name} joined via your link (${relationship})!\n\nYou've earned ${rewardPercent}% stored on your Gold Card.\nTier: ${tier.name}. ${remaining > 0 ? `${remaining} more referral(s) to next tier.` : "You're at the top tier!"}`,
    referrer.id
  );

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

  // Duplicate guard: same phone already a member
  const existing = await prisma.member.findFirst({ where: { phone } });
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

  // Family group handling for referrals
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
      email: email || undefined,
      memberCode,
    },
  });

  // Log the inbound "bot" conversation
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
    const practiceWithFlags = await prisma.practice.findUnique({
      where: { id: referrer.practiceId },
    });
    const rewardPercent = practiceWithFlags?.doubleRewardActive
      ? REFERRAL_DISCOUNT_PERCENT * 2
      : REFERRAL_DISCOUNT_PERCENT;

    // Friend joins → both get 5% stored immediately.
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredMemberId: member.id,
        relationship,
        status: "completed",
        completedAt: new Date(),
      },
    });

    await grantStoredCredit({
      memberId: member.id,
      percent: REFERRAL_DISCOUNT_PERCENT,
      label: `${REFERRAL_DISCOUNT_PERCENT}% welcome — joined via ${referrer.name}`,
    });

    await grantStoredCredit({
      memberId: referrer.id,
      percent: rewardPercent,
      label: `${rewardPercent}% for referring ${name}`,
      referralId: referral.id,
    });

    const completedCount = await prisma.referral.count({
      where: { referrerId: referrer.id, status: "completed" },
    });
    const tier = getTier(completedCount);

    await sendWhatsApp(
      phone,
      `Welcome ${name.split(" ")[0]}! You're registered at ${practice.name}.\n\nReferred by ${referrer.name} — you've got ${REFERRAL_DISCOUNT_PERCENT}% stored on your Gold Card.\nYour code: ${memberCode}\nShare your own link to earn more.`,
      member.id
    );

    await sendWhatsApp(
      referrer.phone,
      `${name} just joined via your referral link (${relationship})!\n\nYou've earned ${rewardPercent}% stored on your Gold Card.\nTier: ${tier.name}.`,
      referrer.id
    );
  } else {
    // Walk-in scan → instant 5% welcome credit
    await grantStoredCredit({
      memberId: member.id,
      percent: REFERRAL_DISCOUNT_PERCENT,
      label: `${REFERRAL_DISCOUNT_PERCENT}% welcome — join bonus`,
    });

    await sendWhatsApp(
      phone,
      `Welcome ${name.split(" ")[0]}! You're registered at ${practice.name}.\n\nYour Gold Card: ${memberCode}\nYou've got ${REFERRAL_DISCOUNT_PERCENT}% stored — ready to use.\nShare your link: friends get ${REFERRAL_DISCOUNT_PERCENT}% when they join, and you get ${REFERRAL_DISCOUNT_PERCENT}% too.`,
      member.id
    );
  }

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
  // Legacy: older referrals stayed "pending" until first visit.
  const pendingReferral = member.referredBy?.status === "pending";
  const fromReferral = Boolean(member.referredBy);

  // Discounts now live as stored credits from signup — apply those (no extra
  // free 5% on top, which would double-reward referred friends).
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

  // Legacy path only: if an old pending referral never got join credits,
  // still give the friend their one-time 5% at this visit.
  if (pendingReferral && storedDiscountPct === 0) {
    friendDiscountPct = REFERRAL_DISCOUNT_PERCENT;
    discountAmount += (treatmentValue * friendDiscountPct) / 100;
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

    const stackNote =
      redeemedCreditIds.length > 1
        ? ` (${redeemedCreditIds.length} stored discounts combined)`
        : "";
    await sendWhatsApp(
      member.phone,
      `Your stored ${storedDiscountPct}% family discount was applied${stackNote}. Treatment: ${formatGbp(treatmentValue)} → You pay: ${formatGbp(finalAmount)}`,
      member.id
    );
  }

  if (pendingReferral && member.referredBy) {
    const referral = member.referredBy;

    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "completed", completedAt: new Date() },
    });

    // Only grant referrer credit if this legacy referral never got one at join.
    const existingReward = await prisma.discountCredit.findUnique({
      where: { referralId: referral.id },
    });

    if (!existingReward) {
      const referrerCompleted = await prisma.referral.count({
        where: { referrerId: referral.referrerId, status: "completed" },
      });
      const tier = getTier(referrerCompleted);
      const rewardPercent = member.practice.doubleRewardActive
        ? REFERRAL_DISCOUNT_PERCENT * 2
        : REFERRAL_DISCOUNT_PERCENT;

      await grantStoredCredit({
        memberId: referral.referrerId,
        percent: rewardPercent,
        label: `${rewardPercent}% for referring ${member.name}`,
        referralId: referral.id,
      });

      const nextTierHint = tier.nextAt
        ? ` ${Math.max(tier.nextAt - referrerCompleted, 0)} more referral(s) to next tier.`
        : " Platinum unlocked!";

      await sendWhatsApp(
        referral.referrer.phone,
        `Great news! ${member.name} completed their first visit.\n\nYou've earned ${rewardPercent}% stored on your Gold Card.\nTier: ${tier.name}.${nextTierHint}`,
        referral.referrerId
      );
    }

    if (friendDiscountPct > 0) {
      await sendWhatsApp(
        member.phone,
        `Thanks for visiting! Your ${friendDiscountPct}% referral welcome discount was applied. Final amount: ${formatGbp(finalAmount)}\n\nOpen your Gold Card to refer others and earn more stored discounts.`,
        member.id
      );
    }
  } else if (!redeemedCreditIds.length && friendDiscountPct === 0) {
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
 * Auto-applies the member's best available stored family discount to the
 * amount, then opens Stripe Checkout for the discounted total.
 */
export async function startTreatmentPayment(formData: FormData) {
  const memberCode = String(formData.get("memberCode") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!memberCode || !amount || amount <= 0) {
    return { error: "Enter a valid treatment amount." };
  }

  const member = await prisma.member.findUnique({
    where: { memberCode },
    include: {
      practice: true,
      familyGroup: { include: { members: true } },
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

  // Stack the member's stored discounts into one combined discount (capped).
  const { percent, creditIds } = stackDiscounts(availableCredits);
  const discountAmount = Math.round(((amount * percent) / 100) * 100) / 100;
  const discounted = Math.round((amount - discountAmount) * 100) / 100;

  const description =
    percent > 0
      ? `Treatment at ${member.practice.name} (${percent}% Gold Card discount applied)`
      : `Treatment at ${member.practice.name}`;

  const res = await createTreatmentCheckout({
    memberCode,
    description,
    amountGbp: discounted,
    metadata: {
      memberId: member.id,
      treatmentValue: String(amount),
      storedDiscountPct: String(percent),
      discountAmount: String(discountAmount),
      finalAmount: String(discounted),
      // Comma-separated list of the credits consumed by this payment.
      creditIds: creditIds.join(","),
    },
  });

  if (res.url) {
    redirect(res.url);
  }
  return { error: res.error ?? "Could not start payment." };
}
