import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalSection } from "@/components/marketing/legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service — Book It Daily",
  description:
    "The terms and conditions governing your use of Book It Daily booking software, including subscriptions, billing, acceptable use, and liability.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      intro="These terms are a binding agreement between you and Book It Daily. Please read them carefully before using the service."
      updated="30 May 2026"
    >
      <LegalSection heading="1. Who we are">
        <p>
          Book It Daily (&ldquo;Book It Daily&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
          &ldquo;our&rdquo;) is a booking and client-management software service operated by an
          individual sole proprietor based in Pakistan. These Terms of Service (the
          &ldquo;Terms&rdquo;) govern your access to and use of our websites, applications, and
          related services (together, the &ldquo;Service&rdquo;).
        </p>
        <p>
          By creating an account, subscribing to a plan, or otherwise using the Service, you agree
          to these Terms and to our{" "}
          <Link href="/privacy">Privacy Policy</Link> and{" "}
          <Link href="/refund-policy">Refund Policy</Link>, which are incorporated by reference. If
          you do not agree, do not use the Service.
        </p>
      </LegalSection>

      <LegalSection heading="2. Eligibility and accounts">
        <p>
          You must be at least 18 years old and able to form a binding contract to use the Service.
          You are responsible for the accuracy of the information you provide, for keeping your
          login credentials secure, and for all activity that occurs under your account. Notify us
          promptly at <a href="mailto:bookitdaily@gmail.com">bookitdaily@gmail.com</a> if you
          suspect any unauthorized use.
        </p>
        <p>
          The Service supports three roles — <strong>owner</strong> (the business that subscribes),
          <strong> admin</strong> (staff invited by an owner), and <strong>client</strong> (the end
          customer who books). Account owners are responsible for the conduct of users they invite.
        </p>
      </LegalSection>

      <LegalSection heading="3. The Service">
        <p>
          Book It Daily provides software that lets fitness and wellness businesses such as yoga and
          pilates studios, gyms, and personal trainers manage bookings, clients, staff, schedules,
          offers, and related records. We sell access to
          this software on a subscription basis. We are <strong>not</strong> a payment processor for
          your customers, and we do not handle the money your clients pay you for your own services.
        </p>
        <p>
          We may add, change, or remove features over time. We aim to give reasonable notice of
          material changes, but we may make changes without notice where necessary for security,
          legal, or operational reasons.
        </p>
      </LegalSection>

      <LegalSection heading="4. Subscriptions, billing, and renewals">
        <p>
          Paid plans are described on our{" "}
          <Link href="/pricing">Pricing page</Link>. Prices are stated in US Dollars (USD) and
          exclude applicable sales tax or VAT, which is added at checkout.
        </p>
        <ul>
          <li>
            <strong>Payment provider.</strong> Subscriptions are sold through our payment provider,
            <strong> Paddle</strong>, who acts as the Merchant of Record. Paddle handles payment
            processing, invoicing, and the collection and remittance of applicable taxes. Your
            purchase is also subject to Paddle&rsquo;s buyer terms presented at checkout.
          </li>
          <li>
            <strong>Free trial.</strong> Where offered, a 14-day free trial converts to a paid
            subscription at the end of the trial unless you cancel beforehand.
          </li>
          <li>
            <strong>Automatic renewal.</strong> Subscriptions renew automatically at the end of each
            billing period (monthly or annual) at the then-current price, until cancelled.
          </li>
          <li>
            <strong>Cancellation.</strong> You may cancel at any time from your account settings or
            the customer portal. Cancellation stops future renewals; access continues until the end
            of the period already paid for.
          </li>
          <li>
            <strong>Refunds.</strong> Refunds are governed by our{" "}
            <Link href="/refund-policy">Refund Policy</Link>.
          </li>
          <li>
            <strong>Failed payments.</strong> If a charge fails, we may retry it and may suspend or
            downgrade your account if payment is not received.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>You agree not to, and not to allow anyone else to:</p>
        <ul>
          <li>Use the Service to break any law or infringe anyone&rsquo;s rights;</li>
          <li>Upload unlawful, harmful, deceptive, or infringing content;</li>
          <li>
            Attempt to gain unauthorized access to the Service, other accounts, or our systems;
          </li>
          <li>
            Probe, scan, overload, or disrupt the Service, or circumvent any usage limits or
            security measures;
          </li>
          <li>
            Reverse engineer, copy, resell, or create derivative works from the Service except as
            permitted by law;
          </li>
          <li>Use the Service to send spam or unsolicited messages.</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate this section, with or without notice
          depending on the severity.
        </p>
      </LegalSection>

      <LegalSection heading="6. Your content and data">
        <p>
          You retain ownership of the data and content you and your users submit to the Service
          (&ldquo;Your Content&rdquo;), including client records, bookings, and messages. You grant
          us a limited license to host, process, and display Your Content solely to provide and
          improve the Service.
        </p>
        <p>
          You are responsible for having the necessary rights and consents to upload Your Content,
          and for complying with applicable data-protection laws toward the clients and staff whose
          information you store. Our handling of personal data is described in our{" "}
          <Link href="/privacy">Privacy Policy</Link>. You can export your data at any time as
          described there.
        </p>
      </LegalSection>

      <LegalSection heading="7. Intellectual property">
        <p>
          The Service, including its software, design, branding, and content (excluding Your
          Content), is owned by Book It Daily and protected by intellectual-property laws. We grant
          you a limited, non-exclusive, non-transferable, revocable license to use the Service in
          accordance with these Terms. All rights not expressly granted are reserved.
        </p>
      </LegalSection>

      <LegalSection heading="8. Third-party services">
        <p>
          The Service relies on third-party providers (for example, our payment provider Paddle,
          and hosting and infrastructure vendors). Your use of those services may be subject to
          their own terms. We are not responsible for third-party services we do not control.
        </p>
      </LegalSection>

      <LegalSection heading="9. Disclaimers">
        <p>
          The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
          To the maximum extent permitted by law, we disclaim all warranties, express or implied,
          including merchantability, fitness for a particular purpose, and non-infringement. We do
          not warrant that the Service will be uninterrupted, error-free, or completely secure.
        </p>
      </LegalSection>

      <LegalSection heading="10. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Book It Daily will not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or for any loss of
          profits, revenue, data, or goodwill. Our total aggregate liability arising out of or
          relating to the Service will not exceed the amount you paid us for the Service in the
          twelve (12) months immediately before the event giving rise to the claim.
        </p>
      </LegalSection>

      <LegalSection heading="11. Indemnification">
        <p>
          You agree to indemnify and hold harmless Book It Daily from any claims, damages, losses,
          and expenses (including reasonable legal fees) arising from your use of the Service, Your
          Content, or your breach of these Terms.
        </p>
      </LegalSection>

      <LegalSection heading="12. Termination">
        <p>
          You may stop using the Service and close your account at any time. We may suspend or
          terminate your access if you breach these Terms, fail to pay, or if we are required to do
          so by law. On termination, your right to use the Service ends; sections that by their
          nature should survive (for example, payment obligations, disclaimers, and limitation of
          liability) will survive.
        </p>
      </LegalSection>

      <LegalSection heading="13. Changes to these Terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we will update
          the &ldquo;Last updated&rdquo; date above and, where appropriate, notify you. Your
          continued use of the Service after changes take effect constitutes acceptance of the
          revised Terms.
        </p>
      </LegalSection>

      <LegalSection heading="14. Governing law and disputes">
        <p>
          These Terms are governed by the laws of the Islamic Republic of Pakistan, without regard
          to its conflict-of-law rules. The courts located in Pakistan will have exclusive
          jurisdiction over any dispute arising out of or relating to these Terms or the Service,
          except where mandatory consumer-protection laws of your country of residence provide
          otherwise.
        </p>
      </LegalSection>

      <LegalSection heading="15. Contact us">
        <p>
          If you have any questions about these Terms, contact us at{" "}
          <a href="mailto:bookitdaily@gmail.com">bookitdaily@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
