import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Heart, Loader2, Mail, Lock, User, Phone } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-hero grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand/30 blur-3xl animate-pulse-glow"
          aria-hidden
        />
        <div
          className="absolute -top-32 -right-10 h-80 w-80 rounded-full bg-primary/30 blur-3xl animate-pulse-glow"
          aria-hidden
        />
        <Logo />
        <div className="relative space-y-6">
          <h2 className="text-5xl font-bold leading-tight">
            Helping begins with{" "}
            <span className="text-gradient-brand">one tap</span>
          </h2>
          <p className="text-muted-foreground max-w-md">
            Create your account and start connecting instantly. No verification,
            no waiting.
          </p>
          <div className="glass rounded-2xl p-5 max-w-md shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-brand grid place-items-center text-primary-foreground">
                <Heart className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <div className="font-semibold">120,000+ kind humans</div>
                <div className="text-muted-foreground text-xs">
                  already helping each other
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground relative">
          © {new Date().getFullYear()} HumanLink
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass rounded-3xl p-8 shadow-pop"
        >
          <div className="lg:hidden mb-6">
            <Logo />
          </div>
          <EmailAuthFlow />
          <p className="mt-6 text-xs text-center text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}

type Mode = "signin" | "signup";

// Simple client-side cooldown to slow down brute-force / spam attempts.
// Server-side Supabase auth also rate-limits; this is a UX guardrail.
const ATTEMPT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60_000;

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
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
          },
        });
        if (error) {
          registerAttempt();
          toast.error(error.message || "Could not create account");
          return;
        }
        // With auto-confirm on, signUp returns a session immediately.
        if (!data.session) {
          // Fallback: sign in explicitly.
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (signInErr) {
            toast.error(signInErr.message || "Signed up, please sign in");
            setMode("signin");
            return;
          }
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
          registerAttempt();
          toast.error(error.message || "Invalid email or password");
          return;
        }
        clearCooldown();
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        {mode === "signin"
          ? "Sign in with your email and password."
          : "It only takes a moment — no verification needed."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        {mode === "signup" && (
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <div className="relative mt-1">
              <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="fullName"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aarav Sharma"
                className="pl-9"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="email">Email address</Label>
          <div className="relative mt-1">
            <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-9"
            />
          </div>
        </div>

        {mode === "signup" && (
          <div>
            <Label htmlFor="phone">Mobile number</Label>
            <div className="relative mt-1">
              <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="pl-9"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="pl-9"
            />
          </div>
          {mode === "signup" && password.length > 0 && !validPassword && (
            <p className="text-xs text-destructive mt-1">
              Password must be at least 8 characters.
            </p>
          )}
        </div>

        {cooldownSec > 0 && (
          <p className="text-xs text-destructive text-center">
            Too many attempts. Try again in {cooldownSec}s.
          </p>
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-11 bg-gradient-brand text-primary-foreground border-0 shadow-glow"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "signin" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              New to HumanLink?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-primary hover:underline font-medium"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
