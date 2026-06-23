import { BadgeCheck, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({
  tier,
  className,
}: {
  tier?: string | null;
  className?: string;
}) {
  const isPro = tier === "pro" || tier === "plus";
  return (
    <span
      title={tier ? `${tier} verified` : "Verified"}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        isPro
          ? "text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]"
          : "text-primary",
        className,
      )}
    >
      {isPro ? <Crown className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
    </span>
  );
}
