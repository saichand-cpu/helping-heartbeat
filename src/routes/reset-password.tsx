import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — HumanLink" },
      {
        name: "description",
        content: "Set a new password for your HumanLink account.",
      },
      { property: "og:title", content: "Reset Password — HumanLink" },
      {
        property: "og:description",
        content: "Set a new password for your HumanLink account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

type SessionState = "checking" | "ready" | "invalid";

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionState("ready");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSessionState(data.session ? "ready" : "invalid");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const strength = useMemo(() => scorePassword(password), [password]);
  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong", "Excellent"][strength];

  const meetsPolicy =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);
  const matches = password.length > 0 && password === confirm;
  const canSubmit = sessionState === "ready" && meetsPolicy && matches && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message || "Could not update password");
        return;
      }
      setDone(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate({ to: "/auth" }), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass rounded-3xl p-8 shadow-pop"
      >
        <div className="mb-6">
          <Logo />
        </div>

        {sessionState === "checking" && (
          <div className="py-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        )}

        {sessionState === "invalid" && (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Link expired</h1>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center w-full h-11 rounded-md bg-gradient-brand text-primary-foreground border-0 shadow-glow font-medium text-sm"
            >
              Request new link
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Login
            </Link>
          </div>
        )}

        {sessionState === "ready" && done && (
          <div className="text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 grid place-items-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold">Password updated</h1>
            <p className="text-sm text-muted-foreground">
              ✓ Password updated successfully. Redirecting to login…
            </p>
          </div>
        )}

        {sessionState === "ready" && !done && (
          <>
            <h1 className="text-2xl font-bold">Set a new password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a strong password with at least 8 characters, an uppercase
              letter, a lowercase letter, and a number.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <Label htmlFor="password">New password</Label>
                <div className="relative mt-1">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i < strength
                              ? strength <= 2
                                ? "bg-destructive"
                                : strength === 3
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Strength: {strengthLabel}
                      {!meetsPolicy && " — needs 8+ chars, upper, lower, number"}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <div className="relative mt-1">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {confirm.length > 0 && !matches && (
                  <p className="text-xs text-destructive mt-1">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full h-11 bg-gradient-brand text-primary-foreground border-0 shadow-glow"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
