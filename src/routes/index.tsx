import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Heart, Sparkles, Users, MessageCircle, Award, Search, ShieldCheck,
  HandHeart, BrainCircuit, MapPin, Star, ArrowRight, Check, Quote,
  Building2, Stethoscope, GraduationCap, Utensils, Compass, CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { HumanNetwork3D } from "@/components/site/HumanNetwork3D";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const SITE_URL = "https://www.humanlink.in";
const OG_IMAGE = `${SITE_URL}/humanlink-logo.jpeg`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HumanLink — Helping Humanity, One Connection at a Time" },
      { name: "description", content: "HumanLink is an AI-powered community platform for asking for help, volunteering, finding jobs, sharing skills, supporting NGOs, promoting businesses and connecting with people who can help." },
      { name: "keywords", content: "HumanLink, help platform India, volunteer platform, NGO platform, ask for help, offer help, community platform, jobs India, HR jobs, student skills, tutoring, local business promotion, social impact platform, Hyderabad" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "HumanLink — Helping Humanity, One Connection at a Time" },
      { property: "og:description", content: "Ask for help, offer help, volunteer, discover opportunities, share skills, support NGOs and connect with people and businesses through HumanLink." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "HumanLink — Helping Humanity, One Connection at a Time" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "HumanLink — Helping Humanity, One Connection at a Time" },
      { name: "twitter:description", content: "A community platform for help, volunteering, jobs, skills, NGOs, professionals and businesses." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main>
      <Hero />
      <Stats />
      <HowItWorks />
      <Categories />
    </main>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }),
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-7xl px-6 py-20 md:py-28 ${className}`}>{children}</section>;
}

function Eyebrow({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "brand" }) {
  const colors = tone === "brand" ? "bg-brand/10 text-brand border-brand/20" : "bg-primary/10 text-primary border-primary/15";
  return <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${colors}`}><Sparkles className="h-3.5 w-3.5" />{children}</div>;
}

function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-hero">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_75%_35%,hsl(var(--primary)/.10),transparent_28%),radial-gradient(circle_at_85%_75%,hsl(var(--brand)/.08),transparent_25%)]" />
      <Section className="relative grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr] pt-10 md:pt-16">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="relative z-10 space-y-7">
          <Eyebrow>AI-powered global help network</Eyebrow>
          <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight text-foreground">Helping Humanity,<br /><span className="text-primary">One Connection</span><br />at a Time.</motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl leading-relaxed">HumanLink connects people who need help with people ready to help — volunteers, NGOs, professionals, students, HR teams, job seekers, teachers, and businesses — supported by HUMI AI and built around trust.</motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3"><Link to="/auth"><Button size="lg" className="rounded-full h-12 px-7 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button></Link><Link to="/about"><Button size="lg" variant="outline" className="rounded-full h-12 px-7 text-base border-border">Explore HumanLink</Button></Link></motion.div>
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Trust & safety</div><div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /> HUMI AI</div><div className="flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> Free to ask for help</div></motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative min-h-[520px] flex items-center justify-center">
          <HumanNetwork3D />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.55 }} className="absolute bottom-2 left-4 hidden sm:flex items-center gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-soft backdrop-blur-md max-w-[240px]"><div className="h-10 w-10 rounded-xl bg-brand/10 grid place-items-center text-brand"><HandHeart className="h-5 w-5" /></div><div><div className="text-xs text-muted-foreground">HumanLink</div><div className="text-sm font-medium">A little help can change a day.</div></div></motion.div>
        </motion.div>
      </Section>
    </div>
  );
}

function Stats() {
  const items = [
    { k: "Global", v: "Community ready to grow", icon: HandHeart, tint: "text-primary bg-primary/10" },
    { k: "AI", v: "Assistance with HUMI", icon: BrainCircuit, tint: "text-brand bg-brand/10" },
    { k: "Trust", v: "Profiles, reviews & karma", icon: ShieldCheck, tint: "text-warning bg-warning/10" },
    { k: "Human", v: "Help powered by people", icon: Heart, tint: "text-primary bg-primary/10" },
  ];
  return <Section className="!pt-0 !pb-14"><div className="rounded-2xl border border-border bg-card px-4 py-6 md:px-8 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border shadow-soft">{items.map((s) => <div key={s.v} className="flex items-center gap-3 px-4 py-3"><div className={`h-11 w-11 shrink-0 rounded-xl grid place-items-center ${s.tint}`}><s.icon className="h-5 w-5" /></div><div className="min-w-0"><div className="text-2xl font-bold leading-tight">{s.k}</div><div className="text-xs text-muted-foreground truncate">{s.v}</div></div></div>)}</div></Section>;
}

function HowItWorks() {
  const steps = [{ icon: Search, title: "Describe", text: "Describe what you need in simple words." }, { icon: BrainCircuit, title: "HUMI Helps", text: "AI can improve, organize, translate, and guide." }, { icon: Users, title: "Get Matched", text: "Discover relevant people and organizations." }, { icon: MessageCircle, title: "Connect", text: "Chat and coordinate help safely." }, { icon: Star, title: "Help & Review", text: "Complete the help and build reputation." }];
  return <Section className="!py-16"><h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">How HumanLink Works</h2><div className="mt-12 grid gap-6 md:grid-cols-5">{steps.map((s, i) => <motion.div key={s.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative text-center px-2">{i < steps.length - 1 && <ArrowRight className="hidden md:block absolute top-7 -right-4 h-5 w-5 text-border" aria-hidden />}<div className="mx-auto h-14 w-14 rounded-2xl bg-accent grid place-items-center text-primary shadow-soft"><s.icon className="h-6 w-6" /></div><div className="mt-5 text-sm font-semibold"><span className="text-primary mr-1.5">{i + 1}</span>{s.title}</div><p className="mt-2 text-xs text-muted-foreground leading-relaxed">{s.text}</p></motion.div>)}</div></Section>;
}

function Categories() {
  const cats = [{ icon: Stethoscope, label: "Medical", color: "text-destructive bg-destructive/10" }, { icon: GraduationCap, label: "Education", color: "text-primary bg-primary/10" }, { icon: Utensils, label: "Food", color: "text-warning bg-warning/10" }, { icon: HandHeart, label: "Volunteer", color: "text-brand bg-brand/10" }, { icon: Building2, label: "NGO & CSR", color: "text-brand bg-brand/10" }, { icon: Users, label: "Community", color: "text-primary bg-primary/10" }];
  return <Section className="!py-16"><div className="text-center mb-10"><div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Help across every category</div></div><div className="grid grid-cols-3 md:grid-cols-6 gap-4">{cats.map((c, i) => <motion.div key={c.label} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors"><div className={`h-11 w-11 rounded-xl grid place-items-center ${c.color}`}><c.icon className="h-5 w-5" /></div><div className="text-sm font-medium">{c.label}</div></motion.div>)}</div></Section>;
}
