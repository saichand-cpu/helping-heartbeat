import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Heart, Sparkles, Users, MessageCircle, Award, Search, ShieldCheck,
  HandHeart, BrainCircuit, MapPin, Star, ArrowRight, Check, Quote,
} from "lucide-react";
import heroImg from "@/assets/hero-humanlink.jpg";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HumanLink — Helping Begins With One Click" },
      { name: "description", content: "HumanLink connects people who need help with people who are ready to help. AI-powered matching, real community, real impact." },
      { property: "og:title", content: "HumanLink — Helping Begins With One Click" },
      { property: "og:description", content: "Join the kindness network. Post a request, offer a hand, earn karma." },
    ],
  }),
  component: Landing,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-7xl px-6 py-20 md:py-28 ${className}`}>{children}</section>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      {children}
    </div>
  );
}

function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-90" aria-hidden />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" aria-hidden />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand/25 blur-3xl animate-pulse-glow" aria-hidden />

      <Section className="relative grid items-center gap-10 lg:grid-cols-2 pt-10 md:pt-14">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-6">
          <Eyebrow>Connecting People Through Kindness</Eyebrow>
          <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
            Helping Begins With <span className="text-gradient-brand">One Click</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl">
            HumanLink connects people who need help with people who are ready to help. Powered by AI matching, trusted by a global community.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-brand text-primary-foreground border-0 shadow-glow h-12 px-6 text-base">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="h-12 px-6 text-base glass border-border">
                Become a Helper
              </Button>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Verified profiles</div>
            <div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /> AI-matched helpers</div>
            <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> 100% free to ask</div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-brand opacity-20 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[2rem] glass shadow-pop">
            <img src={heroImg} alt="Diverse people raising hands to help" width={1600} height={1200} className="w-full h-auto" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-soft hidden sm:flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-brand grid place-items-center text-primary-foreground"><HandHeart className="h-5 w-5" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Just now</div>
              <div className="text-sm font-medium">Maria helped Aria with groceries</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute -top-6 -right-6 glass rounded-2xl p-4 shadow-soft hidden sm:flex items-center gap-3"
          >
            <Award className="h-5 w-5 text-brand" />
            <div className="text-sm font-semibold">+10 Karma earned</div>
          </motion.div>
        </motion.div>
      </Section>

      {/* Stats strip */}
      <Section className="!py-10">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="glass rounded-3xl px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-soft">
          {[
            { k: "120K+", v: "Active members" },
            { k: "45K", v: "Requests fulfilled" },
            { k: "98%", v: "Positive reviews" },
            { k: "60+", v: "Countries reached" },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <div className="text-3xl font-bold text-gradient-brand">{s.k}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
            </div>
          ))}
        </motion.div>
      </Section>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Search, title: "Post or browse", text: "Share what you need or scroll through real requests from people nearby." },
    { icon: BrainCircuit, title: "AI matches help", text: "Our assistant suggests the right helpers and improves your request." },
    { icon: HandHeart, title: "Get help, give back", text: "Connect, chat, and complete the task. Karma points unlock badges." },
  ];
  return (
    <Section>
      <div className="max-w-2xl mb-12">
        <Eyebrow>How HumanLink Works</Eyebrow>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold">Three steps to make kindness happen</h2>
        <p className="mt-3 text-muted-foreground">From a stuck moment to a smile — in minutes.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div key={s.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="glass rounded-3xl p-6 hover:shadow-pop transition-shadow group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-brand grid place-items-center text-primary-foreground shadow-glow group-hover:scale-110 transition-transform">
              <s.icon className="h-6 w-6" />
            </div>
            <div className="mt-5 text-xs font-semibold text-muted-foreground">STEP {i + 1}</div>
            <h3 className="mt-1 text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function WhyHumanLink() {
  const items = [
    { icon: ShieldCheck, title: "Trusted by design", text: "Verified profiles, ratings, and karma scores keep the community safe." },
    { icon: BrainCircuit, title: "AI-powered matching", text: "Smart suggestions for helpers, categories, and request copy." },
    { icon: MessageCircle, title: "Real-time messaging", text: "Chat instantly with helpers, share photos and updates." },
    { icon: MapPin, title: "Hyper-local", text: "Find help around the corner or across the world." },
    { icon: Award, title: "Karma & badges", text: "Build reputation by helping. Climb the leaderboard." },
    { icon: Heart, title: "Free for everyone", text: "Asking for help is always free. Helping is always rewarded." },
  ];
  return (
    <Section>
      <div className="max-w-2xl mb-12">
        <Eyebrow>Why HumanLink</Eyebrow>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold">A platform built around <span className="text-gradient-brand">trust</span></h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <motion.div key={it.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="group relative rounded-3xl border border-border bg-card p-6 hover:-translate-y-1 hover:shadow-pop transition-all duration-300">
            <div className="h-11 w-11 rounded-xl bg-accent grid place-items-center text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.text}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function AIShowcase() {
  return (
    <Section>
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <Eyebrow>AI Assistant</Eyebrow>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">Your kindness, <span className="text-gradient-brand">amplified</span></h2>
          <p className="mt-4 text-muted-foreground">
            Our AI helps you write better requests, find the right helpers, translate across languages, and flag emergencies — so help arrives faster.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {["Improve request descriptions", "Auto-generate titles & categories", "Match nearby trusted helpers", "Detect emergencies and prioritize", "Translate across languages"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-brand" /> {t}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-brand opacity-20 blur-2xl" aria-hidden />
          <div className="relative glass rounded-3xl p-6 shadow-pop space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Assistant
            </div>
            <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
              "I need someone to teach my grandma video calling"
            </div>
            <div className="rounded-2xl bg-gradient-brand px-4 py-3 text-sm text-primary-foreground shadow-glow">
              Suggested title: <b>"Tech-savvy helper to set up video calls with my grandma"</b>
              <div className="mt-2 text-xs opacity-80">Category: Technology • Elder Care • Estimated 30 min</div>
            </div>
            <div className="rounded-2xl bg-muted px-4 py-3 text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> 3 nearby helpers matched
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

function Impact() {
  const items = [
    { k: "5,420", v: "Meals delivered" },
    { k: "12,800", v: "Lessons taught" },
    { k: "3,210", v: "Rides given" },
    { k: "920", v: "Emergencies resolved" },
  ];
  return (
    <Section>
      <div className="rounded-[2rem] bg-gradient-brand p-10 md:p-14 text-primary-foreground relative overflow-hidden shadow-pop">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 80%, white 0, transparent 40%)" }} aria-hidden />
        <div className="relative grid gap-8 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold">Community Impact</h2>
            <p className="mt-3 opacity-90 max-w-md">Every help request is a story. Together, our community is writing thousands of them every week.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {items.map((s) => (
              <div key={s.v} className="rounded-2xl bg-white/15 backdrop-blur p-5">
                <div className="text-3xl font-bold">{s.k}</div>
                <div className="text-xs opacity-90">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function SuccessStories() {
  const stories = [
    { name: "Aria, 24", text: "Found someone to walk my dog while I was in the ER. I'm so grateful.", tag: "Emergency" },
    { name: "Daniel, 67", text: "A neighbor taught me how to video call my grandkids. Life-changing.", tag: "Technology" },
    { name: "Priya, 32", text: "Got help with groceries during the storm. The community is real.", tag: "Food" },
  ];
  return (
    <Section>
      <div className="max-w-2xl mb-12">
        <Eyebrow>Success Stories</Eyebrow>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold">Real people. Real kindness.</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {stories.map((s, i) => (
          <motion.div key={s.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="glass rounded-3xl p-6 shadow-soft hover:shadow-pop transition-shadow">
            <Quote className="h-6 w-6 text-primary opacity-50" />
            <p className="mt-3 text-sm leading-relaxed">{s.text}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm font-semibold">{s.name}</div>
              <span className="text-xs rounded-full bg-accent px-2 py-1">{s.tag}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function TopHelpers() {
  const helpers = [
    { name: "Sara M.", karma: 2840, badge: "Trusted" },
    { name: "Kenji T.", karma: 2210, badge: "Trusted" },
    { name: "Lin Q.", karma: 1980, badge: "Rising" },
    { name: "Omar A.", karma: 1720, badge: "Rising" },
  ];
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <Eyebrow>Top Helpers</Eyebrow>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">This week's kindness leaders</h2>
        </div>
        <Link to="/auth"><Button variant="outline">View leaderboard</Button></Link>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {helpers.map((h, i) => (
          <motion.div key={h.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="rounded-3xl border border-border bg-card p-6 text-center hover:shadow-pop transition-shadow">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground text-xl font-bold shadow-glow">
              {h.name.charAt(0)}
            </div>
            <div className="mt-3 font-semibold">{h.name}</div>
            <div className="text-xs text-muted-foreground">{h.badge} Helper</div>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold">
              <Award className="h-3 w-3 text-brand" /> {h.karma} karma
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function Testimonials() {
  const t = [
    { name: "Elena R.", role: "Volunteer, Madrid", text: "HumanLink turned my afternoons into something meaningful. I've met incredible people." },
    { name: "Jamal P.", role: "Community organizer", text: "We used HumanLink during the floods to coordinate help in real time. It saved lives." },
    { name: "Hana K.", role: "Student", text: "Tutoring requests on HumanLink helped me find a mentor and now I help others too." },
  ];
  return (
    <Section>
      <div className="max-w-2xl mb-12 mx-auto text-center">
        <Eyebrow>Testimonials</Eyebrow>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold">Loved by the kindest people</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {t.map((x, i) => (
          <motion.div key={x.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="rounded-3xl border border-border bg-card p-6">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-brand text-brand" />)}
            </div>
            <p className="mt-3 text-sm leading-relaxed">"{x.text}"</p>
            <div className="mt-4">
              <div className="text-sm font-semibold">{x.name}</div>
              <div className="text-xs text-muted-foreground">{x.role}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function FAQ() {
  const faqs = [
    { q: "Is HumanLink free to use?", a: "Yes — posting requests and helping others is always free. Optional premium plans unlock priority and analytics." },
    { q: "How are helpers verified?", a: "Profiles include identity checks, reviews, and karma points that grow with completed help." },
    { q: "Can I help if I have no money?", a: "Absolutely. Most help on HumanLink is time, skills, or simple companionship." },
    { q: "Is my data safe?", a: "We use industry-standard encryption and strict access controls. You control what's public on your profile." },
  ];
  return (
    <Section>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">Questions, answered</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i-${i}`} className="glass rounded-2xl px-5 border-0">
              <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

function CTA() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-[2rem] glass p-10 md:p-16 text-center shadow-pop">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-60 w-60 rounded-full bg-gradient-brand opacity-30 blur-3xl animate-pulse-glow" aria-hidden />
        <h2 className="relative text-4xl md:text-5xl font-bold">Ready to make kindness your superpower?</h2>
        <p className="relative mt-3 text-muted-foreground max-w-xl mx-auto">Join HumanLink today. Post a request, lend a hand, or both.</p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-brand text-primary-foreground border-0 shadow-glow h-12 px-6">
              Create your account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/requests">
            <Button size="lg" variant="outline" className="h-12 px-6">Browse requests</Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyHumanLink />
        <AIShowcase />
        <Impact />
        <SuccessStories />
        <TopHelpers />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
