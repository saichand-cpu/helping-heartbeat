import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, MessageSquare, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HumiThread } from "@/lib/humi-threads";

type Props = {
  threads: HumiThread[];
  activeId?: string;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export function HumiSidebar({ threads, activeId, onNew, onDelete }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <Button onClick={onNew} className="h-10 w-full rounded-xl font-semibold">
        <Plus className="mr-1.5 h-4 w-4" /> New chat
      </Button>

      <div className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
        <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Conversations
        </div>
        {threads.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">No conversations yet.</p>
        )}
        {threads.map((t) => (
          <div
            key={t.id}
            className={cn(
              "group flex items-center gap-1 rounded-xl pr-1 transition-colors",
              activeId === t.id ? "bg-primary/10" : "hover:bg-muted",
            )}
          >
            <button
              type="button"
              onClick={() => navigate({ to: "/humi/$threadId", params: { threadId: t.id } })}
              className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"
            >
              {t.emergency ? (
                <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <MessageSquare
                  className={cn("h-4 w-4 shrink-0", activeId === t.id ? "text-primary" : "text-muted-foreground")}
                />
              )}
              <span
                className={cn(
                  "truncate text-sm",
                  activeId === t.id ? "font-medium text-primary" : "text-foreground/80",
                )}
              >
                {t.title}
              </span>
            </button>
            <button
              type="button"
              aria-label="Delete conversation"
              onClick={() => onDelete(t.id)}
              className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground">
          ← Back to HumanLink
        </Link>
      </div>
    </div>
  );
}
