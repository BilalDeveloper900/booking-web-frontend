import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalSection } from "@/components/marketing/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — Book It Daily",
  description:
    "How Book It Daily collects, uses, shares, and protects personal data, your rights over your data, and how to contact us about privacy.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      intro="This policy explains what personal data Book It Daily collects, why, who we share it with, and the choices and rights you have."
      updated="30 May 2026"
    >
      <LegalSection heading="1. Introduction">
        <p>
          This Privacy Policy describes how Book It Daily (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;) handles personal data when you use our booking and client-management
          software (the &ldquo;Service&rdquo;). It applies to visitors, account owners, staff
          (&ldquo;admins&rdquo;), and the clients whose information is stored in the Service.
        </p>
        <p>
          For data you upload about your own clients and staff, you are the data controller and we
          act as your processor; we process that data on your instructions to provide the Service.
          For account and billing data, we act as the controller.
        </p>
      </LegalSection>

      <LegalSection heading="2. Information we collect">
        <h3>Information you provide</h3>
        <ul>
          <li>
            <strong>Account data:</strong> name, email address, password, business name, and role.
          </li>
          <li>
            <strong>Profile data:</strong> phone number, avatar, specialty, and preferences.
          </li>
          <li>
            <strong>Content you submit:</strong> client records, bookings, schedules, offers,
            messages, and notes.
          </li>
          <li>
            <strong>Billing data:</strong> handled by our payment provider, Polar. We receive
            limited details such as your plan, billing country, the last four digits of your card,
            and transaction status — we do <strong>not</strong> store full card numbers.
          </li>
          <li>
            <strong>Support data:</strong> messages you send us by email.
          </li>
        </ul>
        <h3>Information collected automatically</h3>
        <ul>
          <li>
            <strong>Usage and device data:</strong> IP address, browser and device type, pages
            viewed, and timestamps.
          </li>
          <li>
            <strong>Cookies and local storage:</strong> used to keep you signed in, remember
            preferences (such as light/dark theme), and operate the installable app. See section 8.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. How we use information">
        <p>We use personal data to:</p>
        <ul>
          <li>Provide, operate, secure, and maintain the Service;</li>
          <li>Process subscriptions, payments, and renewals (via Polar);</li>
          <li>Authenticate users and prevent fraud or abuse;</li>
          <li>Respond to your requests and provide support;</li>
          <li>Send service-related communications such as receipts and important notices;</li>
          <li>Improve and develop new features;</li>
          <li>Comply with legal obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Legal bases for processing">
        <p>
          Where data-protection laws such as the GDPR apply, we rely on the following legal bases:
          performance of a contract (to provide the Service you subscribe to), legitimate interests
          (to secure and improve the Service), consent (for example, non-essential cookies, where
          required), and compliance with legal obligations.
        </p>
      </LegalSection>

      <LegalSection heading="5. How we share information">
        <p>We do not sell your personal data. We share it only with:</p>
        <ul>
          <li>
            <strong>Payment provider — Polar:</strong> our Merchant of Record, who processes
            payments, issues invoices, and handles tax. See{" "}
            <a href="https://polar.sh/legal/privacy" target="_blank" rel="noopener noreferrer">
              Polar&rsquo;s privacy notice
            </a>
            .
          </li>
          <li>
            <strong>Infrastructure and service providers:</strong> hosting, database, email
            delivery, and analytics vendors who process data on our behalf under appropriate
            agreements.
          </li>
          <li>
            <strong>Other users in your workspace:</strong> data is shared between the owner, admins,
            and clients of the same business as needed to operate bookings.
          </li>
          <li>
            <strong>Legal and safety:</strong> where required by law, or to protect our rights,
            users, or the public.
          </li>
          <li>
            <strong>Business transfers:</strong> in connection with a merger, acquisition, or sale
            of assets, subject to this policy.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. International transfers">
        <p>
          We and our providers may process data in countries other than your own. Where we transfer
          personal data internationally, we use appropriate safeguards (such as standard
          contractual clauses) where required by applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="7. Data retention">
        <p>
          We keep personal data for as long as your account is active and as needed to provide the
          Service. After account closure, we delete or anonymize data within a reasonable period,
          except where we must retain it to comply with legal, tax, or accounting obligations or to
          resolve disputes. You can request deletion at any time (see section 9).
        </p>
      </LegalSection>

      <LegalSection heading="8. Cookies and similar technologies">
        <p>
          We use strictly necessary cookies and local storage to keep you signed in, remember
          settings, and run the installable progressive web app. We may use limited analytics to
          understand usage. You can control cookies through your browser settings; disabling
          essential cookies may break parts of the Service.
        </p>
      </LegalSection>

      <LegalSection heading="9. Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, delete, or export
          your personal data; to object to or restrict certain processing; and to withdraw consent.
          You can exercise many of these rights directly in the app (for example, editing your
          profile or exporting your data), or by contacting us at{" "}
          <a href="mailto:bookitdaily@gmail.com">bookitdaily@gmail.com</a>. We will respond within
          the time required by applicable law. You also have the right to complain to your local
          data-protection authority.
        </p>
        <p>
          If your data is stored in the Service by a business you are a client or staff member of,
          please direct access and deletion requests to that business first, as they control that
          data.
        </p>
      </LegalSection>

      <LegalSection heading="10. Security">
        <p>
          We use reasonable technical and organizational measures to protect personal data,
          including encryption in transit, access controls, and regular backups. No method of
          transmission or storage is completely secure, so we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="11. Children's privacy">
        <p>
          The Service is not directed to children under 16, and we do not knowingly collect their
          personal data. If you believe a child has provided us personal data, contact us and we
          will delete it.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will revise the &ldquo;Last
          updated&rdquo; date above and, for material changes, provide additional notice where
          appropriate.
        </p>
      </LegalSection>

      <LegalSection heading="13. Contact us">
        <p>
          For any privacy questions or requests, contact us at{" "}
          <a href="mailto:bookitdaily@gmail.com">bookitdaily@gmail.com</a>. See also our{" "}
          <Link href="/terms">Terms of Service</Link> and{" "}
          <Link href="/refund-policy">Refund Policy</Link>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
