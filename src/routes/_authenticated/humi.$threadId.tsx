import { createFileRoute } from "@tanstack/react-router";
import { HumiWorkspace } from "@/components/humi/HumiWorkspace";

export const Route = createFileRoute("/_authenticated/humi/$threadId")({
  head: () => ({
    meta: [
      { title: "HUMI conversation — HumanLink" },
      {
        name: "description",
        content: "Continue your HUMI conversation: answers, plans, files, and real HumanLink actions in one place.",
      },
      { property: "og:title", content: "HUMI conversation — HumanLink" },
      {
        property: "og:description",
        content: "Your saved HUMI thread on HumanLink — context-aware AI that keeps moving your goal forward.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  return <HumiWorkspace key={threadId} threadId={threadId} />;
}
