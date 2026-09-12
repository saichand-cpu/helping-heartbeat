import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BrainCircuit, Building2, HandHeart, Heart, ShieldCheck, Users } from "lucide-react";

const nodes = [
  { label: "People", icon: Users, x: "12%", y: "20%", delay: 0 },
  { label: "Volunteers", icon: HandHeart, x: "78%", y: "14%", delay: 1.1 },
  { label: "NGOs", icon: Building2, x: "84%", y: "72%", delay: 1.8 },
  { label: "Trust", icon: ShieldCheck, x: "10%", y: "76%", delay: 2.5 },
];

export function HumanNetwork3D() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [8, -8]), { stiffness: 90, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-10, 10]), { stiffness: 90, damping: 20 });

  return (
    <div className="relative mx-auto w-full max-w-[620px] aspect-square select-none [perspective:1200px]" onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); mouseX.set((event.clientX - rect.left) / rect.width * 2 - 1); mouseY.set((event.clientY - rect.top) / rect.height * 2 - 1); }} onPointerLeave={() => { mouseX.set(0); mouseY.set(0); }} aria-label="Interactive HumanLink connection network" role="img">
      <motion.div style={{ rotateX, rotateY }} className="absolute inset-5 [transform-style:preserve-3d]">
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-[12%] rounded-full border border-primary/15 [box-shadow:0_0_80px_hsl(var(--primary)/0.12),inset_0_0_70px_hsl(var(--primary)/0.08)]" />
        <div className="absolute inset-[24%] rounded-full border border-primary/20 border-dashed animate-[spin_24s_linear_infinite]" />
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
          <defs><linearGradient id="humanlinkLine" x1="0" x2="1"><stop offset="0" stopColor="hsl(var(--primary) / .05)" /><stop offset=".5" stopColor="hsl(var(--primary) / .55)" /><stop offset="1" stopColor="hsl(var(--brand) / .08)" /></linearGradient></defs>
          <path d="M18 25 Q50 8 82 20 M18 25 Q45 50 86 75 M14 78 Q47 51 82 20 M14 78 Q48 91 86 75 M18 25 Q49 48 14 78" fill="none" stroke="url(#humanlinkLine)" strokeWidth=".45" strokeDasharray="2 2" />
          <circle cx="50" cy="50" r="2" fill="hsl(var(--primary) / .75)" className="animate-pulse" />
        </svg>
        {nodes.map((node) => { const Icon = node.icon; return (
          <motion.div key={node.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: node.x, top: node.y, transform: "translateZ(55px)" }} animate={{ y: [0, -10, 0], rotateZ: [0, 2, 0, -2, 0] }} transition={{ duration: 5.5, repeat: Infinity, delay: node.delay, ease: "easeInOut" }}>
            <div className="rounded-2xl border border-border/80 bg-card/90 px-3 py-2 shadow-soft backdrop-blur-md flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><span className="text-xs font-semibold whitespace-nowrap">{node.label}</span></div>
          </motion.div>
        ); })}
        <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: "translateZ(110px)" }} animate={{ y: [0, -8, 0], rotateZ: [0, 1.5, 0, -1.5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <div className="relative grid h-44 w-44 place-items-center rounded-full border border-primary/25 bg-card/90 shadow-[0_25px_80px_hsl(var(--primary)/0.22),inset_0_0_45px_hsl(var(--primary)/0.08)] backdrop-blur-xl md:h-52 md:w-52">
            <div className="absolute inset-4 rounded-full border border-primary/20 animate-[spin_18s_linear_infinite]" /><div className="absolute inset-8 rounded-full border border-brand/20 border-dashed animate-[spin_12s_linear_infinite_reverse]" />
            <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-[0_0_50px_hsl(var(--primary)/0.4)] md:h-24 md:w-24"><Heart className="h-9 w-9 fill-current md:h-11 md:w-11" /></div>
            <div className="absolute -bottom-3 rounded-full border border-border bg-background/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] shadow-soft backdrop-blur-md">HumanLink</div>
          </div>
        </motion.div>
        <motion.div className="absolute left-1/2 top-[8%] -translate-x-1/2" style={{ transform: "translateZ(75px)" }} animate={{ y: [0, 7, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-card/85 px-3 py-2 text-xs font-semibold shadow-soft backdrop-blur-md"><BrainCircuit className="h-4 w-4 text-primary" /> HUMI AI</div>
        </motion.div>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-10 bottom-0 h-20 rounded-full bg-primary/10 blur-3xl" />
    </div>
  );
}
