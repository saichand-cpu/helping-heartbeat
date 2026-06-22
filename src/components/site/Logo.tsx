import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-9 w-9">
        <div className="absolute inset-0 rounded-2xl bg-gradient-brand shadow-glow" />
        <div className="absolute inset-0 grid place-items-center text-primary-foreground font-bold text-lg">
          <span aria-hidden>♥</span>
        </div>
      </div>
      <span className="font-display text-xl font-bold tracking-tight">
        Human<span className="text-gradient-brand">Link</span>
      </span>
    </Link>
  );
}
