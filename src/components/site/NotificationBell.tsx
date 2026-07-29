import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "likes" | "comments" | "follows";

const FILTERS: { key: FilterKey; label: string; match: (kind: string) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "likes", label: "Likes", match: (k) => k === "like" || k === "post_like" },
  { key: "comments", label: "Comments", match: (k) => k === "comment" || k === "post_comment" || k === "message" },
  { key: "follows", label: "Follows", match: (k) => k === "follow" },
];

export function NotificationBell() {
  const { items, unread, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    return (items ?? []).filter((n) => f.match(n?.kind ?? ""));
  }, [items, filter]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[10px] font-bold text-black grid place-items-center shadow-[0_0_10px_rgba(245,158,11,0.7)] animate-pulse"
              >
                {unread > 99 ? "99+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0 overflow-hidden bg-card border border-border border-border/60">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="text-sm font-semibold">Notifications</div>
          {unread > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllRead}>
              <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="flex gap-1.5 px-3 py-2 border-b border-border/40 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors shrink-0",
                filter === f.key
                  ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {items.length === 0 ? "You're all caught up." : "Nothing in this filter."}
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              <AnimatePresence initial={false}>
                {filtered.map((n) => {
                  const inner = (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors",
                        !n.read && "bg-amber-500/[0.04]",
                      )}
                    >
                      <div className={cn(
                        "mt-1.5 h-2 w-2 rounded-full shrink-0",
                        n.read ? "bg-muted-foreground/30" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{n?.title ?? "Notification"}</div>
                        {n?.body && (
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>
                        )}
                        <div className="text-[10px] text-muted-foreground/70 mt-1">
                          {n?.created_at ? new Date(n.created_at).toLocaleString() : ""}
                        </div>
                      </div>
                    </motion.div>
                  );
                  return (
                    <li key={n.id} onClick={() => { markRead(n.id); setOpen(false); }}>
                      {n.link ? (
                        <Link to={n.link as never} className="block">{inner}</Link>
                      ) : inner}
                    </li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
