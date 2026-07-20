import { BadgeCheck, Crown, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({
  tier,
  className,
}: {
  tier?: string | null;
  className?: string;
}) {
  const isPro = tier === "pro" || tier === "plus";
  const isNgo = tier === "ngo";
  return (
    <span
      title={tier ? `${tier} verified` : "Verified"}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        isPro && "text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]",
        isNgo && "text-emerald-500 drop-shadow-[0_0_4px_rgba(16,185,129,0.6)]",
        !isPro && !isNgo && "text-primary",
        className,
      )}
    >
      {isPro ? (
        <Crown className="h-4 w-4" />
      ) : isNgo ? (
        <HeartHandshake className="h-4 w-4" />
      ) : (
        <BadgeCheck className="h-4 w-4" />
      )}
    </span>
  );
}
