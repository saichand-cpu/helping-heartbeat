import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, Bullets, type LegalSection } from "@/components/site/LegalPage";

export const Route = createFileRoute("/community-guidelines")({
  head: () => ({
    meta: [
      { title: "Community Guidelines — HumanLink" },
      {
        name: "description",
        content:
          "What's welcome and what's not on HumanLink: respect, honesty, genuine help, privacy — and zero tolerance for scams, harassment and abuse.",
      },
      { property: "og:title", content: "Community Guidelines — HumanLink" },
      {
        property: "og:description",
        content: "The behaviour that keeps the HumanLink community kind and safe.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidelinesPage,
});

const sections: LegalSection[] = [
  {
    id: "spirit",
    heading: "The spirit of HumanLink",
    body: (
      <p>
        HumanLink exists so that a person who needs help can reach a person willing to help. That
        only works when members treat each other with respect and honesty. These guidelines apply to
        profiles, help requests, offers, posts, comments, reviews, stories, messages and calls.
      </p>
    ),
  },
  {
    id: "do",
    heading: "Do",
    body: (
      <Bullets
        items={[
          "Be respectful — assume good intent and keep conversations kind.",
          "Be honest about who you are, what you need and what you can offer.",
          "Provide genuine help, and follow through on what you commit to.",
          "Provide accurate information in requests, offers, profiles and reviews.",
          "Respect privacy — ask before sharing someone else's details.",
          "Communicate responsibly, especially with vulnerable members.",
          "Report suspicious behaviour so our moderation team can review it.",
        ]}
      />
    ),
  },
  {
    id: "dont",
    heading: "Don't",
    body: (
      <Bullets
        items={[
          "Harass, bully, threaten or intimidate anyone.",
          "Scam, defraud or solicit money under false pretences.",
          "Impersonate another person, business, NGO or authority.",
          "Spam members, requests, comments or messages.",
          "Exploit vulnerable people, including children and elderly members.",
          "Share private information about someone without their permission.",
          "Manipulate karma, reputation, reviews or follower counts.",
          "Create fake or duplicate accounts.",
          "Use HumanLink for illegal activity of any kind.",
          "Abuse messaging or calling features.",
        ]}
      />
    ),
  },
  {
    id: "money",
    heading: "Money, donations and financial requests",
    body: (
      <p>
        Be extremely careful with money. HumanLink does not verify financial need, and we do not
        mediate transfers between members. Never send money, gift cards or crypto to someone you do
        not know, and never share OTPs, banking credentials or card details with another member —
        including anyone claiming to be HumanLink staff.
      </p>
    ),
  },
  {
    id: "enforcement",
    heading: "Enforcement",
    body: (
      <>
        <p>
          When content or behaviour breaches these guidelines, our moderation team may take one or
          more of the following actions:
        </p>
        <Bullets
          items={[
            "Warning",
            "Content removal or content restriction",
            "Temporary account restriction",
            "Temporary suspension",
            "Permanent account suspension",
            "Escalation for further review",
          ]}
        />
        <p>
          Every action is logged with the reason and the reviewing administrator. Serious safety
          issues take priority.
        </p>
      </>
    ),
  },
  {
    id: "report",
    heading: "How to report",
    body: (
      <p>
        Use the Report action on a profile or piece of content, or open the{" "}
        <Link to="/report-and-grievance" className="underline underline-offset-2">
          Report &amp; Grievance
        </Link>{" "}
        page. You'll receive a Report ID so you can follow up.
      </p>
    ),
  },
];

function GuidelinesPage() {
  return (
    <LegalPage
      title="Community Guidelines"
      policyType="community"
      intro={
        <p>
          HumanLink is a community of people helping people. These guidelines describe the behaviour
          we expect, and what happens when it isn't met.
        </p>
      }
      sections={sections}
    />
  );
}
