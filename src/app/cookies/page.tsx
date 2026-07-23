import type { Metadata } from "next";
import { LegalLayout, Section } from "@/components/legal-layout";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cookie Policy — Dental Scotland Gold Card",
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" updated="23 July 2026">
      <p>
        This Cookie Policy explains how {BRAND.company} uses cookies and similar
        technologies on the Dental Scotland Gold Card application.
      </p>

      <Section heading="1. What are cookies?">
        <p>
          Cookies are small text files stored on your device that help websites
          function and remember your preferences.
        </p>
      </Section>

      <Section heading="2. Cookies we use">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Strictly necessary</strong> — required for the app to work,
            such as maintaining your session and security. These do not require
            consent.
          </li>
          <li>
            <strong>Functional</strong> — remember choices you make to improve
            your experience.
          </li>
        </ul>
        <p>
          We currently do not use advertising or third-party tracking cookies in
          the Programme app.
        </p>
      </Section>

      <Section heading="3. Managing cookies">
        <p>
          You can control and delete cookies through your browser settings.
          Blocking strictly necessary cookies may affect how the app works.
        </p>
      </Section>

      <Section heading="4. Contact">
        <p>
          Questions? Email{" "}
          <a className="text-teal-300" href={`mailto:${BRAND.supportEmail}`}>
            {BRAND.supportEmail}
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
