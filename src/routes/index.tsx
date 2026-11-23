import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Heart, Sparkles, Users, MessageCircle, ShieldCheck, HandHeart,
  BrainCircuit, MapPin, Star, ArrowRight, Building2,
  Stethoscope, GraduationCap, BriefcaseBusiness, BadgeCheck,
  Globe2, LockKeyhole, LifeBuoy, CircleDollarSign, HeartHandshake,
} from "lucide-react";
import { FounderPortrait } from "@/components/site/FounderPortrait";
import { HumanNetwork3D } from "@/components/site/HumanNetwork3D";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const SITE_URL = "https://www.humanlink.in";
const OG_IMAGE = `${SITE_URL}/humanlink-logo.jpeg`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HumanLink — Helping Humanity, One Connection at a Time" },
      { name: "description", content: "A trusted, AI-assisted community for asking for help, offering skills, volunteering, discovering NGOs and creating meaningful human connections." },
      { name: "keywords", content: "HumanLink, help platform India, volunteer platform, NGO platform, ask for help, offer help, community platform, skills, local support, social impact, Hyderabad" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "HumanLink — Helping Humanity, One Connection at a Time" },
      { property: "og:description", content: "Ask for help, offer what you can, volunteer and connect with people and organisations ready to make a difference." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "HumanLink — Helping Humanity, One Connection at a Time" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "HumanLink — Helping Humanity, One Connection at a Time" },
      { name: "twitter:description", content: "A community built around kindness, useful connections and real-world support." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Landing,
});

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.055, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function Section({ children, className = "", id }: {
  children: React.ReactNode; className?: string; id?: string;
}) {
  return <section id={id} className={`mx-auto max-w-7xl px-6 py-20 md:py-24 ${className}`}>{children}</section>;
}

