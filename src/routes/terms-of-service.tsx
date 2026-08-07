import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { LegalPage, Bullets, type LegalSection } from "@/components/site/LegalPage";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms of Service — HumanLink" },
      {
        name: "description",
        content:
          "The rules for using HumanLink: accounts, help requests, helpers, content, messaging, karma, payments, moderation and liability.",
      },
      { property: "og:title", content: "Terms of Service — HumanLink" },
      {
        property: "og:description",
        content: "The agreement between you and HumanLink for using the platform.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

const sections: LegalSection[] = [
  {
    id: "introduction",
    heading: "1. Introduction",
    body: (
      <p>
        HumanLink is a community platform that connects people who need help with people, volunteers,
        NGOs, professionals and businesses who are willing to help. These Terms of Service govern
        your access to and use of HumanLink. By creating an account or using HumanLink you agree to
        these Terms. If you do not agree, please do not use the platform.
      </p>
    ),
  },
  {
    id: "eligibility",
    heading: "2. Eligibility",
    body: (
      <>
        <p>To use HumanLink you must:</p>
        <Bullets
          items={[
            "Be legally capable of entering into a binding agreement in your jurisdiction.",
            "Provide accurate information about yourself.",
            "Not be restricted or suspended from HumanLink by a previous moderation action.",
          ]}
        />
        <p>
          If you use HumanLink on behalf of an organisation, NGO or business, you confirm that you
          are authorised to do so.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    heading: "3. Account creation and security",
    body: (
      <>
        <p>
          You are responsible for your account credentials and for all activity that happens under
          your account. Keep your password confidential and tell us promptly if you believe your
          account has been compromised.
        </p>
        <p>
          When you create an account you are asked to accept these Terms and acknowledge the Privacy
          Policy. We store a record of that acceptance, including the policy version and the time of
          acceptance.
        </p>
      </>
    ),
  },
  {
    id: "responsibilities",
    heading: "4. Your responsibilities",
    body: (
      <Bullets
        items={[
          "Use HumanLink lawfully, honestly and respectfully.",
          "Only post help requests and offers that are genuine.",
          "Use your own judgement before meeting, helping or accepting help from another member.",
          "Respect other members' privacy and personal information.",
          "Report behaviour that appears unsafe, fraudulent or abusive.",
        ]}
      />
    ),
  },
  {
    id: "help-requests",
    heading: "5. Help requests",
    body: (
      <p>
        Members may post help requests describing what they need, including category, urgency and
        optional location or budget. HumanLink does not verify the accuracy of any request. Requests
        that are fraudulent, misleading, unlawful or harmful may be removed and may lead to
        moderation action against the account.
      </p>
    ),
  },
  {
    id: "helpers",
    heading: "6. Helpers and offers of help",
    body: (
      <p>
        Members may offer to help with a request. Any arrangement between a requester and a helper is
        between those members. HumanLink is not a party to that arrangement, does not employ helpers,
        does not supervise how help is delivered, and does not guarantee any outcome, quality,
        qualification or availability.
      </p>
    ),
  },
  {
    id: "content",
    heading: "7. User-generated content",
    body: (
      <>
        <p>
          You keep ownership of the content you post — profiles, posts, help requests, comments,
          reviews, stories and media. By posting, you grant HumanLink a non-exclusive licence to
          host, store, display and distribute that content for the purpose of operating the platform.
        </p>
        <p>
          You are responsible for the content you post and must have the right to post it. We may
          remove or restrict content that breaches these Terms or our Community Guidelines.
        </p>
      </>
    ),
  },
  {
    id: "messaging",
    heading: "8. Messaging and calls",
    body: (
      <p>
        HumanLink provides direct messaging and in-app calling so members can coordinate help.
        Messaging must not be used for spam, harassment, scams, or the distribution of illegal
        content. Messages may be reviewed by our moderation team when they are reported.
      </p>
    ),
  },
  {
    id: "reviews",
    heading: "9. Reviews, ratings, karma and followers",
    body: (
      <>
        <p>
          Reviews and ratings must reflect genuine experiences. Karma points recognise completed
          help. Followers and social features are provided for discovery and community building.
        </p>
        <p>
          Manipulating reviews, ratings, karma or follower counts — including through fake accounts,
          coordinated activity or self-dealing — is prohibited and may result in loss of karma,
          removal of content or account restriction.
        </p>
      </>
    ),
  },
  {
    id: "prohibited",
    heading: "10. Prohibited conduct",
    body: (
      <>
        <p>You must not use HumanLink to:</p>
        <Bullets
          items={[
            "Harass, threaten, bully, stalk or intimidate anyone.",
            "Commit fraud, run scams, or solicit money under false pretences.",
            "Impersonate another person, organisation or NGO.",
            "Exploit vulnerable people, including children and elderly members.",
            "Post illegal content or facilitate illegal activity.",
            "Share another person's private information without consent.",
            "Send spam, or scrape, disrupt or attack the platform.",
          ]}
        />
      </>
    ),
  },
  {
    id: "safety-reporting",
    heading: "11. Safety, reporting and moderation",
    body: (
      <>
        <p>
          Every profile and piece of user-generated content on HumanLink can be reported. Reports go
          to our moderation team and are given a Report ID. You can also raise a formal grievance
          through our{" "}
          <Link to="/report-and-grievance" className="underline underline-offset-2">
            Report &amp; Grievance
          </Link>{" "}
          system.
        </p>
        <p>
          Depending on what we find, moderation actions may include a warning, content removal,
          content restriction, temporary restriction or suspension, permanent suspension, or no
          action. We may also escalate a matter for further review. Internal moderation notes are not
          shared with members.
        </p>
      </>
    ),
  },
  {
    id: "suspension",
    heading: "12. Suspension and termination",
    body: (
      <p>
        We may suspend or terminate an account that breaches these Terms, our Community Guidelines,
        or applicable law, or where there is a credible risk to other members. You may stop using
        HumanLink and request deletion of your account at any time from Settings.
      </p>
    ),
  },
  {
    id: "humi",
    heading: "13. HUMI, the AI assistant",
    body: (
      <p>
        HUMI is an AI assistant. It is not a human, and it can be wrong. HUMI does not provide
        professional medical, legal, financial or emergency services, and its responses are
        information only. Do not rely on HUMI for safety-critical decisions; use HumanLink's
        reporting and safety channels and, where relevant, qualified professionals or emergency
        services.
      </p>
    ),
  },
  {
    id: "payments",
    heading: "14. Payments and subscriptions",
    body: (
      <p>
        Some HumanLink features are offered through paid plans. Payments are processed by our payment
        provider; HumanLink does not store your full card details. Plan pricing, billing interval and
        renewal behaviour are shown before payment, together with our{" "}
        <Link to="/refund-cancellation" className="underline underline-offset-2">
          Refund &amp; Cancellation Policy
        </Link>
        .
      </p>
    ),
  },
  {
    id: "ip",
    heading: "15. Intellectual property",
    body: (
      <p>
        The HumanLink name, logo, interface, and software are owned by HumanLink and its licensors.
        You may not copy, modify, or create derivative works of the platform except as permitted by
        law.
      </p>
    ),
  },
  {
    id: "third-parties",
    heading: "16. Third-party services",
    body: (
      <p>
        HumanLink relies on third-party services for hosting, authentication, storage, maps, AI
        processing and payments. Your use of those features is also subject to those providers'
        terms. HumanLink is not responsible for third-party services or external links.
      </p>
    ),
  },
  {
    id: "disclaimers",
    heading: "17. Disclaimers",
    body: (
      <>
        <p>
          HumanLink is provided on an “as is” and “as available” basis. HumanLink is a platform that
          connects people. <strong>We cannot guarantee that another member is genuine, qualified,
          trustworthy or safe</strong>, and we do not guarantee that help will be provided, that it
          will be adequate, or that any interaction will be safe.
        </p>
        <p>HumanLink is not an emergency service and does not provide emergency response.</p>
      </>
    ),
  },
  {
    id: "liability",
    heading: "18. Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, HumanLink is not liable for indirect, incidental,
        special or consequential damages, or for loss arising from interactions between members,
        content posted by members, or reliance on information available on the platform. Nothing in
        these Terms limits liability that cannot be limited under applicable law.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "19. Changes to the service and to these Terms",
    body: (
      <p>
        We may change, suspend or discontinue features. We may also update these Terms. When we
        publish a new version we update the version number and the effective date on this page, and
        we may ask you to accept the new version before continuing to use HumanLink. Previous
        acceptance records are preserved.
      </p>
    ),
  },
  {
    id: "law",
    heading: "20. Governing law and jurisdiction",
    body: (
      <p>
        These Terms are governed by the laws of India. Subject to applicable law, the courts of India
        will have jurisdiction over disputes relating to HumanLink. The specific place of
        jurisdiction is determined by the operating entity's registered location, which is published
        in the Contact section once configured.
      </p>
    ),
  },
];

function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      policyType="terms"
      intro={
        <p>
          These Terms explain what you can expect from HumanLink and what we expect from you. Please
          read them together with our Privacy Policy, Community Guidelines and Refund &amp;
          Cancellation Policy.
        </p>
      }
      sections={sections}
    />
  );
}
