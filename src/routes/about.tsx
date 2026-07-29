import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — HumanLink" },
      { name: "description", content: "HumanLink connects people who need help with people ready to help. Learn our story." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Our story</div>
        <h1 className="mt-3 text-5xl font-bold">Kindness, by design.</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          HumanLink started with a simple belief: most people want to help, they just need an easy way to be useful. We built a platform that turns small moments of intent into real human connection — across streets, cities and continents.
        </p>
        <p className="mt-4 text-muted-foreground">
          Whether you need a tutor for an hour, a ride to the doctor, or a friendly voice during a hard week, HumanLink connects you with someone nearby who's ready to help. Our AI gently nudges you to be clear, kind and safe — and matches you with the right people, fast.
        </p>
        <div className="mt-10 flex gap-3">
          <Link to="/auth"><Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">Join HumanLink</Button></Link>
          <Link to="/requests"><Button variant="outline">Browse requests</Button></Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