function Eyebrow({ children, green = false }: { children: React.ReactNode; green?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide ${green ? "border-brand/20 bg-brand/10 text-brand" : "border-primary/15 bg-primary/10 text-primary"}`}>
      <Sparkles className="h-3.5 w-3.5" />{children}
    </div>
  );
}

function Landing() {
  return (
    <main className="overflow-hidden">
      <Hero />
      <Principles />
      <HowItWorks />
      <Platform />
      <PeopleWeConnect />
      <Trust />
      <Founder />
      <FAQ />
      <FinalCTA />
    </main>
  );
}

function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-gradient-hero">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_75%_30%,rgb(37_99_235_/_0.12),transparent_30%),radial-gradient(circle_at_18%_85%,rgb(34_197_94_/_0.10),transparent_28%)]" />
      <Section className="relative grid items-center gap-8 pt-10 md:pt-14 lg:grid-cols-[.94fr_1.06fr]">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="relative z-10 space-y-7">
          <Eyebrow>Technology with a human purpose</Eyebrow>
          <motion.h1 variants={fadeUp} custom={1} className="text-5xl font-bold leading-[1.03] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Helping Humanity,<br /><span className="text-primary">One Connection</span><br />at a Time.
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            A place where asking for help feels easier, offering help feels meaningful, and the right people can find each other — with HUMI AI helping every connection move forward.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
            <Link to="/auth"><Button size="lg" className="h-12 rounded-full px-7 text-base shadow-glow">Join HumanLink <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/about"><Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">Discover our mission</Button></Link>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Built around trust</span>
            <span className="inline-flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /> HUMI AI assistance</span>
            <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> Free to ask for help</span>
          </motion.div>
          <p className="text-xs text-muted-foreground">A community platform — not an emergency-response service.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8, ease: [0.22, 1, 0.36, 1] }} className="relative flex min-h-[430px] items-center justify-center md:min-h-[540px]">
          <HumanNetwork3D />
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .7 }} className="absolute bottom-3 left-0 hidden max-w-[245px] items-center gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-pop backdrop-blur-lg sm:flex">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><HandHeart className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">One community</p><p className="text-sm font-semibold">Many ways to make a difference.</p></div>
          </motion.div>
        </motion.div>
      </Section>
    </div>
  );
}

function Principles() {
  const items = [
    { icon: HeartHandshake, title: "People first", text: "Human connection at the centre of every feature." },
    { icon: BrainCircuit, title: "AI assisted", text: "HUMI helps organise requests and guide next steps." },
    { icon: BadgeCheck, title: "Trust matters", text: "Profiles, reports and reputation tools support safer use." },
    { icon: Globe2, title: "Open to everyone", text: "Individuals and organisations can contribute in different ways." },
  ];
  return (
    <Section className="!pt-0 !pb-12">
      <div className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
        {items.map((item, i) => <motion.div key={item.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex gap-3 rounded-2xl p-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-primary"><item.icon className="h-5 w-5" /></div>
          <div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p></div>
        </motion.div>)}
      </div>
    </Section>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">{eyebrow}</p><h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2><p className="mt-4 leading-relaxed text-muted-foreground">{text}</p></div>;
}

function HowItWorks() {
  const steps = [
    { icon: SearchIcon, title: "Tell us", text: "Describe what you need or how you would like to help." },
    { icon: BrainCircuit, title: "HUMI assists", text: "Get help organising your request, language and next steps." },
    { icon: Users, title: "Find a connection", text: "Explore relevant people, volunteers and organisations." },
    { icon: MessageCircle, title: "Coordinate", text: "Use platform tools to communicate and plan safely." },
    { icon: Star, title: "Close the loop", text: "Share an update or review and recognise the effort." },
  ];
  return (
    <Section id="how-it-works">
      <SectionHeading eyebrow="Simple by design" title="A clearer path from need to action" text="HumanLink brings the steps together so people can spend less time figuring out where to start and more time helping one another." />
      <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, i) => <motion.div key={step.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative text-center">
          <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-primary/10 bg-accent text-primary shadow-soft"><step.icon className="h-7 w-7" /><span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span></div>
          <h3 className="mt-5 font-semibold">{step.title}</h3><p className="mx-auto mt-2 max-w-[220px] text-sm leading-relaxed text-muted-foreground">{step.text}</p>
        </motion.div>)}
      </div>
    </Section>
  );
}

function SearchIcon(props: React.ComponentProps<typeof MapPin>) {
  return <MapPin {...props} />;
}

function Platform() {
  const features = [
    { icon: HandHeart, title: "Ask & offer help", text: "Create a clear request, offer your time or share a practical skill with the community.", tag: "Community" },
    { icon: BrainCircuit, title: "HUMI AI assistant", text: "Get help refining a request, translating a message and understanding possible next steps.", tag: "AI assistance" },
    { icon: MessageCircle, title: "Conversations & groups", text: "Coordinate with people and communities around shared interests and local initiatives.", tag: "Connect" },
    { icon: MapPin, title: "Discover nearby support", text: "Explore relevant helpers and organisations using the location details you choose to share.", tag: "Discovery" },
    { icon: AwardIcon, title: "Reputation & recognition", text: "Build a helpful track record through profiles, feedback and community recognition.", tag: "Trust" },
    { icon: CircleDollarSign, title: "Organisation tools", text: "Give NGOs and businesses ways to present their work, manage visibility and access eligible plans.", tag: "For organisations" },
  ];
  return (
    <div className="bg-gradient-soft">
      <Section>
        <SectionHeading eyebrow="One connected platform" title="Everything needed to turn good intentions into action" text="A growing set of tools for individuals, volunteers and organisations — designed to work together, not as disconnected services." />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => <motion.article key={feature.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="group rounded-3xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-pop">
            <div className="flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary"><feature.icon className="h-5 w-5" /></div><span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">{feature.tag}</span></div>
            <h3 className="mt-5 text-lg font-bold">{feature.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">Explore HumanLink <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
          </motion.article>)}
        </div>
      </Section>
    </div>
  );
}

function AwardIcon(props: React.ComponentProps<typeof Star>) {
  return <Star {...props} />;
}

function PeopleWeConnect() {
  const audiences = [
    { icon: Users, title: "Individuals", text: "Ask for support, share what you know or find people with common goals." },
    { icon: HandHeart, title: "Volunteers", text: "Offer your time, experience and practical help to people and causes." },
    { icon: Building2, title: "NGOs & community groups", text: "Present your mission, connect with supporters and coordinate initiatives." },
    { icon: BriefcaseBusiness, title: "Professionals & businesses", text: "Share expertise, discover opportunities and support local communities." },
    { icon: GraduationCap, title: "Students & educators", text: "Exchange knowledge, find guidance and contribute useful skills." },
    { icon: Stethoscope, title: "Care networks", text: "Help people find appropriate community resources and qualified services." },
  ];
  return (
    <Section>
      <SectionHeading eyebrow="A place for every kind of helper" title="Different people. One shared purpose." text="Whether you have ten minutes, a professional skill, a community network or an organisation to lead, there is a meaningful way to participate." />
      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {audiences.map((a, i) => <motion.div key={a.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-primary"><a.icon className="h-5 w-5" /></div>
          <div><h3 className="font-semibold">{a.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.text}</p></div>
        </motion.div>)}
      </div>
      <div className="mt-8 text-center"><Link to="/auth"><Button variant="outline" className="rounded-full">Find your place on HumanLink <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
    </Section>
  );
}

function Trust() {
  const points = [
    { icon: LockKeyhole, title: "Privacy-aware by design", text: "Choose what you share. Keep sensitive information out of public posts and AI conversations." },
    { icon: ShieldCheck, title: "Community safety tools", text: "Use reporting, blocking and grievance channels when something does not feel right." },
    { icon: BadgeCheck, title: "Verification with care", text: "Organisation verification is a review process, not a guarantee of every interaction or outcome." },
    { icon: LifeBuoy, title: "Clear emergency boundaries", text: "HumanLink is not an emergency service. Contact local emergency responders when someone is in immediate danger." },
  ];
  return (
    <div className="bg-[#0b1730] text-white">
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><Eyebrow green>Trust is the foundation</Eyebrow><h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">Kindness works best when people feel safe.</h2><p className="mt-4 leading-relaxed text-slate-300">We want HumanLink to make it easier to connect while giving people clear information, practical controls and responsible expectations.</p><Link to="/user-safety"><Button className="mt-7 rounded-full bg-white text-slate-900 hover:bg-slate-100">Read our safety guidance <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {points.map((p, i) => <motion.div key={p.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-2xl border border-white/10 bg-white/[.06] p-5">
              <p.icon className="h-5 w-5 text-emerald-300" /><h3 className="mt-4 font-semibold">{p.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{p.text}</p>
            </motion.div>)}
          </div>
        </div>
      </Section>
    </div>
  );
}

function Founder() {
  return (
    <Section>
      <div className="grid items-center gap-10 rounded-[2rem] border border-border bg-card p-7 shadow-soft md:p-12 lg:grid-cols-[.75fr_1.25fr]">
        <div className="mx-auto w-full max-w-sm"><FounderPortrait /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">A mission built on a simple belief</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Meet Saichand Lakavath</h2>
          <p className="mt-2 font-semibold text-primary">Founder & CEO, HumanLink</p>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">“Technology should make it easier for people to ask for help, offer help and create meaningful human connections.”</p>
          <p className="mt-4 leading-relaxed text-muted-foreground">HumanLink is being built around that belief: bringing kindness, useful technology and real-world action together in one community platform.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link to="/about"><Button variant="outline" className="rounded-full">Read our story</Button></Link><Link to="/auth"><Button className="rounded-full">Join the community <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
        </div>
      </div>
    </Section>
  );
}

function FAQ() {
  const faqs = [
    { q: "What is HumanLink?", a: "HumanLink is a community platform that helps people who need support connect with people, volunteers, professionals and organisations willing to help." },
    { q: "Is it free to ask for help?", a: "Asking for help is intended to remain free. Optional paid plans may apply to selected organisation, business or promotional features and are shown before purchase." },
    { q: "What does HUMI AI do?", a: "HUMI can help organise a request, improve clarity, translate text and suggest possible next steps. AI can make mistakes and is not a substitute for qualified professional advice." },
    { q: "Are all members and organisations verified?", a: "Some organisation accounts may go through a verification review. A badge is not a guarantee of a person's identity, qualifications, conduct or the outcome of an interaction. Always use your judgement." },
    { q: "Can I use HumanLink for emergencies?", a: "HumanLink is not an emergency-response service and cannot dispatch responders. If someone is in immediate danger in India, call 112 or the relevant local emergency service." },
    { q: "How do I report a concern?", a: "Use the report controls available on the platform or visit the Report & Grievance page so the team can review the concern." },
  ];
  return (
    <Section className="!pt-8">
      <SectionHeading eyebrow="Good to know" title="Questions, answered" text="A few things to know before you get started." />
      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-border bg-card px-5 shadow-soft">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => <AccordionItem key={f.q} value={`item-${i}`}><AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">{f.a}</AccordionContent></AccordionItem>)}
        </Accordion>
      </div>
    </Section>
  );
}

function FinalCTA() {
  return (
    <Section className="!pt-0">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-brand px-7 py-14 text-center text-white shadow-glow md:px-14 md:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_85%_80%,white,transparent_30%)]" />
        <div className="relative mx-auto max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-white/75">Your next connection can matter</p><h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">The world gets better when we show up for each other.</h2><p className="mt-5 leading-relaxed text-white/85">Start with one request, one skill or one small act of kindness. Let’s make it count.</p><Link to="/auth"><Button size="lg" className="mt-8 h-12 rounded-full bg-white px-8 text-base text-primary hover:bg-white/90">Get started with HumanLink <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
      </div>
    </Section>
  );
}
