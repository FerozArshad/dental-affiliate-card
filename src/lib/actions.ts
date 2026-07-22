"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  DISCOUNT_LABEL,
  PRACTICE_NAME,
  REFERRAL_DISCOUNT_PERCENT,
} from "@/lib/constants";
import { generateMemberCode } from "@/lib/utils";

async function getDefaultPractice() {
  const practice = await prisma.practice.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!practice) throw new Error("No practice configured");
  return practice;
}

async function sendWhatsApp(
  phone: string,
  body: string,
  memberId?: string
) {
  await prisma.whatsAppMessage.create({
    data: { phone, body, memberId, direction: "outbound" },
  });
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
    `Welcome to ${PRACTICE_NAME} Gold Card!\n\nYour code: ${memberCode}\n\nRefer family & friends — they get ${REFERRAL_DISCOUNT_PERCENT}% off their visit. You earn ${REFERRAL_DISCOUNT_PERCENT}% off your family's next treatment (stored on your card, not cash).`,
    member.id
  );

  revalidatePath("/dashboard");
  revalidatePath("/");
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
    include: { familyGroup: true },
  });

  if (!referrer) {
    return { error: "Invalid referral link" };
  }

  let familyGroupId = referrer.familyGroupId;
  if (!familyGroupId) {
    const group = await prisma.familyGroup.create({
      data: { name: `${referrer.name.split(" ")[1] ?? referrer.name} Family` },
    });
    await prisma.member.update({
      where: { id: referrer.id },
      data: { familyGroupId: group.id },
    });
    familyGroupId = group.id;
  }

  let memberCode = generateMemberCode(name);
  while (await prisma.member.findUnique({ where: { memberCode } })) {
    memberCode = generateMemberCode(name);
  }

  const member = await prisma.member.create({
    data: {
      practiceId: referrer.practiceId,
      familyGroupId,
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

  await sendWhatsApp(
    phone,
    `Hi ${name}! Welcome to ${PRACTICE_NAME}.\n\nYou were referred by ${referrer.name}. Book your visit and get ${REFERRAL_DISCOUNT_PERCENT}% off your treatment today.\n\nYour member code: ${memberCode}`,
    member.id
  );

  await sendWhatsApp(
    referrer.phone,
    `${name} joined using your referral link (${relationship}). When they complete their first visit, you'll earn ${REFERRAL_DISCOUNT_PERCENT}% off your family's next treatment.`,
    referrer.id
  );

  revalidatePath("/dashboard");
  revalidatePath(`/member/${referrer.memberCode}`);
  return { success: true, memberCode: member.memberCode };
}

export async function completeVisit(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  const treatmentValue = Number(formData.get("treatmentValue"));
  const applyStoredDiscount = formData.get("applyStoredDiscount") === "on";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!memberId || !treatmentValue || treatmentValue <= 0) {
    return { error: "Valid member and treatment value required" };
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      referredBy: { include: { referrer: true } },
      familyGroup: { include: { members: true } },
    },
  });

  if (!member) return { error: "Member not found" };

  let friendDiscountPct = 0;
  let storedDiscountPct = 0;
  let discountAmount = 0;
  let redeemedCreditId: string | undefined;

  if (member.referredBy?.status === "pending") {
    friendDiscountPct = REFERRAL_DISCOUNT_PERCENT;
    discountAmount += (treatmentValue * friendDiscountPct) / 100;
  }

  if (applyStoredDiscount && member.familyGroupId) {
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

  if (member.referredBy?.status === "pending") {
    const referral = member.referredBy;
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "completed", completedAt: new Date() },
    });

    await prisma.discountCredit.create({
      data: {
        memberId: referral.referrerId,
        referralId: referral.id,
        percent: REFERRAL_DISCOUNT_PERCENT,
        label: DISCOUNT_LABEL,
        status: "available",
      },
    });

    await sendWhatsApp(
      member.phone,
      `Thanks for visiting! Your ${friendDiscountPct}% referral welcome discount was applied. Final amount: ${formatGbp(finalAmount)}`,
      member.id
    );

    await sendWhatsApp(
      referral.referrer.phone,
      `Great news! ${member.name} completed their visit.\n\nYou've earned ${REFERRAL_DISCOUNT_PERCENT}% off your family's next treatment — stored on your Gold Card (not cash). Tap your card to view.`,
      referral.referrerId
    );
  } else if (!redeemedCreditId) {
    await sendWhatsApp(
      member.phone,
      `Visit recorded. Treatment: ${formatGbp(treatmentValue)}. Amount due: ${formatGbp(finalAmount)}`,
      member.id
    );
  }

  revalidatePath("/dashboard");
  revalidatePath(`/member/${member.memberCode}`);
  if (member.referredBy) {
    revalidatePath(`/member/${member.referredBy.referrer.memberCode}`);
  }

  return { success: true, finalAmount };
}

function formatGbp(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export async function getDashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [memberCount, earnedThisMonth, redeemedThisMonth, referrals, members, messages] =
    await Promise.all([
      prisma.member.count(),
      prisma.discountCredit.count({
        where: { earnedAt: { gte: monthStart }, status: { in: ["available", "redeemed"] } },
      }),
      prisma.discountCredit.count({
        where: { redeemedAt: { gte: monthStart }, status: "redeemed" },
      }),
      prisma.referral.findMany({
        include: {
          referrer: true,
          referred: true,
        },
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
    ]);

  const allMembersForRanking = await prisma.member.findMany({
    include: {
      referralsMade: { where: { status: "completed" } },
      discountCredits: { where: { status: "available" } },
    },
  });

  const topReferrers = allMembersForRanking
    .sort((a, b) => b.referralsMade.length - a.referralsMade.length)
    .slice(0, 5);

  const conversionTotal = await prisma.referral.count();
  const conversionCompleted = await prisma.referral.count({
    where: { status: "completed" },
  });

  return {
    memberCount,
    earnedThisMonth,
    redeemedThisMonth,
    referrals,
    members,
    messages,
    topReferrers,
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
