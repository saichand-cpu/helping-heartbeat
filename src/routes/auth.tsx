import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Phone, ShieldCheck, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HumanLink" },
      {
        name: "description",
        content:
          "Sign in or create your HumanLink account with email and password.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      {/* Left panel — brand story */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-primary to-[#1d4ed8] text-primary-foreground">
        <div
          className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -top-32 -right-10 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative space-y-8 max-w-md">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Connecting People Through Kindness
            </div>
            <h2 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight">
              Help is just <br /> one tap away.
            </h2>
            <p className="mt-4 text-white/80 text-base leading-relaxed">
              Join a community of humans helping humans — request help,
              offer skills, and earn karma for every kindness.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Feature icon={Users} title="120K+ members" note="already helping" />
            <Feature icon={ShieldCheck} title="Verified & safe" note="report / block built-in" />
          </div>
        </div>

        <div className="text-xs text-white/60 relative">
          © {new Date().getFullYear()} HumanLink · Made with care
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <EmailAuthFlow />
          </div>
          <p className="mt-6 text-xs text-center text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/" className="underline underline-offset-2 hover:text-foreground">Terms</Link>{" "}
            and{" "}
            <Link to="/" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, note }: { icon: React.ComponentType<{ className?: string }>; title: string; note: string }) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 border border-white/15">
      <Icon className="h-4 w-4 mb-2" />
      <div className="text-sm font-semibold leading-tight">{title}</div>
      <div className="text-[11px] text-white/70">{note}</div>
    </div>
  );
}

type Mode = "signin" | "signup";

// Simple client-side cooldown to slow down brute-force / spam attempts.
const ATTEMPT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60_000;

const DYNAMIC_AUTH_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

/** Ensure we never render a raw object, number, or empty string to users. */
function normalizeAuthError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err === null || err === undefined) return fallback;
  if (typeof err === "string" && err.trim()) return err;
  if (err instanceof Error && err.message?.trim()) return err.message;
  const maybe = (err as { message?: string; error?: string; msg?: string })?.message;
  if (typeof maybe === "string" && maybe.trim()) return maybe;
  const raw = String(err);
  if (raw && raw !== "[object Object]" && raw !== "0") return raw;
  return fallback;
}

function useAttemptGuard(storageKey: string) {
  const attemptsRef = useRef<number[]>([]);
  const [cooldownUntil, setCooldownUntil] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(storageKey);
    return raw ? Number(raw) || 0 : 0;
  });

  const now = () => Date.now();
  const remainingCooldown = Math.max(0, cooldownUntil - now());

  const registerAttempt = () => {
    const t = now();
    attemptsRef.current = attemptsRef.current.filter(
      (x) => t - x < ATTEMPT_WINDOW_MS,
    );
    attemptsRef.current.push(t);
    if (attemptsRef.current.length >= MAX_ATTEMPTS) {
      const until = t + COOLDOWN_MS;
      setCooldownUntil(until);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, String(until));
      }
      attemptsRef.current = [];
    }
  };

  const clearCooldown = () => {
    setCooldownUntil(0);
    attemptsRef.current = [];
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
  };

  return { remainingCooldown, registerAttempt, clearCooldown };
}

