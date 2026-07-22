import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  await prisma.reviewRequest.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.discountCredit.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.member.deleteMany();
  await prisma.familyGroup.deleteMany();
  await prisma.practice.deleteMany();

  const practice = await prisma.practice.create({
    data: {
      name: "Storm Dental Studio",
      slug: "storm-dental",
      phone: "+44 20 7946 0958",
      monthlyFee: 199,
      prizeCampaignActive: true,
      prizeLabel: "Free hygiene clean",
      doubleRewardActive: false,
      googleReviewUrl: "https://g.page/r/demo-review",
    },
  });

  const smithFamily = await prisma.familyGroup.create({
    data: { name: "Smith Family" },
  });

  const jonesFamily = await prisma.familyGroup.create({
    data: { name: "Jones Family" },
  });

  const sarah = await prisma.member.create({
    data: {
      practiceId: practice.id,
      familyGroupId: smithFamily.id,
      name: "Sarah Smith",
      phone: "+44 7700 900123",
      memberCode: "GOLD-SMITH1",
      memberSince: new Date("2025-11-15"),
    },
  });

  const tom = await prisma.member.create({
    data: {
      practiceId: practice.id,
      familyGroupId: smithFamily.id,
      name: "Tom Smith",
      phone: "+44 7700 900124",
      memberCode: "GOLD-SMITH2",
      memberSince: new Date("2025-12-01"),
    },
  });

  const emma = await prisma.member.create({
    data: {
      practiceId: practice.id,
      familyGroupId: jonesFamily.id,
      name: "Emma Jones",
      phone: "+44 7700 900456",
      memberCode: "GOLD-JONES1",
      memberSince: new Date("2026-01-10"),
    },
  });

  const lucy = await prisma.member.create({
    data: {
      practiceId: practice.id,
      familyGroupId: jonesFamily.id,
      name: "Lucy Jones",
      phone: "+44 7700 900457",
      memberCode: "GOLD-JONES2",
      memberSince: new Date("2026-02-20"),
    },
  });

  const mark = await prisma.member.create({
    data: {
      practiceId: practice.id,
      name: "Mark Patel",
      phone: "+44 7700 900789",
      memberCode: "GOLD-PATEL1",
      memberSince: new Date("2026-03-01"),
    },
  });

  const nina = await prisma.member.create({
    data: {
      practiceId: practice.id,
      name: "Nina Patel",
      phone: "+44 7700 900790",
      memberCode: "GOLD-PATEL2",
      memberSince: new Date("2026-03-15"),
    },
  });

  const referral1 = await prisma.referral.create({
    data: {
      referrerId: emma.id,
      referredMemberId: lucy.id,
      relationship: "family",
      status: "completed",
      completedAt: new Date("2026-02-22"),
    },
  });

  const referral2 = await prisma.referral.create({
    data: {
      referrerId: emma.id,
      referredMemberId: mark.id,
      relationship: "friend",
      status: "completed",
      completedAt: new Date("2026-03-20"),
    },
  });

  await prisma.referral.create({
    data: {
      referrerId: mark.id,
      referredMemberId: nina.id,
      relationship: "family",
      status: "pending",
    },
  });

  await prisma.visit.create({
    data: {
      memberId: lucy.id,
      treatmentValue: 180,
      friendDiscountPct: 5,
      discountAmount: 9,
      finalAmount: 171,
      fromReferral: true,
      notes: "Hygiene visit — friend referral discount applied",
    },
  });

  await prisma.visit.create({
    data: {
      memberId: mark.id,
      treatmentValue: 420,
      friendDiscountPct: 5,
      discountAmount: 21,
      finalAmount: 399,
      fromReferral: true,
      notes: "Whitening — referred by Emma",
    },
  });

  await prisma.discountCredit.create({
    data: {
      memberId: emma.id,
      referralId: referral1.id,
      percent: 5,
      label: "5% off next family treatment",
      status: "available",
      earnedAt: new Date("2026-02-22"),
    },
  });

  await prisma.discountCredit.create({
    data: {
      memberId: emma.id,
      referralId: referral2.id,
      percent: 7,
      label: "7% off next family treatment",
      status: "available",
      earnedAt: new Date("2026-03-20"),
    },
  });

  await prisma.whatsAppMessage.createMany({
    data: [
      {
        memberId: sarah.id,
        phone: sarah.phone,
        body: "Welcome to Storm Dental Gold Card! Your member code is GOLD-SMITH1. Refer family & friends — they get 5% off, you earn stored % off next family treatment.",
      },
      {
        memberId: emma.id,
        phone: emma.phone,
        body: "Great news Emma! You've reached Gold tier (2 referrals). Climb the leaderboard this month for a free hygiene clean.",
      },
      {
        memberId: lucy.id,
        phone: lucy.phone,
        body: "Thanks for visiting! Your 5% referral welcome discount was applied. Final amount: £171.00",
      },
    ],
  });

  console.log("Seed complete:");
  console.log(`  Practice: ${practice.name}`);
  console.log(
    `  Members: ${[sarah, tom, emma, lucy, mark, nina].map((m) => m.memberCode).join(", ")}`
  );
  console.log("  Emma is Gold tier (2 completed referrals) — top of leaderboard");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
