import { useEffect, useState } from "react";
import { Flag, Ban, MoreVertical, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function useIsBlocked(otherUserId?: string | null) {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<boolean>(false);
  useEffect(() => {
    if (!user || !otherUserId || user.id === otherUserId) {
      setBlocked(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("blocked_users")
      .select("id")
      .or(
        `and(blocker_id.eq.${user.id},blocked_user_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_user_id.eq.${user.id})`,
      )
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setBlocked(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user, otherUserId]);
  return blocked;
}

export function ReportBlockMenu({
  targetUserId,
  targetName,
  size = "icon",
}: {
  targetUserId: string;
  targetName?: string;
  size?: "icon" | "sm";
}) {
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [isBlocked, setIsBlocked] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || user.id === targetUserId) return;
    supabase
      .from("blocked_users")
      .select("id")
      .eq("blocker_id", user.id)
      .eq("blocked_user_id", targetUserId)
      .maybeSingle()
      .then(({ data }) => setIsBlocked(!!data));
  }, [user, targetUserId]);

  if (!user || user.id === targetUserId) return null;

  const submitReport = async () => {
    if (!reason.trim()) {
      toast.error("Please select or enter a reason");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: targetUserId,
      reason: reason.trim().slice(0, 120),
      description: description.trim().slice(0, 1000) || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Could not submit report");
      return;
    }
    toast.success("Report submitted. Our team will review it.");
    setReportOpen(false);
    setReason("");
    setDescription("");
  };

  const toggleBlock = async () => {
    setBusy(true);
    if (isBlocked) {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_user_id", targetUserId);
      setBusy(false);
      if (error) return toast.error(error.message || "Could not unblock");
      setIsBlocked(false);
      toast.success(`Unblocked ${targetName ?? "user"}`);
    } else {
      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: user.id,
        blocked_user_id: targetUserId,
      });
      setBusy(false);
      if (error) return toast.error(error.message || "Could not block");
      setIsBlocked(true);
      toast.success(`Blocked ${targetName ?? "user"}`);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size === "icon" ? "icon" : "sm"}
            aria-label="More options"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => setReportOpen(true)}>
            <Flag className="h-4 w-4 mr-2" /> Report user
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleBlock} disabled={busy}>
            {isBlocked ? (
              <>
                <ShieldOff className="h-4 w-4 mr-2" /> Unblock user
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" /> Block user
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Report {targetName ?? "user"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="report-reason">Reason</Label>
              <Input
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Spam, harassment, fraud…"
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="report-desc">Details (optional)</Label>
              <Textarea
                id="report-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share any context that helps us review this."
                rows={4}
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReport} disabled={busy}>
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
