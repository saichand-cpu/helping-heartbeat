import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, Bullets, type LegalSection } from "@/components/site/LegalPage";

export const Route = createFileRoute("/user-safety")({
  head: () => ({
    meta: [
      { title: "User Safety — HumanLink" },
      {
        name: "description",
        content:
          "Practical safety guidance for meeting members, giving and receiving help, sharing information, avoiding scams and reporting concerns on HumanLink.",
      },
      { property: "og:title", content: "User Safety — HumanLink" },
      {
        property: "og:description",
        content: "How to stay safe while helping and being helped on HumanLink.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SafetyPage,
});

const sections: LegalSection[] = [
  {
    id: "what-humanlink-is",
    heading: "What HumanLink is — and isn't",
    body: (
      <>
        <p>
          HumanLink is a platform that connects people. We are not a background-check service, an
          agency, or an emergency service.
        </p>
        <p>
          <strong>
            HumanLink cannot guarantee that another user is genuine, qualified, trustworthy or safe.
          </strong>{" "}
          Please use your own judgement and take sensible precautions, exactly as you would when
          meeting anyone new.
        </p>
        <p>
          In an emergency, contact your local emergency services. In India: 112 (all emergencies),
          108 (ambulance), 100 (police), 101 (fire).
        </p>
      </>
    ),
  },
  {
    id: "meeting",
    heading: "Meeting another HumanLink member",
    body: (
      <Bullets
        items={[
          "Meet in a public, well-lit place for the first time.",
          "Tell a friend or family member where you're going and when you expect to be back.",
          "Arrange your own transport and keep your phone charged.",
          "Keep the conversation inside HumanLink until you're confident.",
          "Trust your instincts — if something feels wrong, leave and report it.",
        ]}
      />
    ),
  },
  {
    id: "accepting-help",
    heading: "Accepting help from someone you don't know",
    body: (
      <Bullets
        items={[
          "Check the profile: karma, reviews, completed requests and how long they've been active.",
          "Be cautious of anyone who pushes you to move to another app immediately.",
          "Never hand over documents, cards, OTPs or passwords.",
          "Don't let anyone into your home alone if you're unsure — invite a trusted person along.",
        ]}
      />
    ),
  },
  {
    id: "providing-help",
    heading: "Providing help to someone you don't know",
    body: (
      <Bullets
        items={[
          "Be clear about what you can and cannot do, and don't over-promise.",
          "Don't take on work that requires a licence or qualification you don't hold.",
          "Avoid handling other people's money, valuables or documents.",
          "Set boundaries around your time, your home address and your personal contact details.",
        ]}
      />
    ),
  },
  {
    id: "personal-info",
    heading: "Sharing personal information",
    body: (
      <p>
        Share only what a member genuinely needs to help you. Your phone number is protected by your
        privacy settings — you decide who can see it. Never share government IDs, bank details,
        passwords or one-time passcodes with anyone on HumanLink, including anyone claiming to
        represent HumanLink.
      </p>
    ),
  },
  {
    id: "money",
    heading: "Financial requests and scams",
    body: (
      <>
        <p>Treat every unexpected request for money as suspicious. Common warning signs:</p>
        <Bullets
          items={[
            "Urgency and emotional pressure to pay immediately.",
            "Requests for gift cards, crypto, or transfers to a personal account.",
            "A story that changes, or a profile created very recently with no history.",
            "An offer that seems far too generous for the effort involved.",
            "Requests to move the conversation off HumanLink straight away.",
          ]}
        />
        <p>HumanLink will never ask you for your password or an OTP.</p>
      </>
    ),
  },
  {
    id: "links",
    heading: "Suspicious links and files",
    body: (
      <p>
        Don't open links or download files you weren't expecting. Check the address carefully before
        entering any credentials — a fake login page is one of the most common ways accounts are
        stolen. If a link looks off, report the message instead of clicking it.
      </p>
    ),
  },
  {
    id: "harassment",
    heading: "Harassment and threats",
    body: (
      <p>
        You never have to tolerate harassment. Block the member, report the profile or the specific
        content, and keep the messages as context for our moderation team. If you receive a credible
        threat of violence, contact your local police first, then report it to us.
      </p>
    ),
  },
  {
    id: "vulnerable",
    heading: "Helping vulnerable people",
    body: (
      <p>
        Extra care is needed with children, elderly members, people in medical distress and people in
        crisis. Don't make medical, legal or financial decisions for someone else, involve a family
        member or professional where possible, and never isolate a vulnerable person from their
        support network.
      </p>
    ),
  },
  {
    id: "reporting",
    heading: "Reporting suspicious behaviour",
    body: (
      <p>
        Every profile and piece of content on HumanLink has a Report action. Reports are confidential
        and go straight to our moderation team with a Report ID you can track. For anything broader —
        a safety, privacy, account or payment complaint — use the{" "}
        <Link to="/report-and-grievance" className="underline underline-offset-2">
          Report &amp; Grievance
        </Link>{" "}
        page.
      </p>
    ),
  },
  {
    id: "emergency",
    heading: "Emergency situations",
    body: (
      <p>
        HumanLink does not provide emergency response and cannot dispatch help. If life or safety is
        at risk, call your local emergency number immediately. If you are struggling with your mental
        health in India, Tele-MANAS is available on 14416 and KIRAN on 1800-599-0019.
      </p>
    ),
  },
];

function SafetyPage() {
  return (
    <LegalPage
      title="User Safety"
      policyType="safety"
      intro={
        <p>
          Kindness works best alongside caution. This page is practical guidance for staying safe
          while giving and receiving help on HumanLink.
        </p>
      }
      sections={sections}
    />
  );
}
