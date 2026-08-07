import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, Bullets, type LegalSection } from "@/components/site/LegalPage";

export const Route = createFileRoute("/refund-cancellation")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — HumanLink" },
      {
        name: "description",
        content:
          "How HumanLink subscription billing, cancellations, refunds, failed payments and chargebacks are handled.",
      },
      { property: "og:title", content: "Refund & Cancellation Policy — HumanLink" },
      {
        property: "og:description",
        content: "Billing, cancellation and refund rules for HumanLink paid plans.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RefundPage,
});

const sections: LegalSection[] = [
  {
    id: "plans",
    heading: "1. Paid plans",
    body: (
      <p>
        HumanLink offers optional paid plans that unlock additional features. The plan name, price,
        currency and billing interval are shown on the pricing page and again in the checkout window
        before you pay.
      </p>
    ),
  },
  {
    id: "billing",
    heading: "2. Billing",
    body: (
      <p>
        Payments are collected by our payment provider at the time of purchase. Your subscription
        activates as soon as the payment is verified, and the expiry date of the current term is shown
        on your dashboard.
      </p>
    ),
  },
  {
    id: "cancellation",
    heading: "3. Cancellation",
    body: (
      <p>
        You can cancel a subscription at any time from your dashboard. Cancellation stops future
        renewals. Your plan benefits remain active until the end of the term you have already paid
        for, and the plan then reverts to the free tier.
      </p>
    ),
  },
  {
    id: "refunds",
    heading: "4. Refunds",
    body: (
      <>
        <p>
          Subscription fees are generally non-refundable once the plan term has started, because
          plan features are available immediately. We will review a refund request where:
        </p>
        <Bullets
          items={[
            "You were charged more than once for the same plan term.",
            "A payment was taken but the subscription was never activated.",
            "The charge was not authorised by you.",
            "A verified platform fault prevented you from using the paid features for a significant part of the term.",
          ]}
        />
        <p>
          Approved refunds are issued to the original payment method. Refunds are recorded against
          the original payment so you can see the status.
        </p>
      </>
    ),
  },
  {
    id: "how-to-request",
    heading: "5. How to request a refund",
    body: (
      <p>
        Raise a payment grievance on the{" "}
        <Link to="/report-and-grievance" className="underline underline-offset-2">
          Report &amp; Grievance
        </Link>{" "}
        page and include the payment reference shown in your payment history. You'll get a ticket ID
        and can track the status of your request.
      </p>
    ),
  },
  {
    id: "processing-time",
    heading: "6. Processing time",
    body: (
      <p>
        We aim to review refund requests within 7 business days. Once approved, the payment provider
        and your bank determine when the money reaches your account — this typically takes a further
        5 to 10 business days.
      </p>
    ),
  },
  {
    id: "failed",
    heading: "7. Failed or pending payments",
    body: (
      <p>
        If a payment fails, no subscription is activated and any amount debited is normally reversed
        automatically by your bank. If an amount was debited and the plan did not activate within 24
        hours, contact us with the payment reference.
      </p>
    ),
  },
  {
    id: "chargebacks",
    heading: "8. Chargebacks",
    body: (
      <p>
        Please contact us before raising a chargeback — most issues are resolved faster directly.
        Accounts with an open chargeback may have paid features suspended until the dispute is
        settled.
      </p>
    ),
  },
  {
    id: "donations",
    heading: "9. Donations and member-to-member payments",
    body: (
      <p>
        Donations and any money exchanged directly between members are not processed by HumanLink and
        are not covered by this policy. We cannot recover or refund funds sent outside the platform,
        which is why we ask you to be careful with financial requests — see our{" "}
        <Link to="/user-safety" className="underline underline-offset-2">
          User Safety
        </Link>{" "}
        guidance.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "10. Changes to this policy",
    body: (
      <p>
        We may update this policy. The version number and effective date at the top of this page
        always reflect the current version, and the terms that applied at the time of your purchase
        govern that purchase.
      </p>
    ),
  },
];

function RefundPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      policyType="refund"
      intro={
        <p>
          This policy explains how billing, cancellation and refunds work for HumanLink paid plans,
          and how to raise a payment issue.
        </p>
      }
      sections={sections}
    />
  );
}
