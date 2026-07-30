import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Heart, Sparkles, Users, MessageCircle, Award, Search, ShieldCheck,
  HandHeart, BrainCircuit, MapPin, Star, ArrowRight, Check, Quote,
  Apple, Play, Building2, Stethoscope, GraduationCap, Utensils, Compass, CheckCircle2,
} from "lucide-react";
import heroImg from "@/assets/hero-humanlink.jpg";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HumanLink — Helping Humanity, One Connection at a Time" },
      { name: "description", content: "HumanLink is an AI-powered humanitarian platform that connects people who need help with people, volunteers, NGOs, professionals, and businesses ready to help." },
      { property: "og:title", content: "HumanLink — Helping Humanity, One Connection at a Time" },
      { property: "og:description", content: "AI-powered kindness network. Post a request, offer a hand, earn karma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }),
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-7xl px-6 py-20 md:py-28 ${className}`}>{children}</section>;
}

function Eyebrow({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "brand" }) {
  const colors = tone === "brand"
    ? "bg-brand/10 text-brand border-brand/20"
    : "bg-primary/10 text-primary border-primary/15";
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${colors}`}>
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-hero">
      <Section className="relative grid items-center gap-14 lg:grid-cols-2 pt-10 md:pt-16">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-7">
          <Eyebrow>AI-powered humanitarian network</Eyebrow>
          <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight text-foreground">
            Helping Humanity,
            <br />
            <span className="text-primary">One Connection</span>
            <br />
            at a Time.
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            HumanLink connects people who need help with volunteers, NGOs, and professionals ready to help — powered by AI matching, safe by design.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg" className="rounded-full h-12 px-7 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="rounded-full h-12 px-7 text-base border-border">
                <Play className="mr-2 h-4 w-4" /> Watch Demo
              </Button>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Verified profiles</div>
            <div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /> AI-matched helpers</div>
            <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> Always free to ask</div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-pop">
            <img src={heroImg} alt="Diverse community of people helping each other" width={1600} height={1200} className="w-full h-auto" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.55 }}
            className="absolute -bottom-5 -left-5 bg-card border border-border rounded-2xl p-4 shadow-soft hidden sm:flex items-center gap-3 max-w-[240px]"
          >
            <div className="h-10 w-10 rounded-xl bg-brand/10 grid place-items-center text-brand"><HandHeart className="h-5 w-5" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Just now</div>
              <div className="text-sm font-medium">Maria helped Aria with groceries</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.55 }}
            className="absolute -top-5 -right-5 bg-card border border-border rounded-2xl p-3.5 shadow-soft hidden sm:flex items-center gap-2.5"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center"><Award className="h-4.5 w-4.5 text-primary" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Karma</div>
              <div className="text-sm font-semibold">+10 earned</div>
            </div>
          </motion.div>
        </motion.div>
      </Section>
    </div>
  );
}

