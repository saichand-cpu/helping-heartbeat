import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { BrainCircuit, Building2, HandHeart, Heart, ShieldCheck, Users, Sparkles } from "lucide-react";

const nodes = [
  { label: "People", icon: Users, x: "10%", y: "20%", delay: 0, depth: 55 },
  { label: "Volunteers", icon: HandHeart, x: "80%", y: "15%", delay: 1.1, depth: 70 },
  { label: "NGOs", icon: Building2, x: "86%", y: "73%", delay: 1.8, depth: 45 },
  { label: "Trust", icon: ShieldCheck, x: "9%", y: "77%", delay: 2.5, depth: 65 },
];

const particles = [
  [24, 16, 1.2], [72, 28, 1.8], [22, 62, 2.4], [75, 62, 1.5],
  [36, 82, 2.1], [63, 82, 2.8], [50, 12, 1.7], [50, 90, 2.3],
];

export function HumanNetwork3D() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const { scrollYProgress } = useScroll();
  const scrollTilt = useTransform(scrollYProgress, [0, 0.35], [0, -5]);
  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [8, -8]), { stiffness: 90, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-10, 10]), { stiffness: 90, damping: 20 });
  const combinedX = useTransform([rotateX, scrollTilt], ([a, b]) => Number(a) + Number(b));

  return (
    <div className="relative mx-auto w-full max-w-[650px] aspect-square select-none [perspective:1400px]"
      onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); mouseX.set((event.clientX - rect.left) / rect.width * 2 - 1); mouseY.set((event.clientY - rect.top) / rect.height * 2 - 1); }}
      onPointerLeave={() => { mouseX.set(0); mouseY.set(0); }} aria-label="Interactive HumanLink connection network" role="img">
      <motion.div style={{ rotateX: combinedX, rotateY }} className="absolute inset-4 [transform-style:preserve-3d]">
        <motion.div className="absolute inset-[-8%] rounded-full bg-primary/10 blur-[70px]" animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.35, 0.55, 0.35] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <div className="absolute inset-[8%] rounded-full border border-primary/10 [box-shadow:0_0_100px_hsl(var(--primary)/0.10),inset_0_0_80px_hsl(var(--primary)/0.06)]" />
        <div className="absolute inset-[17%] rounded-full border border-primary/15" />
        <div className="absolute inset-[27%] rounded-full border border-primary/20 border-dashed animate-[spin_24s_linear_infinite]" />
        <div className="absolute inset-[34%] rounded-full border border-brand/15 border-dotted animate-[spin_17s_linear_infinite_reverse]" />
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="humanlinkLine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="hsl(var(--primary) / .03)" /><stop offset=".5" stopColor="hsl(var(--primary) / .6)" /><stop offset="1" stopColor="hsl(var(--brand) / .08)" /></linearGradient>
            <filter id="humanlinkGlow"><feGaussianBlur stdDeviation="0.8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <path d="M16 23 Q50 7 84 19 M16 23 Q47 47 87 74 M13 78 Q47 51 84 19 M13 78 Q48 92 87 74 M16 23 Q49 49 13 78 M84 19 Q52 47 87 74" fill="none" stroke="url(#humanlinkLine)" strokeWidth=".42" strokeDasharray="1.8 2.2" filter="url(#humanlinkGlow)" />
          <circle cx="50" cy="50" r="1.4" fill="hsl(var(--primary) / .8)" /><circle cx="50" cy="50" r="7" fill="none" stroke="hsl(var(--primary) / .12)" strokeWidth=".35" />
        </svg>
        {particles.map(([x, y, duration], i) => <motion.span key={i} className="absolute h-1.5 w-1.5 rounded-full bg-primary/50 shadow-[0_0_14px_hsl(var(--primary)/0.45)]" style={{ left: `${x}%`, top: `${y}%`, transform: `translateZ(${35 + i * 7}px)` }} animate={{ y: [0, -12, 0], opacity: [0.2, 0.8, 0.2], scale: [0.7, 1.25, 0.7] }} transition={{ duration: 4 + duration, repeat: Infinity, delay: duration, ease: "easeInOut" }} />)}
        {nodes.map((node) => { const Icon = node.icon; return <motion.div key={node.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: node.x, top: node.y, transform: `translateZ(${node.depth}px)` }} animate={{ y: [0, -11, 0], rotateZ: [0, 2, 0, -2, 0] }} transition={{ duration: 5.5, repeat: Infinity, delay: node.delay, ease: "easeInOut" }}><div className="group rounded-2xl border border-border/70 bg-card/85 px-3 py-2 shadow-[0_18px_45px_hsl(var(--foreground)/0.08)] backdrop-blur-xl flex items-center gap-2 transition-transform duration-300 hover:scale-105"><span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10"><Icon className="h-4 w-4" /></span><span className="text-xs font-semibold whitespace-nowrap">{node.label}</span></div></motion.div>; })}
        <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: "translateZ(120px)" }} animate={{ y: [0, -9, 0], rotateZ: [0, 1.5, 0, -1.5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <div className="relative grid h-44 w-44 place-items-center rounded-full border border-primary/25 bg-card/80 shadow-[0_30px_100px_hsl(var(--primary)/0.22),inset_0_0_55px_hsl(var(--primary)/0.08)] backdrop-blur-2xl md:h-56 md:w-56">
            <motion.div className="absolute inset-3 rounded-full border border-primary/15" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
            <motion.div className="absolute inset-7 rounded-full border border-brand/20 border-dashed" animate={{ rotate: -360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} />
            <div className="absolute inset-[24%] rounded-full bg-primary/5 blur-xl" />
            <motion.div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-[0_0_65px_hsl(var(--primary)/0.45)] md:h-24 md:w-24" animate={{ boxShadow: ["0 0 40px hsl(var(--primary)/.3)", "0 0 75px hsl(var(--primary)/.5)", "0 0 40px hsl(var(--primary)/.3)"] }} transition={{ duration: 3, repeat: Infinity }}><Heart className="h-9 w-9 fill-current md:h-11 md:w-11" /></motion.div>
            <div className="absolute -bottom-3 rounded-full border border-border bg-background/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] shadow-soft backdrop-blur-md">HumanLink</div>
          </div>
        </motion.div>
        <motion.div className="absolute left-1/2 top-[6%] -translate-x-1/2" style={{ transform: "translateZ(90px)" }} animate={{ y: [0, 7, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-card/85 px-3 py-2 text-xs font-semibold shadow-soft backdrop-blur-xl"><span className="relative flex h-4 w-4"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30" /><span className="relative grid h-4 w-4 place-items-center rounded-full bg-primary/10"><BrainCircuit className="h-3 w-3 text-primary" /></span></span>HUMI AI</div>
        </motion.div>
        <motion.div className="absolute right-[10%] bottom-[13%]" style={{ transform: "translateZ(100px)" }} animate={{ y: [0, -8, 0], rotateZ: [0, 2, 0] }} transition={{ duration: 4.8, repeat: Infinity, delay: 1.4 }}><div className="rounded-full border border-brand/20 bg-card/80 px-3 py-1.5 text-[10px] font-semibold text-brand shadow-soft backdrop-blur-xl flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Kindness in motion</div></motion.div>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-10 bottom-0 h-24 rounded-full bg-primary/10 blur-3xl" />
    </div>
  );
}
