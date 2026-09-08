import { createFileRoute } from "@tanstack/react-router";
import { HumiWorkspace } from "@/components/humi/HumiWorkspace";

export const Route = createFileRoute("/_authenticated/humi/")({
  head: () => ({
    meta: [
      { title: "HUMI — AI assistant for thinking, creating & helping | HumanLink" },
      {
        name: "description",
        content:
          "HUMI is HumanLink's general-purpose AI assistant for answers, writing, coding, planning, learning, business, travel and real-world help.",
      },
      { property: "og:title", content: "HUMI — HumanLink's AI assistant" },
      {
        property: "og:description",
        content:
          "Ask HUMI anything, create useful work, understand information, and turn ideas into practical next steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <HumiWorkspace />,
});