/* ---------- STATS BAR (reference style) ---------- */
function Stats() {
  const items = [
    { k: "50K+", v: "People Helped", icon: HandHeart, tint: "text-primary bg-primary/10" },
    { k: "10K+", v: "Volunteers", icon: Users, tint: "text-brand bg-brand/10" },
    { k: "500+", v: "Verified NGOs", icon: Building2, tint: "text-warning bg-warning/10" },
    { k: "25K+", v: "Requests Solved", icon: CheckCircle2, tint: "text-primary bg-primary/10" },
  ];
  return (
    <Section className="!pt-0 !pb-14">
      <div className="rounded-2xl border border-border bg-card px-4 py-6 md:px-8 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border shadow-soft">
        {items.map((s) => (
          <div key={s.v} className="flex items-center gap-3 px-4 py-3">
            <div className={`h-11 w-11 shrink-0 rounded-xl grid place-items-center ${s.tint}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold tabular-nums leading-tight">{s.k}</div>
              <div className="text-xs text-muted-foreground truncate">{s.v}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- HOW IT WORKS (5-step flow) ---------- */
function HowItWorks() {
  const steps = [
    { icon: Search, title: "Describe", text: "Describe your problem in simple words." },
    { icon: BrainCircuit, title: "AI Improves", text: "Our AI improves your request for better reach." },
    { icon: Users, title: "Get Matched", text: "Nearby people & NGOs are notified." },
    { icon: MessageCircle, title: "Connect", text: "Chat and coordinate instantly." },
    { icon: Star, title: "Help & Review", text: "Help is completed. Leave a review." },
  ];
  return (
    <Section className="!py-16">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">How HumanLink Works</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-5">
        {steps.map((s, i) => (
          <motion.div key={s.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="relative text-center px-2">
            {i < steps.length - 1 && (
              <ArrowRight className="hidden md:block absolute top-7 -right-4 h-5 w-5 text-border" aria-hidden />
            )}
            <div className="mx-auto h-14 w-14 rounded-2xl bg-accent grid place-items-center text-primary shadow-soft">
              <s.icon className="h-6 w-6" />
            </div>
            <div className="mt-5 text-sm font-semibold">
              <span className="text-primary mr-1.5">{i + 1}</span>{s.title}
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}


/* ---------- CATEGORIES ---------- */
function Categories() {
  const cats = [
    { icon: Stethoscope, label: "Medical", color: "text-destructive bg-destructive/10" },
    { icon: GraduationCap, label: "Education", color: "text-primary bg-primary/10" },
    { icon: Utensils, label: "Food", color: "text-warning bg-warning/10" },
    { icon: HandHeart, label: "Volunteer", color: "text-brand bg-brand/10" },
    { icon: Building2, label: "NGO", color: "text-brand bg-brand/10" },
    { icon: Users, label: "Community", color: "text-primary bg-primary/10" },
  ];
  return (
    <Section className="!py-16">
      <div className="text-center mb-10">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Help across every category</div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {cats.map((c, i) => (
          <motion.div key={c.label} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors">
            <div className={`h-11 w-11 rounded-xl grid place-items-center ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium">{c.label}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- WHY HUMANLINK ---------- */
function WhyHumanLink() {
  const items = [
    { icon: ShieldCheck, title: "Trusted by design", text: "Verified profiles, ratings, and karma scores keep the community safe." },
    { icon: BrainCircuit, title: "AI-powered matching", text: "Smart suggestions for helpers, categories, and request writing." },
    { icon: MessageCircle, title: "Real-time messaging", text: "Chat, call, and share updates instantly with the people helping you." },
    { icon: MapPin, title: "Hyper-local", text: "Find help around the corner or across the world." },
    { icon: Award, title: "Karma & badges", text: "Build reputation by helping. Climb the global leaderboard." },
    { icon: Heart, title: "Free for everyone", text: "Asking for help is always free. Helping is always rewarded." },
  ];
  return (
    <Section>
      <div className="max-w-2xl mb-14">
        <Eyebrow>Why HumanLink</Eyebrow>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">A platform built around <span className="text-primary">trust</span></h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <motion.div key={it.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="group rounded-3xl border border-border bg-card p-7 hover:-translate-y-1 hover:shadow-soft transition-all duration-300">
            <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.text}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- AI SHOWCASE ---------- */
function AIShowcase() {
  return (
    <Section>
      <div className="grid lg:grid-cols-2 gap-14 items-center">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <Eyebrow>AI Assistant</Eyebrow>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">Your kindness, <span className="text-primary">amplified</span></h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            HUMI helps you write better requests, find the right helpers, translate across languages, and flag emergencies — so help arrives faster.
          </p>
          <ul className="mt-7 space-y-3.5 text-sm">
            {[
              "Improve request descriptions in one tap",
              "Auto-generate titles & categories",
              "Match nearby trusted helpers",
              "Detect emergencies and prioritize routing",
              "Real-time translation across languages",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="h-5 w-5 rounded-full bg-brand/15 grid place-items-center shrink-0">
                  <Check className="h-3 w-3 text-brand" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="relative">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-pop space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 grid place-items-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              HUMI · AI Assistant
            </div>
            <div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground">
              "I need someone to teach my grandma video calling"
            </div>
            <div className="rounded-2xl bg-primary px-4 py-3.5 text-sm text-primary-foreground">
              Suggested title: <b>"Tech-savvy helper to set up video calls with my grandma"</b>
              <div className="mt-2 text-xs opacity-90">Category: Technology · Elder Care · Est. 30 min</div>
            </div>
            <div className="rounded-2xl bg-secondary px-4 py-3 text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> 3 nearby helpers matched
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ---------- IMPACT ---------- */
function Impact() {
  const items = [
    { k: "5,420", v: "Meals delivered" },
    { k: "12,800", v: "Lessons taught" },
    { k: "3,210", v: "Rides given" },
    { k: "920", v: "Emergencies resolved" },
  ];
  return (
    <Section>
      <div className="rounded-3xl bg-primary p-10 md:p-16 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, white 0, transparent 45%), radial-gradient(circle at 85% 80%, white 0, transparent 45%)" }} aria-hidden />
        <div className="relative grid gap-10 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Community Impact
            </div>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">Real stories. Real impact.</h2>
            <p className="mt-4 opacity-90 max-w-md leading-relaxed">Every request is a story. Together, our community is writing thousands of them every week.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {items.map((s) => (
              <div key={s.v} className="rounded-2xl bg-white/12 backdrop-blur-sm border border-white/15 p-5">
                <div className="text-3xl font-bold tabular-nums">{s.k}</div>
                <div className="text-xs opacity-90 mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- SUCCESS STORIES ---------- */
function SuccessStories() {
  const stories = [
    { name: "Aria, 24", text: "Found someone to walk my dog while I was in the ER. I'm so grateful.", tag: "Emergency", color: "text-destructive bg-destructive/10" },
    { name: "Daniel, 67", text: "A neighbor taught me how to video call my grandkids. Life-changing.", tag: "Technology", color: "text-primary bg-primary/10" },
    { name: "Priya, 32", text: "Got help with groceries during the storm. The community is real.", tag: "Food", color: "text-warning bg-warning/10" },
  ];
  return (
    <Section>
      <div className="max-w-2xl mb-14">
        <Eyebrow>Success Stories</Eyebrow>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">Real people. Real kindness.</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {stories.map((s, i) => (
          <motion.div key={s.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="rounded-3xl border border-border bg-card p-7 hover:shadow-soft transition-shadow">
            <Quote className="h-7 w-7 text-primary/40" />
            <p className="mt-4 text-[15px] leading-relaxed text-foreground">"{s.text}"</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm font-semibold">{s.name}</div>
              <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${s.color}`}>{s.tag}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- TOP HELPERS ---------- */
function TopHelpers() {
  const helpers = [
    { name: "Sara M.", karma: 2840, badge: "Trusted" },
    { name: "Kenji T.", karma: 2210, badge: "Trusted" },
    { name: "Lin Q.", karma: 1980, badge: "Rising" },
    { name: "Omar A.", karma: 1720, badge: "Rising" },
  ];
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
        <div>
          <Eyebrow tone="brand">Top Helpers</Eyebrow>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">This week's kindness leaders</h2>
        </div>
        <Link to="/leaderboard"><Button variant="outline" className="rounded-full">View leaderboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        {helpers.map((h, i) => (
          <motion.div key={h.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="rounded-3xl border border-border bg-card p-6 text-center hover:shadow-soft hover:-translate-y-1 transition-all">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary grid place-items-center text-primary-foreground text-xl font-bold shadow-sm">
              {h.name.charAt(0)}
            </div>
            <div className="mt-4 font-semibold">{h.name}</div>
            <div className="text-xs text-muted-foreground">{h.badge} Helper</div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand px-3 py-1 text-xs font-semibold">
              <Award className="h-3 w-3" /> {h.karma.toLocaleString()} karma
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- LEADERSHIP (clean, light) ---------- */
function LeadershipVoice() {
  const people = [
    { role: "Founder & CEO", name: "Saichand", initials: "S", title: "Founder & CEO · HumanLink",
      quote: "Humanity becomes stronger when people help each other. HumanLink began the day that belief turned into action — a place where a stranger's kindness is only one tap away." },
    { role: "Managing Director", name: "Varun K", initials: "VK", title: "Managing Director · HumanLink",
      quote: "Scaling a global network requires hyper-fast engineering and rock-solid trust. We are removing every unnecessary gateway between people who need help and people ready to give it." },
  ];
  return (
    <Section>
      <div className="max-w-2xl mb-12">
        <Eyebrow>Leadership</Eyebrow>
        <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">The people behind HumanLink</h2>
        <p className="mt-4 text-lg text-muted-foreground">One belief, two operators — building the kindness network in the open.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {people.map((p, i) => (
          <motion.div key={p.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="rounded-3xl border border-border bg-card p-8 md:p-10">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold">{p.role}</div>
            <Quote className="mt-6 h-8 w-8 text-primary/30" />
            <p className="mt-3 text-lg leading-relaxed text-foreground">"{p.quote}"</p>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary grid place-items-center text-primary-foreground font-bold">
                {p.initials}
              </div>
              <div>
                <div className="text-base font-semibold">— {p.name}</div>
                <div className="text-xs text-muted-foreground">{p.title}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
        className="mt-6 rounded-3xl border border-border bg-secondary/50 p-6 flex flex-wrap items-center gap-3">
        <Compass className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm text-foreground/80 flex-1 min-w-[240px]">
          Our vision: the world's most trusted, zero-latency peer-to-peer help network — real-time chat, live calling, and interactive maps in one canvas.
        </p>
        <div className="flex flex-wrap gap-2">
          {["Real-time chat", "Voice calls", "Live maps", "Trusted profiles"].map((t) => (
            <span key={t} className="text-xs px-3 py-1 rounded-full bg-card border border-border text-foreground/70">{t}</span>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}

/* ---------- TRUSTED BY THOUSANDS ---------- */
function Testimonials() {
  const t = [
    { name: "Rahul Sharma", initials: "RS", text: "I got a blood donor in just 30 minutes. HumanLink is a lifesaver!" },
    { name: "NGO Hope", initials: "NH", text: "We received amazing volunteers for our NGO campaign." },
    { name: "GreenTech Pvt Ltd", initials: "GT", text: "HumanLink helps our CSR programs reach the right people." },
  ];
  return (
    <Section className="!py-16">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">Trusted by Thousands</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {t.map((x, i) => (
          <motion.div key={x.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-3.5 w-3.5 fill-warning text-warning" />)}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">"{x.text}"</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold">{x.initials}</div>
              <div className="text-sm font-medium">— {x.name}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- DOWNLOAD APP (blue banner) ---------- */
function DownloadApp() {
  return (
    <Section className="!py-14">
      <div className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center overflow-hidden relative">
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Take HumanLink With You</h2>
          <p className="mt-3 text-sm md:text-base text-primary-foreground/85 max-w-md">
            Download the app and help people anytime, anywhere.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl h-12 px-5 bg-foreground text-background hover:bg-foreground/90 justify-start">
              <Apple className="mr-2 h-5 w-5" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] opacity-80">Download on the</span>
                <span className="block text-sm font-semibold">App Store</span>
              </span>
            </Button>
            <Button size="lg" className="rounded-xl h-12 px-5 bg-foreground text-background hover:bg-foreground/90 justify-start">
              <Play className="mr-2 h-5 w-5" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] opacity-80">GET IT ON</span>
                <span className="block text-sm font-semibold">Google Play</span>
              </span>
            </Button>
          </div>
        </div>
        <div className="relative mx-auto">
          <div className="w-56 h-[420px] rounded-[2.5rem] bg-card border-8 border-foreground/90 shadow-pop p-3 relative">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 h-4 w-20 rounded-full bg-foreground/90" />
            <div className="h-full w-full rounded-[1.8rem] bg-secondary p-4 pt-9 space-y-2.5 overflow-hidden">
              <div className="text-[10px] font-semibold text-muted-foreground">Good afternoon</div>
              <div className="text-lg font-bold text-foreground">How can we help?</div>
              <div className="rounded-xl bg-card border border-border p-2.5 shadow-soft">
                <div className="flex items-center gap-1.5 text-[10px] text-primary font-semibold"><Sparkles className="h-3 w-3" /> AI ASSISTANT</div>
                <div className="mt-1 text-xs font-medium text-foreground">3 helpers near you</div>
              </div>
              <div className="rounded-xl bg-primary text-primary-foreground p-2.5 text-xs font-medium">Need Help</div>
              <div className="rounded-xl bg-brand text-white p-2.5 text-xs font-medium">Offer Help</div>
              <div className="rounded-xl bg-destructive text-destructive-foreground p-2.5 text-xs font-medium">Emergency</div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}


/* ---------- FAQ ---------- */
function FAQ() {
  const faqs = [
    { q: "Is HumanLink free to use?", a: "Yes — posting requests and helping others is always free. Optional premium plans unlock priority matching and analytics." },
    { q: "How are helpers verified?", a: "Profiles include identity checks, reviews, and karma points that grow with completed help." },
    { q: "Can I help if I have no money?", a: "Absolutely. Most help on HumanLink is time, skills, or simple companionship." },
    { q: "Is my data safe?", a: "We use industry-standard encryption and strict access controls. You always control what's public on your profile." },
  ];
  return (
    <Section>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">Questions, answered</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i-${i}`} className="rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

/* ---------- CTA ---------- */
function CTA() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-12 md:p-16 text-center shadow-soft">
        <div className="absolute inset-0 bg-gradient-hero opacity-70" aria-hidden />
        <div className="relative">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to make kindness your superpower?</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">Join HumanLink today. Post a request, lend a hand, or both.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="rounded-full h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                Create your account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/requests">
              <Button size="lg" variant="outline" className="rounded-full h-12 px-7 border-border">Browse requests</Button>
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- LANDING ---------- */
function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Categories />
        <HowItWorks />
        <WhyHumanLink />
        <AIShowcase />
        <Impact />
        <SuccessStories />
        <TopHelpers />
        <LeadershipVoice />
        <Testimonials />
        <DownloadApp />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
