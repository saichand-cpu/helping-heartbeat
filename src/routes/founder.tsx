import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, Sparkles, Target, Eye, ArrowRight, Quote } from "lucide-react";

export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: "Founder Story — HumanLink | L. Saichand, Hyderabad" },
      { name: "description", content: "How HumanLink began — founded by L. Saichand in Hyderabad, India, on a simple belief that humanity becomes stronger when people help each other." },
      { property: "og:title", content: "Founder Story — HumanLink | L. Saichand" },
      { property: "og:description", content: "Built by L. Saichand in Hyderabad to make helping people as simple as sending a message." },
    ],
  }),
  component: FounderPage,
});

const stats = [
  { label: "Mission", value: "Kindness", icon: Heart },
  { label: "Vision", value: "Humanity First", icon: Eye },
  { label: "Built on", value: "Trust", icon: Shield },
  { label: "Powered by", value: "Community", icon: Users },
];

const timeline = [
  { year: "The Spark", title: "A simple realization", text: "Asking for help is often harder than giving it. Many people stay silent because they fear judgment or don't know where to turn." },
  { year: "The Idea", title: "Bridging the gap", text: "Millions need help. Millions want to help. Yet they never find each other. HumanLink was imagined as that bridge." },
  { year: "The Build", title: "Compassion meets technology", text: "A safe, verified, transparent platform where helpers earn reputation through real impact — not vanity metrics." },
  { year: "Today", title: "A growing community", text: "Every request answered strengthens trust. Every helper makes the world a little kinder." },
];

const missionCards = [
  { icon: Target, title: "Our Mission", text: "Make helping people as simple as sending a message." },
  { icon: Eye, title: "Our Vision", text: "Build the world's largest community where humanity comes first." },
  { icon: Sparkles, title: "Our Promise", text: "Every action contributes to a kinder, more connected world." },
];

function FounderPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-brand opacity-20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative grid md:grid-cols-[1fr_320px] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Heart className="h-3.5 w-3.5 text-primary" /> Founder Story
            </div>
            <h1 className="mt-5 text-5xl md:text-7xl font-bold tracking-tight">
              Built from a simple <span className="bg-gradient-brand bg-clip-text text-transparent">belief</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              Humanity becomes stronger when people help each other. HumanLink began the day that belief turned into action.
            </p>
            <p className="mt-6 text-sm font-medium text-muted-foreground">— L. Saichand, Founder · Hyderabad, India</p>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
            <div className="aspect-square rounded-[2rem] glass shadow-pop p-1 rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="h-full w-full rounded-[1.7rem] bg-gradient-brand flex items-center justify-center text-primary-foreground">
                <div className="text-center">
                  <div className="mx-auto h-24 w-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-bold">LS</div>
                  <div className="mt-4 text-xl font-semibold">L. Saichand</div>
                  <div className="text-sm opacity-90">Founder, HumanLink</div>
                  <div className="text-xs opacity-75 mt-1">Hyderabad, India</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 glass rounded-2xl px-4 py-3 shadow-soft">
              <div className="text-xs text-muted-foreground">Believes in</div>
              <div className="text-sm font-semibold">Kindness at scale</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 -mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5 shadow-soft">
              <s.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="text-xl font-bold">{s.value}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* The Story */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold">The Story</h2>
          <p className="mt-3 text-muted-foreground">Why HumanLink had to exist.</p>
        </div>
        <div className="space-y-6 text-lg leading-relaxed text-foreground/90">
          {[
            "HumanLink was not created as just another social platform. It was born from a simple belief — that humanity becomes stronger when people help each other.",
            "There are millions of people around us who need help every day. Some need guidance, some need emotional support, some need blood donations, jobs, education, financial assistance, or simply someone willing to listen. At the same time, there are millions of people who genuinely want to help, but never know who needs them.",
            "HumanLink bridges that gap.",
            "During difficult phases in my own life, I realized that asking for help is often harder than giving it. Many people stay silent because they fear judgment or don't know where to turn. That experience inspired me to build a platform where kindness becomes accessible, trusted, and meaningful.",
            "HumanLink connects people who need help with people who are willing to help — through a safe, verified, and transparent community. Every action contributes to a better world. Helpers earn reputation through real impact instead of social media likes. Every request answered strengthens trust.",
            "This platform is built on compassion, trust, transparency, and technology.",
          ].map((p, i) => (
            <motion.p key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              {p}
            </motion.p>
          ))}
        </div>

        <motion.blockquote initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="mt-12 glass rounded-3xl p-8 shadow-soft border-l-4 border-primary">
          <Quote className="h-8 w-8 text-primary mb-3" />
          <p className="text-xl md:text-2xl font-medium italic">
            "Our mission is to make helping people as simple as sending a message."
          </p>
          <footer className="mt-4 text-sm text-muted-foreground">— L. Saichand, Founder of HumanLink · Hyderabad, India</footer>
        </motion.blockquote>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">The Journey</h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
          <div className="space-y-10">
            {timeline.map((t, i) => (
              <motion.div key={t.year} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className={`relative grid md:grid-cols-2 gap-6 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div className={`pl-12 md:pl-0 ${i % 2 === 0 ? "md:text-right md:pr-12" : "md:pl-12"}`}>
                  <div className="text-xs uppercase tracking-widest text-primary font-semibold">{t.year}</div>
                  <h3 className="mt-1 text-2xl font-bold">{t.title}</h3>
                  <p className="mt-2 text-muted-foreground">{t.text}</p>
                </div>
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-gradient-brand ring-4 ring-background shadow-glow" />
                <div className="hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission/Vision cards */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-4">
          {missionCards.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass rounded-3xl p-8 shadow-soft hover:shadow-pop hover:-translate-y-1 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-primary-foreground shadow-glow">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{c.title}</h3>
              <p className="mt-2 text-muted-foreground">{c.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-brand p-12 md:p-16 text-primary-foreground shadow-pop">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold max-w-2xl">Join the community where humanity comes first.</h2>
            <p className="mt-4 max-w-xl opacity-90">Every helper. Every request. Every kind word. They all add up to something bigger than us.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Join HumanLink <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
