import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — HumanLink" },
      {
        name: "description",
        content:
          "Reset your HumanLink account password. We'll send you a secure reset link.",
      },
      { property: "og:title", content: "Forgot Password — HumanLink" },
      {
        property: "og:description",
        content: "Reset your HumanLink account password.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(0);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail || loading) return;
    const now = Date.now();
    if (now - lastSubmit < 15_000) {
      toast.error("Please wait a few seconds before trying again.");
      return;
    }
    setLastSubmit(now);
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Always show generic success (don't leak whether email exists)
      setSent(true);
    } catch {
      setSent(true);
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

        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 grid place-items-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">
              ✓ Password reset email sent. Please check your inbox and spam
              folder.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-md bg-gradient-brand text-primary-foreground border-0 shadow-glow font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Forgot Password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your registered email address. We'll send you a password
              reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <Label htmlFor="email">Email address</Label>
                <div className="relative mt-1">
                  <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!validEmail || loading}
                className="w-full h-11 bg-gradient-brand text-primary-foreground border-0 shadow-glow"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Login
                </Link>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
