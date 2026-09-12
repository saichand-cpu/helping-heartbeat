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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HumanLink — Helping Humanity, One Connection at a Time" },
      { name: "description", content: "HumanLink connects people who need help with people, volunteers, NGOs, professionals, and businesses ready to help, with HUMI AI assistance." },
      { property: "og:title", content: "HumanLink — Helping Humanity, One Connection at a Time" },
      { property: "og:description", content: "A trusted global network for people who need help and people ready to help." },
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
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl leading-relaxed">HumanLink connects people who need help with people ready to help — volunteers, NGOs, professionals, and businesses — supported by HUMI AI and built around trust.</motion.p>
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

function WhyHumanLink() {
  const items = [{ icon: ShieldCheck, title: "Trust-first community", text: "Profiles, reviews, reputation, reporting, and verification create stronger signals of trust." }, { icon: BrainCircuit, title: "HUMI AI", text: "Get help with knowledge, writing, coding, education, careers, business, research, planning, and HumanLink tasks." }, { icon: MessageCircle, title: "Meaningful connections", text: "Connect with people, volunteers, NGOs, professionals, and businesses around a real need." }, { icon: MapPin, title: "Local or global", text: "Find relevant help nearby or discover opportunities across communities and countries." }, { icon: Award, title: "Karma & reputation", text: "Build a record of positive contributions through completed help and community feedback." }, { icon: Heart, title: "Human at the center", text: "Technology makes the connection easier. People create the impact." }];
  return <Section><div className="max-w-2xl mb-14"><Eyebrow>Why HumanLink</Eyebrow><h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">A platform built around <span className="text-primary">trust</span></h2></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((it, i) => <motion.div key={it.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="group rounded-3xl border border-border bg-card p-7 hover:-translate-y-1 hover:shadow-soft transition-all duration-300"><div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center text-primary"><it.icon className="h-5 w-5" /></div><h3 className="mt-5 text-lg font-semibold">{it.title}</h3><p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.text}</p></motion.div>)}</div></Section>;
}

function AIShowcase() {
  const capabilities = ["Answer questions and explain complex topics", "Solve maths and science problems step by step", "Write, rewrite, translate, summarize, and brainstorm", "Help with coding, debugging, and technical planning", "Support study, careers, resumes, interviews, business, and research", "Create and improve HumanLink requests, matching, and safety guidance"];
  return <Section><div className="grid lg:grid-cols-2 gap-14 items-center"><motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}><Eyebrow>HUMI · AI Assistant</Eyebrow><h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">More than a helper. <span className="text-primary">An AI companion.</span></h2><p className="mt-4 text-lg text-muted-foreground leading-relaxed">HUMI is HumanLink's general-purpose AI assistant — designed to help you learn, create, solve problems, plan, build, and navigate HumanLink.</p><ul className="mt-7 space-y-3.5 text-sm">{capabilities.map((t) => <li key={t} className="flex items-center gap-3"><span className="h-5 w-5 rounded-full bg-brand/15 grid place-items-center shrink-0"><Check className="h-3 w-3 text-brand" /></span>{t}</li>)}</ul><Link to="/humi"><Button className="mt-8 rounded-full">Open HUMI <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></motion.div><motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative"><div className="rounded-3xl border border-border bg-card p-6 shadow-pop space-y-3"><div className="flex items-center gap-2 text-xs text-muted-foreground pb-2"><div className="h-7 w-7 rounded-full bg-primary/10 grid place-items-center"><Sparkles className="h-3.5 w-3.5 text-primary" /></div> HUMI · AI Assistant</div><div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground">"Help me understand this, improve my resume, and find the best way to help someone."</div><div className="rounded-2xl bg-primary px-4 py-3.5 text-sm text-primary-foreground"><b>Absolutely.</b> I can explain the topic step by step, improve your resume, and help turn a HumanLink idea into a clear, safe action plan.</div><div className="rounded-2xl bg-secondary px-4 py-3 text-sm flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /> Knowledge · Creation · Coding · HumanLink</div></div></motion.div></div></Section>;
}

function Impact() {
  const items = [{ k: "People", v: "Connected around meaningful needs" }, { k: "Skills", v: "Shared through time and expertise" }, { k: "Organizations", v: "NGOs, professionals and businesses" }, { k: "Trust", v: "Built through responsible participation" }];
  return <Section><div className="rounded-3xl bg-primary p-10 md:p-16 text-primary-foreground relative overflow-hidden"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, white 0, transparent 45%), radial-gradient(circle at 85% 80%, white 0, transparent 45%)" }} aria-hidden /><div className="relative grid gap-10 md:grid-cols-2 items-center"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5" /> Community Impact</div><h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">Measure impact with integrity.</h2><p className="mt-4 opacity-90 max-w-md leading-relaxed">HumanLink is designed to turn everyday acts of help into meaningful, visible community impact — without relying on inflated placeholder numbers.</p></div><div className="grid grid-cols-2 gap-4">{items.map((s) => <div key={s.v} className="rounded-2xl bg-white/12 backdrop-blur-sm border border-white/15 p-5"><div className="text-2xl font-bold">{s.k}</div><div className="text-xs opacity-90 mt-1">{s.v}</div></div>)}</div></div></div></Section>;
}

