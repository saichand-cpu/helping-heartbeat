import { useState } from "react";
import { Bell, Send, Smartphone, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function AdminNotificationCenter() {
  const [title, setTitle] = useState("Welcome to HumanLink");
  const [message, setMessage] = useState("You’re now connected to HumanLink mobile notifications. Stay updated on help requests, messages, opportunities and important HumanLink alerts.");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    setSent(false);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        toast.error("Admin session expired. Please sign in again.");
        return;
      }

      const response = await fetch("/api/admin-send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, message, url }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; messageId?: string };
      if (!response.ok) throw new Error(result.error || "Notification failed");

      setSent(true);
      toast.success("Notification sent to the HumanLink mobile audience");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notification failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 md:p-6 shadow-soft space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Mobile Notifications</h2>
            <Badge variant="secondary">Admin only</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Write a notification here and broadcast it to devices subscribed to HumanLink.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary">
          <Smartphone className="h-4 w-4" /> All mobile users
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-5">
        <div className="space-y-4">
          <div>
            <Label>Notification title</Label>
            <Input className="mt-1.5" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="HumanLink update" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea className="mt-1.5 min-h-32" maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type the notification users should receive..." />
            <div className="mt-1 text-right text-xs text-muted-foreground">{message.length}/2000</div>
          </div>
          <div>
            <Label>Open page after tapping (optional)</Label>
            <Input className="mt-1.5" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/feed or /dashboard" />
          </div>
          <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {sending ? "Sending…" : "Send to all mobile users"}
          </Button>
          {sent && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Broadcast request accepted by Firebase.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Preview</div>
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/15 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{title || "HumanLink"}</div>
                <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words">{message || "Your notification preview appears here."}</div>
                <div className="mt-2 text-[11px] text-muted-foreground">HumanLink · now</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Broadcasts cannot be recalled after Firebase accepts the fanout request.
          </div>
        </div>
      </div>
    </div>
  );
}
