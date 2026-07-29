import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, HeartHandshake, Sparkles, ArrowRight, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type Subscription = {
  plan_name: string;
  tier: string;
  status: string;
  expires_at: string;
  cancelled_at: string | null;
};

export function PlanSummaryCard({ onManage }: { onManage?: () => void }) {
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_name, tier, status, expires_at, cancelled_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    setSub((data?.[0] as Subscription | undefined) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("humanlink:premium-updated", refresh);
    return () => window.removeEventListener("humanlink:premium-updated", refresh);
  }, [user?.id]);

  const isActive = sub?.status === "active" && new Date(sub.expires_at) > new Date();
  const isGold = sub?.tier === "pro" || sub?.tier === "plus";
  const daysLeft = isActive
    ? Math.max(0, Math.ceil((new Date(sub!.expires_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 shadow-soft border",
        isActive && isGold && "border-amber-500/40 bg-card",
        isActive && sub?.tier === "ngo" && "border-emerald-500/40 bg-card",
        !isActive && "border-border bg-card",
      )}
    >
      {isActive && (
        <div
          className={cn(
            "absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-25 blur-3xl",
            isGold ? "bg-amber-500" : "bg-emerald-500",
          )}
        />
      )}
      <div className="relative flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Current plan
          </div>
          {loading ? (
            <div className="h-8 w-40 mt-2 bg-muted animate-pulse rounded" />
          ) : isActive && sub ? (
            <>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {isGold ? (
                  <Crown className="h-6 w-6 text-amber-500" />
                ) : (
                  <HeartHandshake className="h-6 w-6 text-emerald-500" />
                )}
                <h3 className="text-2xl font-bold">{sub.plan_name}</h3>
                <Badge variant={sub.cancelled_at ? "secondary" : "default"}>
                  {sub.cancelled_at ? "Cancels at period end" : "Active"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                {sub.cancelled_at ? "Ends" : "Renews"} on{" "}
                <span className="font-medium text-foreground">
                  {new Date(sub.expires_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-muted-foreground">· {daysLeft} day{daysLeft === 1 ? "" : "s"} left</span>
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-2 text-2xl font-bold">Free plan</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade for a verified badge, priority visibility, and premium AI.
              </p>
            </>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {isActive ? (
            <Button variant="outline" onClick={onManage} className="gap-1">
              Manage <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={onManage}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-1"
            >
              <Crown className="h-4 w-4" /> Upgrade
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
