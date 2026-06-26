import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalSection } from "@/components/marketing/legal-shell";

export const metadata: Metadata = {
  title: "Refund Policy — Book It Daily",
  description:
    "Book It Daily's refund and cancellation policy for software subscriptions, including the 14-day money-back guarantee and how to request a refund.",
};

export default function RefundPolicyPage() {
  return (
    <LegalShell
      title="Refund Policy"
      intro="We want you to be happy with Book It Daily. This policy explains when refunds are available and how to request one."
      updated="27 June 2026"
    >
      <LegalSection heading="1. Scope">
        <p>
          This Refund Policy applies to subscription payments made to Book It Daily for access to
          our booking software (the &ldquo;Service&rdquo;). It forms part of our{" "}
          <Link href="/terms">Terms of Service</Link>. It does <strong>not</strong> apply to
          payments your own clients make to your business for your services — Book It Daily does not
          process those payments.
        </p>
      </LegalSection>

      <LegalSection heading="2. Free trial">
        <p>
          Paid plans include a 14-day free trial. You will not be charged during the trial, and you
          can cancel any time before it ends at no cost. We recommend trying the Service during the
          trial to confirm it meets your needs before being billed. The Free plan is free forever
          and never requires payment.
        </p>
      </LegalSection>

      <LegalSection heading="3. 14-day money-back guarantee">
        <p>
          If you are charged for a new subscription and are not satisfied, you may request a full
          refund within <strong>14 days</strong> of that charge. This applies to:
        </p>
        <ul>
          <li>Your first payment on a new paid plan, and</li>
          <li>The renewal payment of an annual plan, if requested within 14 days of the renewal.</li>
        </ul>
        <p>
          Approved refunds are issued to your original payment method through our payment provider,
          Polar. It may take several business days for the funds to appear, depending on your bank
          or card issuer.
        </p>
      </LegalSection>

      <LegalSection heading="4. Cancellations and monthly plans">
        <p>
          You can cancel at any time from your account settings or the customer portal.
          Cancellation stops future renewals, and you keep access until the end of the period you
          have already paid for.
        </p>
        <ul>
          <li>
            <strong>Monthly plans:</strong> charges already made for the current month are generally
            non-refundable after the 14-day window, but you will not be billed again.
          </li>
          <li>
            <strong>Annual plans:</strong> after the 14-day window, the remaining unused months are
            non-refundable unless required by applicable law. Contact us if you believe your
            situation is exceptional — we review requests in good faith.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Exceptions and non-refundable items">
        <p>Refunds are generally not available for:</p>
        <ul>
          <li>Requests made after the 14-day money-back window;</li>
          <li>Partial or unused time on a monthly plan after the window;</li>
          <li>
            Accounts terminated by us for violating our{" "}
            <Link href="/terms">Terms of Service</Link>.
          </li>
        </ul>
        <p>
          Nothing in this policy limits any non-waivable refund or cancellation rights you may have
          under the consumer-protection laws of your country of residence.
        </p>
      </LegalSection>

      <LegalSection heading="6. How to request a refund">
        <p>
          Email <a href="mailto:bookitdaily@gmail.com">bookitdaily@gmail.com</a> from the address on
          your account with the subject &ldquo;Refund request&rdquo;. Please include your account
          email and the approximate date and amount of the charge. We aim to respond within 5
          business days. Because Polar is our Merchant of Record, the refund is processed through
          Polar once approved.
        </p>
      </LegalSection>

      <LegalSection heading="7. Changes to this policy">
        <p>
          We may update this Refund Policy from time to time. The &ldquo;Last updated&rdquo; date
          above reflects the latest version. Changes apply to charges made after the change takes
          effect.
        </p>
      </LegalSection>

      <LegalSection heading="8. Contact us">
        <p>
          Questions about refunds or billing? Contact us at{" "}
          <a href="mailto:bookitdaily@gmail.com">bookitdaily@gmail.com</a>. See also our{" "}
          <Link href="/pricing">Pricing</Link>, <Link href="/terms">Terms of Service</Link>, and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