function SuccessStories() {
  const stories = [{ name: "Community Story", text: "HumanLink is built for the moments when asking for help feels difficult and offering help feels natural.", tag: "Connection", color: "text-primary bg-primary/10" }, { name: "Volunteer Story", text: "A platform should make it easier for people to discover where their time, skills, and kindness can make a difference.", tag: "Volunteer", color: "text-brand bg-brand/10" }, { name: "Organization Story", text: "NGOs and responsible organizations can use technology to reach the right people and coordinate meaningful support.", tag: "Community", color: "text-warning bg-warning/10" }];
  return <Section><div className="max-w-2xl mb-14"><Eyebrow>Community Stories</Eyebrow><h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">Real impact starts with a connection.</h2></div><div className="grid gap-5 md:grid-cols-3">{stories.map((s, i) => <motion.div key={s.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-3xl border border-border bg-card p-7 hover:shadow-soft transition-shadow"><Quote className="h-7 w-7 text-primary/40" /><p className="mt-4 text-[15px] leading-relaxed text-foreground">"{s.text}"</p><div className="mt-6 flex items-center justify-between"><div className="text-sm font-semibold">{s.name}</div><span className={`text-xs font-medium rounded-full px-2.5 py-1 ${s.color}`}>{s.tag}</span></div></motion.div>)}</div></Section>;
}

function TopHelpers() {
  return <Section><div className="flex flex-wrap items-end justify-between gap-4 mb-12"><div><Eyebrow tone="brand">Community Reputation</Eyebrow><h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">Karma belongs to the community.</h2></div><Link to="/leaderboard"><Button variant="outline" className="rounded-full">View leaderboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div><div className="grid gap-5 md:grid-cols-3"><div className="rounded-3xl border border-border bg-card p-7"><Award className="h-6 w-6 text-brand" /><h3 className="mt-4 font-semibold">Earn karma</h3><p className="mt-2 text-sm text-muted-foreground">Build reputation through genuine, completed acts of help.</p></div><div className="rounded-3xl border border-border bg-card p-7"><ShieldCheck className="h-6 w-6 text-primary" /><h3 className="mt-4 font-semibold">Build trust</h3><p className="mt-2 text-sm text-muted-foreground">Reviews and verification signals help communities make informed decisions.</p></div><div className="rounded-3xl border border-border bg-card p-7"><Users className="h-6 w-6 text-brand" /><h3 className="mt-4 font-semibold">Lead by example</h3><p className="mt-2 text-sm text-muted-foreground">Great helpers can inspire others to participate and contribute responsibly.</p></div></div></Section>;
}

function LeadershipVoice() {
  return <Section><div className="max-w-2xl mb-12"><Eyebrow>Leadership</Eyebrow><h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">The vision behind HumanLink</h2><p className="mt-4 text-lg text-muted-foreground">Built by one simple belief: technology should make it easier for people to help people.</p></div><motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="rounded-3xl border border-border bg-card p-8 md:p-10"><div className="grid md:grid-cols-[180px_1fr] gap-8 items-center"><div className="mx-auto md:mx-0 w-40 h-40 rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 grid place-items-center text-center"><div><div className="h-14 w-14 mx-auto rounded-full bg-primary grid place-items-center text-primary-foreground text-xl font-bold">S</div><div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">Founder photo</div><div className="text-[11px] text-muted-foreground">Coming soon</div></div></div><div><div className="text-xs uppercase tracking-widest text-primary font-semibold">Founder & CEO</div><Quote className="mt-5 h-8 w-8 text-primary/30" /><p className="mt-3 text-lg leading-relaxed text-foreground">"Humanity becomes stronger when people help each other. HumanLink began with a simple belief — that a stranger's kindness should be only one connection away."</p><div className="mt-7"><div className="text-base font-semibold">— Saichand Lakavath</div><div className="text-xs text-muted-foreground">Founder & CEO · HumanLink</div></div></div></div></motion.div><motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="mt-6 rounded-3xl border border-border bg-secondary/50 p-6 flex flex-wrap items-center gap-3"><Compass className="h-5 w-5 text-primary shrink-0" /><p className="text-sm text-foreground/80 flex-1 min-w-[240px]">The long-term vision is a trusted global help network with real-time communication, intelligent matching, responsible AI, and accessible participation.</p><div className="flex flex-wrap gap-2">{["AI assistance", "Real-time chat", "Trusted profiles", "Global community"].map((t) => <span key={t} className="text-xs px-3 py-1 rounded-full bg-card border border-border text-foreground/70">{t}</span>)}</div></motion.div></Section>;
}

