import type { Metadata } from "next";
import { LegalLayout, Section } from "@/components/legal-layout";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy — Dental Scotland Gold Card",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="23 July 2026">
      <p>
        This Privacy Policy explains how {BRAND.company} (&quot;we&quot;,
        &quot;us&quot;, &quot;our&quot;) collects, uses, and protects your
        personal data when you use the Dental Scotland Gold Card loyalty and
        referral programme (the &quot;Programme&quot;). We are committed to
        protecting your privacy in accordance with the UK General Data Protection
        Regulation (UK GDPR) and the Data Protection Act 2018.
      </p>

      <Section heading="1. Who we are (Data Controller)">
        <p>
          {BRAND.company} is the data controller for personal data processed
          through the Programme. If you have any questions, contact us at{" "}
          <a className="text-teal-300" href={`mailto:${BRAND.supportEmail}`}>
            {BRAND.supportEmail}
          </a>
          .
        </p>
      </Section>

      <Section heading="2. What data we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>Identity data: your name.</li>
          <li>Contact data: WhatsApp/mobile number and email address.</li>
          <li>
            Programme data: your member code, referral links, referrals made,
            stored discounts earned and redeemed, and visit/treatment values
            recorded by the practice.
          </li>
          <li>
            Communications: messages exchanged with our WhatsApp assistant.
          </li>
        </ul>
        <p>
          We do not collect clinical/health records through the Programme. Your
          dental records are held separately by your dental practice.
        </p>
      </Section>

      <Section heading="3. How we use your data and our lawful basis">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Consent</strong> — to send you WhatsApp messages about your
            Gold Card, referrals and discounts. You give this when you opt in at
            sign-up.
          </li>
          <li>
            <strong>Contract</strong> — to operate the Programme, issue your
            card, track referrals, and apply stored discounts.
          </li>
          <li>
            <strong>Legitimate interests</strong> — to prevent fraud/abuse of
            the referral scheme and to improve the Programme.
          </li>
        </ul>
      </Section>

      <Section heading="4. WhatsApp messaging">
        <p>
          Messages are delivered via the WhatsApp Business Platform (Meta). By
          providing your number and opting in, you consent to receive Programme
          messages. You can opt out at any time by replying{" "}
          <strong>STOP</strong>. Meta processes message delivery under its own
          terms and privacy policy.
        </p>
      </Section>

      <Section heading="5. Sharing your data">
        <p>
          We share data only with: (a) your chosen dental practice to operate
          the Programme; (b) service providers who help us run the Programme
          (hosting, database, WhatsApp delivery, payment processing via Stripe);
          and (c) authorities where required by law. We never sell your data.
        </p>
      </Section>

      <Section heading="6. Payments">
        <p>
          Card payments are processed securely by Stripe and/or WhatsApp
          payments. We do not store your full card details on our systems.
        </p>
      </Section>

      <Section heading="7. Data retention">
        <p>
          We keep your Programme data for as long as you remain a member and for
          up to 24 months afterwards, unless a longer period is required by law.
          You may request deletion at any time.
        </p>
      </Section>

      <Section heading="8. Your rights">
        <p>Under UK GDPR you have the right to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Access a copy of your personal data;</li>
          <li>Rectify inaccurate data;</li>
          <li>Erase your data (&quot;right to be forgotten&quot;);</li>
          <li>Restrict or object to processing;</li>
          <li>Data portability;</li>
          <li>Withdraw consent at any time.</li>
        </ul>
        <p>
          To exercise any right, email{" "}
          <a className="text-teal-300" href={`mailto:${BRAND.supportEmail}`}>
            {BRAND.supportEmail}
          </a>
          . You also have the right to complain to the Information
          Commissioner&apos;s Office (ICO) at ico.org.uk.
        </p>
      </Section>

      <Section heading="9. Data security & storage">
        <p>
          Data is stored on secure servers within the UK/EEA where possible and
          protected with encryption in transit. Access is restricted to
          authorised staff and processors.
        </p>
      </Section>

      <Section heading="10. Changes to this policy">
        <p>
          We may update this policy from time to time. The latest version will
          always be available on this page.
        </p>
      </Section>
    </LegalLayout>
  );
}
