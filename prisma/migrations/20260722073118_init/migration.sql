-- CreateTable
CREATE TABLE "Practice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FamilyGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceId" TEXT NOT NULL,
    "familyGroupId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "memberCode" TEXT NOT NULL,
    "memberSince" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "optedIn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Member_familyGroupId_fkey" FOREIGN KEY ("familyGroupId") REFERENCES "FamilyGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "referredMemberId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'family',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Referral_referredMemberId_fkey" FOREIGN KEY ("referredMemberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscountCredit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "referralId" TEXT,
    "percent" INTEGER NOT NULL DEFAULT 5,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" DATETIME,
    "redeemedForMemberId" TEXT,
    "visitId" TEXT,
    CONSTRAINT "DiscountCredit_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DiscountCredit_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DiscountCredit_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "treatmentValue" REAL NOT NULL,
    "friendDiscountPct" INTEGER NOT NULL DEFAULT 0,
    "storedDiscountPct" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "finalAmount" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visit_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT,
    "phone" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'outbound',
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsAppMessage_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Practice_slug_key" ON "Practice"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberCode_key" ON "Member"("memberCode");

-- CreateIndex
CREATE INDEX "Member_practiceId_idx" ON "Member"("practiceId");

-- CreateIndex
CREATE INDEX "Member_familyGroupId_idx" ON "Member"("familyGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredMemberId_key" ON "Referral"("referredMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCredit_referralId_key" ON "DiscountCredit"("referralId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCredit_visitId_key" ON "DiscountCredit"("visitId");

-- CreateIndex
CREATE INDEX "DiscountCredit_memberId_status_idx" ON "DiscountCredit"("memberId", "status");

-- CreateIndex
CREATE INDEX "Visit_memberId_idx" ON "Visit"("memberId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_memberId_idx" ON "WhatsAppMessage"("memberId");