function Testimonials() {
  const t = [{ name: "People", initials: "P", text: "Ask for help without feeling alone. HumanLink is designed to make the first connection easier." }, { name: "Volunteers", initials: "V", text: "Turn your time, skills, and willingness to help into meaningful community participation." }, { name: "Organizations", initials: "O", text: "Connect responsible organizations with people and communities where support can matter." }];
  return <Section className="!py-16"><h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">Built for every side of helping</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{t.map((x, i) => <motion.div key={x.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-3.5 w-3.5 fill-warning text-warning" />)}</div><p className="mt-3 text-sm leading-relaxed text-foreground/90">"{x.text}"</p><div className="mt-5 flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold">{x.initials}</div><div className="text-sm font-medium">{x.name}</div></div></motion.div>)}</div></Section>;
}

function DownloadApp() {
  return <Section className="!py-14"><div className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center overflow-hidden relative"><div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden /><div className="relative"><h2 className="text-3xl md:text-4xl font-bold tracking-tight">HumanLink, wherever you are</h2><p className="mt-3 text-sm md:text-base text-primary-foreground/85 max-w-md">Use the web experience today. Native mobile apps can be connected here when the official iOS and Android releases are published.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/auth"><Button size="lg" className="rounded-xl h-12 px-5 bg-foreground text-background hover:bg-foreground/90">Open HumanLink</Button></Link><Link to="/humi"><Button size="lg" variant="outline" className="rounded-xl h-12 px-5 border-white/30 text-primary-foreground hover:bg-white/10">Try HUMI</Button></Link></div></div><div className="relative mx-auto"><div className="w-56 h-[420px] rounded-[2.5rem] bg-card border-8 border-foreground/90 shadow-pop p-3 relative"><div className="absolute top-3 left-1/2 -translate-x-1/2 h-4 w-20 rounded-full bg-foreground/90" /><div className="h-full w-full rounded-[1.8rem] bg-secondary p-4 pt-9 space-y-2.5 overflow-hidden"><div className="text-[10px] font-semibold text-muted-foreground">HumanLink</div><div className="text-lg font-bold text-foreground">How can we help?</div><div className="rounded-xl bg-card border border-border p-2.5 shadow-soft"><div className="flex items-center gap-1.5 text-[10px] text-primary font-semibold"><Sparkles className="h-3 w-3" /> HUMI AI</div><div className="mt-1 text-xs font-medium text-foreground">Ask, learn, create, plan</div></div><div className="rounded-xl bg-primary text-primary-foreground p-2.5 text-xs font-medium">Need Help</div><div className="rounded-xl bg-brand text-white p-2.5 text-xs font-medium">Offer Help</div><div className="rounded-xl bg-destructive text-destructive-foreground p-2.5 text-xs font-medium">Emergency</div></div></div></div></div></Section>;
}

function FAQ() {
  const faqs = [{ q: "Is HumanLink free to use?", a: "Core community participation is designed to be accessible. Optional paid features may be introduced for advanced services, organizations, or premium capabilities." }, { q: "What is HUMI?", a: "HUMI is HumanLink's AI assistant. It can answer questions, explain topics, help with writing, coding, education, careers, business, research, planning, and HumanLink-specific tasks." }, { q: "How does trust work?", a: "HumanLink can use profiles, verification signals, reviews, karma, reporting, and moderation workflows to help users make safer decisions." }, { q: "Is HumanLink an emergency service?", a: "No. HumanLink is not an emergency service or replacement for local authorities or medical professionals. In an immediate emergency, contact your local emergency services first." }, { q: "Can organizations participate?", a: "Yes. HumanLink is designed to support NGOs, professionals, businesses, and CSR initiatives alongside individual users." }];
  return <Section><div className="max-w-2xl mx-auto"><div className="text-center mb-12"><Eyebrow>FAQ</Eyebrow><h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">Questions, answered</h2></div><Accordion type="single" collapsible className="space-y-3">{faqs.map((f, i) => <AccordionItem key={i} value={`i-${i}`} className="rounded-2xl border border-border bg-card px-5"><AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent></AccordionItem>)}</Accordion></div></Section>;
}

function CTA() {
  return <Section><div className="relative overflow-hidden rounded-3xl border border-border bg-card p-12 md:p-16 text-center shadow-soft"><div className="absolute inset-0 bg-gradient-hero opacity-70" aria-hidden /><div className="relative"><h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to make kindness your superpower?</h2><p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">Join HumanLink. Ask for help, offer a hand, use HUMI, or help build a stronger community.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/auth"><Button size="lg" className="rounded-full h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">Create your account <ArrowRight className="ml-2 h-4 w-4" /></Button></Link><Link to="/requests"><Button size="lg" variant="outline" className="rounded-full h-12 px-7 border-border">Browse requests</Button></Link></div></div></div></Section>;
}

function Landing() {
  return <div className="min-h-screen bg-background"><Navbar /><main><Hero /><Stats /><HowItWorks /><Testimonials /><DownloadApp /><Categories /><WhyHumanLink /><AIShowcase /><Impact /><SuccessStories /><TopHelpers /><LeadershipVoice /><FAQ /><CTA /></main><Footer /></div>;
}
