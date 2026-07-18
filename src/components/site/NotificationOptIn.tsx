import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemNotifications } from "@/hooks/use-system-notifications";
import { toast } from "sonner";

export function NotificationOptIn() {
  const { permission, dismissed, request, dismiss, supported } = useSystemNotifications();

  const shouldShow = supported && !dismissed && permission === "default";

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 shadow-glow"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          <button
            aria-label="Dismiss"
            onClick={dismiss}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold tracking-tight">Get notified instantly</h3>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Turn on system notifications for new messages, incoming calls, and nearby help requests. Works while HumanLink is open.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-gradient-brand text-primary-foreground shadow-glow"
                  onClick={async () => {
                    const res = await request();
                    if (res === "granted") toast.success("Notifications enabled");
                    else if (res === "denied") toast.error("Notifications blocked — enable in browser settings");
                  }}
                >
                  <Bell className="mr-1.5 h-4 w-4" /> Enable
                </Button>
                <Button size="sm" variant="ghost" onClick={dismiss}>
                  <BellOff className="mr-1.5 h-4 w-4" /> Not now
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
