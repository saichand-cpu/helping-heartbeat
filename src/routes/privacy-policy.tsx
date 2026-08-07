import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Bullets, type LegalSection } from "@/components/site/LegalPage";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — HumanLink" },
      {
        name: "description",
        content:
          "How HumanLink collects, uses, shares, protects and retains your information — accounts, requests, messages, location, AI and payments.",
      },
      { property: "og:title", content: "Privacy Policy — HumanLink" },
      {
        property: "og:description",
        content: "What HumanLink collects, why, and the control you have over your data.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const sections: LegalSection[] = [
  {
    id: "scope",
    heading: "1. Scope of this policy",
    body: (
      <p>
        This policy describes the information HumanLink actually collects when you use the platform,
        how we use it, and the choices you have. It covers the HumanLink web application and the
        features available inside it.
      </p>
    ),
  },
  {
    id: "account",
    heading: "2. Account information",
    body: (
      <Bullets
        items={[
          "Email address and password credentials, handled by our authentication provider.",
          "Full name you provide at signup.",
          "Mobile number, if you provide one. Phone numbers are stored separately and are only visible to members you have an accepted help connection with, subject to your privacy settings.",
          "Your acceptance of our Terms and Privacy Policy, including the policy version and timestamp.",
        ]}
      />
    ),
  },
  {
    id: "profile",
    heading: "3. Profile information",
    body: (
      <p>
        Your profile may include a display name, username, avatar and cover image, bio, profession,
        skills, languages, interests, availability, account type (personal, business or NGO),
        organisation type, website or fundraising links, and your country, state and city. You choose
        what to add, and you can edit or remove it in Settings.
      </p>
    ),
  },
  {
    id: "activity",
    heading: "4. Help requests, posts, reviews and social activity",
    body: (
      <p>
        We store the help requests you create, offers you make, posts, comments, likes, bookmarks,
        stories, reviews and ratings, karma points, follows, and time capsules. This content powers
        the community features and, where you choose, is visible to other members.
      </p>
    ),
  },
  {
    id: "messages",
    heading: "5. Messages and calls",
    body: (
      <p>
        Direct messages and conversation metadata are stored so your chat history is available across
        devices. Messages are not used for advertising. Message content may be reviewed by our
        moderation team when it is reported to us.
      </p>
    ),
  },
  {
    id: "location",
    heading: "6. Location information",
    body: (
      <p>
        Location is optional. We use it only when you provide it — for example a request location, a
        location you deliberately share in chat, or a place name we convert to coordinates so it can
        be shown on a map. We do not track your location in the background.
      </p>
    ),
  },
  {
    id: "technical",
    heading: "7. Device and technical information",
    body: (
      <p>
        Like most web applications, our infrastructure processes technical data such as IP address,
        browser type and request logs in order to serve pages, keep the service secure and diagnose
        errors.
      </p>
    ),
  },
  {
    id: "cookies",
    heading: "8. Cookies and local storage",
    body: (
      <p>
        We use browser storage for essential functionality only: keeping you signed in, remembering
        your theme preference, and basic anti-abuse rate limiting on the sign-in form. We do not use
        third-party advertising cookies.
      </p>
    ),
  },
  {
    id: "humi",
    heading: "9. HUMI (AI assistant) interactions",
    body: (
      <p>
        When you chat with HUMI, your messages and any files you attach are sent to our AI provider to
        generate a response, and the conversation is stored in your account so you can return to it.
        Please avoid sharing sensitive personal information, credentials or identity documents with
        HUMI.
      </p>
    ),
  },
  {
    id: "payments",
    heading: "10. Payment information",
    body: (
      <p>
        Payments are processed by our payment provider. HumanLink does not receive or store your full
        card details. We store the order and payment reference, amount, currency, plan, status and
        timestamps so we can activate your subscription and support billing queries.
      </p>
    ),
  },
  {
    id: "verification",
    heading: "11. NGO and business verification information",
    body: (
      <p>
        If you apply for NGO or business verification, we store the details and any document link you
        submit, along with the review status. Verification material is accessible only to
        administrators reviewing the request.
      </p>
    ),
  },
  {
    id: "reports",
    heading: "12. Reports, grievances and moderation records",
    body: (
      <p>
        When you file a report or grievance we store your identity, the target, the category, the
        description you write, and the resulting status and actions. Reports are visible to you and to
        our moderation team. Internal moderation notes are never shown to members.
      </p>
    ),
  },
  {
    id: "use",
    heading: "13. How we use information",
    body: (
      <Bullets
        items={[
          "To operate core features: accounts, requests, matching, messaging, reviews and karma.",
          "To keep the community safe: moderation, report handling, anti-abuse and suspension.",
          "To provide AI features such as matching suggestions and HUMI responses.",
          "To process payments and manage subscriptions.",
          "To send you notifications you have enabled.",
          "To comply with legal obligations and enforce our Terms.",
        ]}
      />
    ),
  },
  {
    id: "sharing",
    heading: "14. How information is shared",
    body: (
      <>
        <p>
          Information you post publicly on HumanLink is visible according to your privacy settings.
          Beyond that, we share information only with:
        </p>
        <Bullets
          items={[
            "Service providers who host our database, storage, authentication, maps, AI processing and payments.",
            "Administrators and moderators, strictly for safety and support purposes.",
            "Authorities, where we are legally required to do so.",
          ]}
        />
        <p>We do not sell your personal information.</p>
      </>
    ),
  },
  {
    id: "security",
    heading: "15. Security",
    body: (
      <p>
        Access to data is controlled by row-level security rules that restrict each member to their
        own information, with elevated access limited to administrators and enforced server-side.
        Traffic is encrypted in transit. No system can be guaranteed perfectly secure, so please use a
        strong, unique password.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "16. Data retention",
    body: (
      <p>
        We keep your information while your account is active. Reports, grievances, moderation
        records and legal acceptance records may be retained after account deletion where they are
        needed for safety, dispute resolution or legal compliance.
      </p>
    ),
  },
  {
    id: "rights",
    heading: "17. Your rights and controls",
    body: (
      <Bullets
        items={[
          "Access and edit your profile information in Settings.",
          "Control visibility of your profile, followers, phone and email in Privacy settings.",
          "Manage notification preferences.",
          "View reports and grievances you have submitted.",
          "Delete your account, or request deletion of your data, from Settings.",
        ]}
      />
    ),
  },
  {
    id: "grievance",
    heading: "18. Privacy questions and grievances",
    body: (
      <p>
        You can raise a privacy question or complaint through the Report &amp; Grievance page. Every
        grievance receives a ticket ID so you can track its status. Contact addresses are listed
        below.
      </p>
    ),
  },
];

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      policyType="privacy"
      intro={
        <p>
          HumanLink is built on trust. This policy explains what information we collect, why we
          collect it, who can see it, and how you stay in control.
        </p>
      }
      sections={sections}
    />
  );
}
