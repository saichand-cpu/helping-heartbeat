import { motion } from "framer-motion";

type Props = {
  size?: number;
  active?: boolean;
  emergency?: boolean;
  className?: string;
};

/** Living gradient orb — HUMI's presence marker. */
export function HumiOrb({ size = 56, active = false, emergency = false, className }: Props) {
  const hue = emergency
    ? "from-destructive via-destructive/70 to-orange-400"
    : "from-primary via-sky-400 to-violet-500";

  return (
    <div className={className} style={{ width: size, height: size }}>
      <motion.div
        className="relative h-full w-full"
        animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 1.6, repeat: active ? Infinity : 0, ease: "easeInOut" }}
      >
        <motion.div
          aria-hidden
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${hue} blur-md opacity-60`}
          animate={{ rotate: 360 }}
          transition={{ duration: active ? 6 : 18, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr ${hue} shadow-lg`}
          animate={{ rotate: -360 }}
          transition={{ duration: active ? 8 : 24, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-[18%] rounded-full bg-background/25 backdrop-blur-[2px]" />
        <div className="absolute inset-[34%] rounded-full bg-white/70 dark:bg-white/40 blur-[1px]" />
      </motion.div>
    </div>
  );
}

/** Soft animated aurora used as the workspace backdrop. */
export function HumiAurora({ emergency = false }: { emergency?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <motion.div
        className={`absolute -top-24 -left-16 h-72 w-72 rounded-full blur-3xl ${
          emergency ? "bg-destructive/20" : "bg-primary/20"
        }`}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
