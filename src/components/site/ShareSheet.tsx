import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Mail, MessageSquare, Send, Share2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title?: string;
  text?: string;
};

export function ShareSheet({ open, onOpenChange, url, title = "HumanLink", text = "" }: Props) {
  const [canNative, setCanNative] = useState(false);
  useEffect(() => { setCanNative(typeof navigator !== "undefined" && !!navigator.share); }, []);

  const enc = encodeURIComponent;
  const links = [
    { label: "WhatsApp", icon: MessageSquare, href: `https://wa.me/?text=${enc(`${text} ${url}`.trim())}` },
    { label: "Telegram", icon: Send, href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { label: "X / Twitter", icon: Share2, href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(text)}` },
    { label: "Email", icon: Mail, href: `mailto:?subject=${enc(title)}&body=${enc(`${text}\n\n${url}`)}` },
  ];

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); } catch { toast.error("Copy failed"); }
  };

  const native = async () => {
    try { await navigator.share({ title, text, url }); onOpenChange(false); } catch { /* user cancel */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader><DialogTitle>Share</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input value={url} readOnly onFocus={(e) => e.currentTarget.select()} className="text-xs" />
            <Button size="sm" variant="outline" onClick={copy}><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {links.map(({ label, icon: Icon, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2.5 hover:bg-muted/60 transition text-sm">
                <Icon className="h-4 w-4 text-primary" /> {label}
              </a>
            ))}
          </div>
          {canNative && (
            <Button onClick={native} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Share2 className="h-4 w-4 mr-1" /> More apps…
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
