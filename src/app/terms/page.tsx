import type { Metadata } from "next";
import { LegalLayout, Section } from "@/components/legal-layout";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service — Dental Scotland Gold Card",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="23 July 2026">
      <p>
        These Terms govern your participation in the Dental Scotland Gold Card
        loyalty and referral programme (the &quot;Programme&quot;) operated by{" "}
        {BRAND.company}. By joining, you agree to these Terms.
      </p>

      <Section heading="1. Membership">
        <p>
          Membership is free and open to patients aged 18+ who provide valid
          contact details and opt in to Programme messages. Each member receives
          a unique member code and referral link.
        </p>
      </Section>

      <Section heading="2. How rewards work">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            When you refer someone and they complete a qualifying treatment,
            they receive a 5% welcome discount on that treatment.
          </li>
          <li>
            You then earn a stored discount (5% by default, higher at Gold/
            Platinum tiers) toward your family&apos;s next treatment.
          </li>
          <li>
            Rewards are <strong>credit toward future treatment only</strong> and
            hold no cash value. They cannot be exchanged for cash.
          </li>
          <li>
            Stored discounts may be used by members of the same family group at
            the practice&apos;s discretion.
          </li>
        </ul>
      </Section>

      <Section heading="3. Redemption">
        <p>
          Stored discounts are applied at the front desk against eligible
          treatment. Discounts cannot be combined with certain offers where
          stated, and are subject to availability and clinical suitability.
        </p>
      </Section>

      <Section heading="4. Healthcare & advertising compliance">
        <p>
          Nothing in the Programme constitutes an inducement to undergo
          unnecessary treatment. All treatment decisions are made on clinical
          grounds by your dentist. The Programme is operated in line with
          General Dental Council (GDC) guidance and Advertising Standards
          Authority (ASA) rules.
        </p>
      </Section>

      <Section heading="5. Fair use & fraud">
        <p>
          We may suspend or cancel membership and forfeit rewards in cases of
          fraud, abuse, self-referral, or creation of fake accounts. Referrals
          must be genuine.
        </p>
      </Section>

      <Section heading="6. Payments">
        <p>
          Where you pay for treatment through the Programme, payments are
          processed by Stripe and/or WhatsApp. You agree to the applicable
          processor terms.
        </p>
      </Section>

      <Section heading="7. Changes & termination">
        <p>
          We may amend or end the Programme, or change reward levels, with
          reasonable notice. Accrued stored discounts will be honoured for a
          reasonable period following any change.
        </p>
      </Section>

      <Section heading="8. Liability">
        <p>
          Nothing in these Terms excludes liability that cannot be excluded
          under law. To the extent permitted, our liability in relation to the
          Programme is limited to the value of stored discounts affected.
        </p>
      </Section>

      <Section heading="9. Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a className="text-teal-300" href={`mailto:${BRAND.supportEmail}`}>
            {BRAND.supportEmail}
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
