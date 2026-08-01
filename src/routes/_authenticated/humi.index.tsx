import { createFileRoute } from "@tanstack/react-router";
import { HumiWorkspace } from "@/components/humi/HumiWorkspace";

export const Route = createFileRoute("/_authenticated/humi/")({
  head: () => ({
    meta: [
      { title: "HUMI — HumanLink's AI assistant" },
      {
        name: "description",
        content:
          "HUMI is HumanLink's AI operating system: answers, plans, code, and real actions — post help requests, find helpers, NGOs and volunteers.",
      },
      { property: "og:title", content: "HUMI — HumanLink's AI assistant" },
      {
        property: "og:description",
        content: "Think, create, and take real-world action with HUMI, the AI built into HumanLink.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <HumiWorkspace />,
});
