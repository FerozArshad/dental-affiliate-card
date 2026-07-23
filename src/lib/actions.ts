"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  DISCOUNT_LABEL,
  PRACTICE_NAME,
  REFERRAL_DISCOUNT_PERCENT,
  getTier,
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

  await sendWhatsApp(
    phone,
    `Welcome to ${PRACTICE_NAME} Gold Card!\n\nYour code: ${memberCode}\nTier: Silver (5% stored rewards)\n\nRefer family & friends — they get ${REFERRAL_DISCOUNT_PERCENT}% off. You earn stored % off your family's next treatment (not cash).`,
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

  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredMemberId: member.id,
      relationship,
      status: "pending",
    },
  });

  const tier = getTier(referrer.referralsMade.length);
  const remaining = tier.nextAt
    ? Math.max(tier.nextAt - referrer.referralsMade.length, 0)
    : 0;

  await sendWhatsApp(
    phone,
    `Hi ${name}! Welcome to ${PRACTICE_NAME}.\n\nYou were referred by ${referrer.name}. Book your visit and get ${REFERRAL_DISCOUNT_PERCENT}% off today.\n\nYour Gold Card: ${memberCode}\nYou can refer others with your own link too.`,
    member.id
  );

  await sendWhatsApp(
    referrer.phone,
    `${name} joined via your link (${relationship}). When they complete their first visit, you earn a stored family discount.\n\nYour tier: ${tier.name}. ${remaining > 0 ? `${remaining} more completed referral(s) to reach the next tier.` : "You're at the top tier!"}`,
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
      `Welcome ${name.split(" ")[0]}! You're registered at ${practice.name}.\n\nReferred by ${referrer.name} — you get ${REFERRAL_DISCOUNT_PERCENT}% off your first visit.\nYour Gold Card: ${memberCode}\n\nYou can refer others with your own link too.`,
      member.id
    );

    await sendWhatsApp(
      referrer.phone,
      `${name} just joined via your referral link (${relationship}). When they complete their first visit, you'll earn a stored family discount.`,
      referrer.id
    );
  } else {
    await sendWhatsApp(
      phone,
      `Welcome ${name.split(" ")[0]}! You're registered at ${practice.name}.\n\nYour Gold Card: ${memberCode}\nRefer family & friends — they get ${REFERRAL_DISCOUNT_PERCENT}% off, you earn stored % off your family's next treatment (not cash).`,
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
  let redeemedCreditId: string | undefined;
  const fromReferral = member.referredBy?.status === "pending";

  if (fromReferral) {
    friendDiscountPct = REFERRAL_DISCOUNT_PERCENT;
    discountAmount += (treatmentValue * friendDiscountPct) / 100;
  }

  if (applyStoredDiscount) {
    const familyMemberIds = member.familyGroup?.members.map((m) => m.id) ?? [
      member.id,
    ];
    const credit = await prisma.discountCredit.findFirst({
      where: {
        memberId: { in: familyMemberIds },
        status: "available",
      },
      orderBy: { earnedAt: "asc" },
    });

    if (credit) {
      storedDiscountPct = credit.percent;
      discountAmount += (treatmentValue * storedDiscountPct) / 100;
      redeemedCreditId = credit.id;
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

  if (redeemedCreditId) {
    await prisma.discountCredit.update({
      where: { id: redeemedCreditId },
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

  if (fromReferral && member.referredBy) {
    const referral = member.referredBy;
    const referrerCompleted = await prisma.referral.count({
      where: { referrerId: referral.referrerId, status: "completed" },
    });
    const tier = getTier(referrerCompleted + 1);
    const rewardPercent = member.practice.doubleRewardActive
      ? tier.cashbackPercent * 2
      : tier.cashbackPercent;

    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "completed", completedAt: new Date() },
    });

    await prisma.discountCredit.create({
      data: {
        memberId: referral.referrerId,
        referralId: referral.id,
        percent: rewardPercent,
        label: `${rewardPercent}% off next family treatment`,
        status: "available",
      },
    });

    await sendWhatsApp(
      member.phone,
      `Thanks for visiting! Your ${friendDiscountPct}% referral welcome discount was applied. Final amount: ${formatGbp(finalAmount)}\n\nOpen your Gold Card to refer others and earn your own stored discounts.`,
      member.id
    );

    const nextTierHint = tier.nextAt
      ? ` ${Math.max(tier.nextAt - (referrerCompleted + 1), 0)} more referral(s) to next tier.`
      : " Platinum unlocked!";

    await sendWhatsApp(
      referral.referrer.phone,
      `Great news! ${member.name} completed their visit.\n\nYou've earned ${rewardPercent}% off your family's next treatment (stored — not cash).\nTier: ${tier.name}.${nextTierHint}${
        member.practice.prizeCampaignActive
          ? `\n\nMonthly prize: ${member.practice.prizeLabel} — climb the leaderboard!`
          : ""
      }`,
      referral.referrerId
    );
  } else if (!redeemedCreditId) {
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

  const referralRevenue = referralRevenueAgg._sum.treatmentValue ?? 0;

  return {
    practice,
    memberCount,
    earnedThisMonth,
    redeemedThisMonth,
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
