import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Plus, PenSquare, HandHeart, HeartHandshake, Users, Camera, Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

type Item = {
  to: string;
  search?: Record<string, string>;
  label: string;
  hint: string;
  icon: typeof PenSquare;
  tone: string;
};

const ITEMS: Item[] = [
  { to: "/feed", search: { compose: "post" }, label: "Create post", hint: "Share an update with your community", icon: PenSquare, tone: "bg-primary/10 text-primary" },
  { to: "/requests/new", label: "Ask for help", hint: "Describe what you need — we'll match helpers", icon: HandHeart, tone: "bg-primary/10 text-primary" },
  { to: "/feed", search: { compose: "offer_help" }, label: "Offer help", hint: "Tell people what you can help with", icon: HeartHandshake, tone: "bg-emerald-500/10 text-emerald-600" },
  { to: "/groups", search: { create: "1" }, label: "Create group", hint: "Start a community around a cause", icon: Users, tone: "bg-sky-500/10 text-sky-600" },
  { to: "/feed", search: { compose: "story" }, label: "Create story", hint: "A moment that disappears in 24 hours", icon: Camera, tone: "bg-violet-500/10 text-violet-600" },
  { to: "/feed", search: { compose: "campaign" }, label: "Create campaign", hint: "Rally volunteers or supporters", icon: Megaphone, tone: "bg-amber-500/10 text-amber-600" },
];

/**
 * The single Create entry point used by both the desktop sidebar and the
 * mobile bottom navigation.
 */
export function CreateMenu({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="w-full h-10 rounded-xl font-semibold shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" /> Create
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create on HumanLink</DialogTitle>
          <DialogDescription>Pick what you'd like to share or start.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-2">
          {ITEMS.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={it.to}
                search={it.search as never}
                onClick={() => setOpen(false)}
                className="flex h-full items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${it.tone}`}>
                  <it.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{it.label}</span>
                  <span className="block text-xs text-muted-foreground">{it.hint}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
