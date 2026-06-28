import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/humanlink-logo.jpeg.asset.json";

export function Logo({ className = "", showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="HumanLink — Connect • Help • Grow">
      <img
        src={logoAsset.url}
        alt="HumanLink logo"
        className="h-10 w-10 rounded-xl object-cover shadow-soft"
        width={40}
        height={40}
      />
      {showWordmark && (
        <span className="font-display text-xl font-bold tracking-tight leading-none">
          <span className="text-[#0f2447] dark:text-white">Human</span>
          <span className="text-[#3aa893]">Link</span>
        </span>
      )}
    </Link>
  );
}
