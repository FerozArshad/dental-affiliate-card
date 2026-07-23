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

  // ---- Pilot clinic 1: Glasgow, Bridge St ----
  const glasgow = await prisma.practice.create({
    data: {
      name: "Dental Scotland Glasgow, Bridge St",
      slug: "glasgow-bridge-st",
      phone: "0141 255 1115",
      monthlyFee: 0,
      prizeCampaignActive: false,
      prizeLabel: "Free hygiene clean",
      doubleRewardActive: false,
      googleReviewUrl: "https://g.page/r/dental-scotland-bridge-st/review",
    },
  });

  // ---- Pilot clinic 2: Falkirk ----
  const falkirk = await prisma.practice.create({
    data: {
      name: "Dental Scotland Falkirk",
      slug: "falkirk",
      phone: "01324 622338",
      monthlyFee: 0,
      prizeCampaignActive: false,
      prizeLabel: "Free hygiene clean",
      doubleRewardActive: false,
      googleReviewUrl: "https://g.page/r/dental-scotland-falkirk/review",
    },
  });

  // ===== Glasgow members =====
  const smithFamily = await prisma.familyGroup.create({
    data: { name: "Smith Family" },
  });
  const jonesFamily = await prisma.familyGroup.create({
    data: { name: "Jones Family" },
  });

  const sarah = await prisma.member.create({
    data: {
      practiceId: glasgow.id,
      familyGroupId: smithFamily.id,
      name: "Sarah Smith",
      phone: "+44 7700 900123",
      email: "sarah.smith@example.com",
      memberCode: "GOLD-SMITH1",
      memberSince: new Date("2025-11-15"),
    },
  });

  const tom = await prisma.member.create({
    data: {
      practiceId: glasgow.id,
      familyGroupId: smithFamily.id,
      name: "Tom Smith",
      phone: "+44 7700 900124",
      email: "tom.smith@example.com",
      memberCode: "GOLD-SMITH2",
      memberSince: new Date("2025-12-01"),
    },
  });

  const emma = await prisma.member.create({
    data: {
      practiceId: glasgow.id,
      familyGroupId: jonesFamily.id,
      name: "Emma Jones",
      phone: "+44 7700 900456",
      email: "emma.jones@example.com",
      memberCode: "GOLD-JONES1",
      memberSince: new Date("2026-01-10"),
    },
  });

  const lucy = await prisma.member.create({
    data: {
      practiceId: glasgow.id,
      familyGroupId: jonesFamily.id,
      name: "Lucy Jones",
      phone: "+44 7700 900457",
      email: "lucy.jones@example.com",
      memberCode: "GOLD-JONES2",
      memberSince: new Date("2026-02-20"),
    },
  });

  const mark = await prisma.member.create({
    data: {
      practiceId: glasgow.id,
      name: "Mark Wilson",
      phone: "+44 7700 900789",
      email: "mark.wilson@example.com",
      memberCode: "GOLD-WILS01",
      memberSince: new Date("2026-03-01"),
    },
  });

  // ===== Falkirk members =====
  const patelFamily = await prisma.familyGroup.create({
    data: { name: "Patel Family" },
  });

  const nina = await prisma.member.create({
    data: {
      practiceId: falkirk.id,
      familyGroupId: patelFamily.id,
      name: "Nina Patel",
      phone: "+44 7700 900790",
      email: "nina.patel@example.com",
      memberCode: "GOLD-PATEL1",
      memberSince: new Date("2026-03-05"),
    },
  });

  const ben = await prisma.member.create({
    data: {
      practiceId: falkirk.id,
      familyGroupId: patelFamily.id,
      name: "Ben Patel",
      phone: "+44 7700 900791",
      email: "ben.patel@example.com",
      memberCode: "GOLD-PATEL2",
      memberSince: new Date("2026-03-18"),
    },
  });

  // ===== Referrals (Glasgow) =====
  const refLucy = await prisma.referral.create({
    data: {
      referrerId: emma.id,
      referredMemberId: lucy.id,
      relationship: "family",
      status: "completed",
      completedAt: new Date("2026-02-22"),
    },
  });

  const refMark = await prisma.referral.create({
    data: {
      referrerId: emma.id,
      referredMemberId: mark.id,
      relationship: "friend",
      status: "completed",
      completedAt: new Date("2026-03-04"),
    },
  });

  // ===== Referrals (Falkirk) =====
  await prisma.referral.create({
    data: {
      referrerId: nina.id,
      referredMemberId: ben.id,
      relationship: "family",
      status: "pending",
    },
  });

  // ===== Visits =====
  await prisma.visit.create({
    data: {
      memberId: lucy.id,
      treatmentValue: 180,
      friendDiscountPct: 5,
      discountAmount: 9,
      finalAmount: 171,
      fromReferral: true,
      notes: "Hygiene visit — referral welcome discount",
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
      notes: "Composite bonding — referred by Emma",
    },
  });

  // ===== Stored discounts for Emma (Gold tier) =====
  await prisma.discountCredit.create({
    data: {
      memberId: emma.id,
      referralId: refLucy.id,
      percent: 5,
      label: "5% off next family treatment",
      status: "available",
      earnedAt: new Date("2026-02-22"),
    },
  });

  await prisma.discountCredit.create({
    data: {
      memberId: emma.id,
      referralId: refMark.id,
      percent: 7,
      label: "7% off next family treatment",
      status: "available",
      earnedAt: new Date("2026-03-04"),
    },
  });

  // ===== Sample WhatsApp log =====
  await prisma.whatsAppMessage.createMany({
    data: [
      {
        memberId: sarah.id,
        phone: sarah.phone,
        body: "Welcome to the Dental Scotland Gold Card! Your code is GOLD-SMITH1. Refer family & friends — they get 5% off, you earn stored % off your family's next treatment (credit, not cash).",
      },
      {
        memberId: emma.id,
        phone: emma.phone,
        body: "Great news Emma! You've reached Gold tier with 2 successful referrals. You now earn 7% off your family's next treatment.",
      },
      {
        memberId: nina.id,
        phone: nina.phone,
        body: "Welcome to Dental Scotland Falkirk, Nina! Share your Gold Card link with family for 5% off their treatment.",
      },
    ],
  });

  console.log("Seed complete:");
  console.log(`  Clinics: ${glasgow.name} | ${falkirk.name}`);
  console.log(
    "  Glasgow: GOLD-SMITH1, GOLD-SMITH2, GOLD-JONES1, GOLD-JONES2, GOLD-WILS01"
  );
  console.log("  Falkirk: GOLD-PATEL1, GOLD-PATEL2");
  console.log("  Emma Jones = Gold tier (2 referrals), 2 stored discounts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
