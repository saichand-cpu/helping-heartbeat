import { useState } from "react";
import { Flag, ShieldAlert, Loader2, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { REPORT_CATEGORIES, type ReportContentType } from "@/lib/legal";
import { cn } from "@/lib/utils";

const SAFETY_CATEGORIES = new Set(["threat", "harassment", "illegal", "abuse"]);

export type ReportTarget = {
  reportedUserId: string;
  contentType: ReportContentType;
  contentId?: string | null;
  contentExcerpt?: string | null;
  targetName?: string | null;
};

/** Shared reporting modal used for profiles, requests, reviews, comments, posts and messages. */
export function ReportDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: ReportTarget;
}) {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);

  const reset = () => {
    setCategory("");
    setDescription("");
    setDetails("");
    setRefCode(null);
  };

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(reset, 250);
  };

  const submit = async () => {
    if (!user) return toast.error("Please sign in to submit a report");
    if (!category) return toast.error("Please select a reason");
    if (description.trim().length < 10)
      return toast.error("Please describe what happened (at least 10 characters)");

    setBusy(true);
    const label = REPORT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_user_id: target.reportedUserId,
        reason: label.slice(0, 120),
        category,
        content_type: target.contentType,
        content_id: target.contentId ?? null,
        content_excerpt: (target.contentExcerpt ?? "").slice(0, 500) || null,
        description:
          [description.trim(), details.trim() && `Additional details: ${details.trim()}`]
            .filter(Boolean)
            .join("\n\n")
            .slice(0, 2000) || null,
        status: "open",
      })
      .select("ref_code")
      .maybeSingle();
    setBusy(false);

    if (error) return toast.error(error.message || "Could not submit report");
    setRefCode((data as { ref_code: string } | null)?.ref_code ?? null);
    toast.success("Report submitted");
  };

  const isSafety = SAFETY_CATEGORIES.has(category);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
        {refCode ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Report submitted successfully
              </DialogTitle>
              <DialogDescription>
                Your report will be reviewed by the HumanLink moderation team.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center">
              <p className="text-xs text-muted-foreground">Your Report ID</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{refCode}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard?.writeText(refCode);
                  toast.success("Report ID copied");
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy ID
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep this ID. You can reference it when you raise a grievance or follow up with
              support.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" asChild>
                <Link to="/report-and-grievance">Raise a grievance</Link>
              </Button>
              <Button onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                {target.contentType === "profile"
                  ? `Report ${target.targetName ?? "user"}`
                  : "Report content"}
              </DialogTitle>
              <DialogDescription>
                Your report will be reviewed by the HumanLink moderation team. Reports are
                confidential.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Reason</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {REPORT_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                        category === c.value
                          ? "border-primary bg-primary/10 text-foreground font-medium"
                          : "border-border hover:bg-accent text-muted-foreground",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {isSafety && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-muted-foreground flex gap-2">
                  <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>
                    If anyone is in immediate danger, contact your local emergency services first
                    (India: 112). HumanLink is not an emergency service. See our{" "}
                    <Link to="/user-safety" className="underline underline-offset-2">
                      safety guidance
                    </Link>
                    .
                  </span>
                </div>
              )}

              <div>
                <Label htmlFor="report-description" className="text-xs font-medium text-muted-foreground">
                  What happened?
                </Label>
                <Textarea
                  id="report-description"
                  className="mt-1.5"
                  rows={4}
                  maxLength={1200}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue as clearly as you can."
                />
              </div>

              <div>
                <Label htmlFor="report-details" className="text-xs font-medium text-muted-foreground">
                  Supporting information (optional)
                </Label>
                <Input
                  id="report-details"
                  className="mt-1.5"
                  maxLength={500}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Dates, links inside HumanLink, or other context"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Please don’t share government IDs, passwords, or payment card details.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Submit report
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Compact inline "Report" trigger for user-generated content. */
export function ReportButton({
  target,
  label = "Report",
  className,
}: {
  target: ReportTarget;
  label?: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user || user.id === target.reportedUserId) return null;
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors",
          className,
        )}
      >
        <Flag className="h-3.5 w-3.5" /> {label}
      </button>
      <ReportDialog open={open} onOpenChange={setOpen} target={target} />
    </>
  );
}