function EmailAuthFlow() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const resendConfirmation = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Enter your email address first");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${DYNAMIC_AUTH_ORIGIN}/` },
      });
      if (error) {
        console.error("Resend confirmation error details:", error);
        toast.error(normalizeAuthError(error, "Could not resend the confirmation email."));
        return;
      }
      toast.success("Confirmation email sent — check your inbox.");
    } catch (error) {
      console.error("Resend confirmation error details:", error);
      toast.error(normalizeAuthError(error, "Could not resend the confirmation email."));
    } finally {
      setResending(false);
    }
  };

  const { remainingCooldown, registerAttempt, clearCooldown } =
    useAttemptGuard("humanlink:auth:cooldown");
  const [, force] = useState(0);
  useEffect(() => {
    if (remainingCooldown <= 0) return;
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [remainingCooldown]);

  const cooldownSec = Math.ceil(remainingCooldown / 1000);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validPassword = password.length >= 8;
  const validPhone = phone.trim().length === 0 || /^\+?[\d\s\-()]{7,20}$/.test(phone.trim());
  const validName = fullName.trim().length >= 2;

  const canSubmit =
    cooldownSec === 0 &&
    !loading &&
    validEmail &&
    validPassword &&
    (mode === "signin" || (validName && validPhone && phone.trim().length > 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setNeedsConfirmation(false);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            // Dynamic origin so confirmation links work on custom domains too.
            emailRedirectTo: `${DYNAMIC_AUTH_ORIGIN}/`,
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
          },
        });

        if (error) {
          console.error("Signup error details:", error);
          registerAttempt();
          toast.error(normalizeAuthError(error, "Signup failed. Please try again."));
          return;
        }

        // Auto-confirmed users get a session immediately — log them straight in.
        if (data.session) {
          clearCooldown();
          toast.success("Welcome to HumanLink");
          navigate({ to: "/dashboard" });
          return;
        }

        // No session: email confirmation is required. Try to sign in once
        // in case confirmation is not strictly required; otherwise show the
        // resend-confirmation state.
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) {
          console.error("Post-signup sign-in error details:", signInErr);
          if (/confirm/i.test(signInErr.message ?? "")) {
            setNeedsConfirmation(true);
            toast.success("Account created — check your inbox for the verification link before signing in.");
          } else {
            toast.error(normalizeAuthError(signInErr, "Signed up, please sign in."));
          }
          setMode("signin");
          return;
        }
        clearCooldown();
        toast.success("Welcome to HumanLink");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          console.error("Sign-in error details:", error);
          registerAttempt();
          if (/confirm/i.test(error.message ?? "")) {
            setNeedsConfirmation(true);
            toast.error("Your email isn't confirmed yet. Resend the confirmation email below.");
          } else {
            toast.error(normalizeAuthError(error, "Invalid email or password."));
          }
          return;
        }
        clearCooldown();
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      }
    } catch (error) {
      console.error("Auth error details:", error);
      toast.error(normalizeAuthError(error, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Segmented control */}
      <div className="grid grid-cols-2 rounded-2xl bg-muted p-1 mb-6">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`h-9 rounded-xl text-sm font-medium transition-all ${
              mode === m
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "signin" ? "Welcome back" : "Join HumanLink"}
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        {mode === "signin"
          ? "Sign in to continue helping."
          : "It takes a moment — no verification needed."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        {mode === "signup" && (
          <Field id="fullName" label="Full name" icon={User}>
            <Input
              id="fullName"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Aarav Sharma"
              className="pl-9 h-11 rounded-xl"
            />
          </Field>
        )}

        <Field id="email" label="Email address" icon={Mail}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="pl-9 h-11 rounded-xl"
          />
        </Field>

        {mode === "signup" && (
          <Field id="phone" label="Mobile number" icon={Phone}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="pl-9 h-11 rounded-xl"
            />
          </Field>
        )}

        <Field id="password" label="Password" icon={Lock}>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="pl-9 h-11 rounded-xl"
          />
        </Field>
        {mode === "signup" && password.length > 0 && !validPassword && (
          <p className="text-xs text-destructive -mt-2">
            Password must be at least 8 characters.
          </p>
        )}
        {mode === "signin" && (
          <div className="text-right -mt-2">
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
        )}

        {cooldownSec > 0 && (
          <p className="text-xs text-destructive text-center">
            Too many attempts. Try again in {cooldownSec}s.
          </p>
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "signin" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </Button>

        {needsConfirmation && (
          <button
            type="button"
            onClick={resendConfirmation}
            disabled={resending}
            className="w-full text-xs text-primary hover:underline font-medium disabled:opacity-60"
          >
            {resending ? "Sending…" : "Resend confirmation email"}
          </button>
        )}
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="relative mt-1.5">
        <Icon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        {children}
      </div>
    </div>
  );
}
