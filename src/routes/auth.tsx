import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Heart, Loader2, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HumanLink" },
      {
        name: "description",
        content:
          "Sign in to HumanLink with your phone number. Fast, secure, no passwords.",
      },
    ],
  }),
  component: AuthPage,
});

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 India (+91)" },
  { code: "+1", label: "🇺🇸 US/Canada (+1)" },
  { code: "+44", label: "🇬🇧 UK (+44)" },
  { code: "+61", label: "🇦🇺 Australia (+61)" },
  { code: "+971", label: "🇦🇪 UAE (+971)" },
  { code: "+65", label: "🇸🇬 Singapore (+65)" },
  { code: "+49", label: "🇩🇪 Germany (+49)" },
  { code: "+33", label: "🇫🇷 France (+33)" },
  { code: "+81", label: "🇯🇵 Japan (+81)" },
  { code: "+880", label: "🇧🇩 Bangladesh (+880)" },
  { code: "+92", label: "🇵🇰 Pakistan (+92)" },
  { code: "+94", label: "🇱🇰 Sri Lanka (+94)" },
];

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
            Sign in with your phone. No passwords, no email — just an OTP and
            you're in.
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
          <PhoneOtpFlow />
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

type Step = "phone" | "otp";

function PhoneOtpFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fullPhone = useMemo(
    () => `${countryCode}${phone.replace(/\D/g, "")}`,
    [countryCode, phone],
  );

  useEffect(() => {
    if (resendIn <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setResendIn((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resendIn]);

  const validPhone = /^\+\d{7,15}$/.test(fullPhone);

  const sendOtp = async (isResend = false) => {
    if (!validPhone) {
      toast.error("Enter a valid phone number");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Could not send OTP");
      return;
    }
    toast.success(isResend ? "OTP resent" : "OTP sent to your phone");
    setStep("otp");
    setResendIn(45);
  };

  const verifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error || !data.session) {
      toast.error(error?.message || "Invalid or expired code");
      return;
    }
    // Ensure profile row exists / phone is up to date.
    try {
      await supabase
        .from("profiles")
        .upsert(
          { id: data.session.user.id },
          { onConflict: "id", ignoreDuplicates: true },
        );
    } catch {
      // Trigger handles it; ignore.
    }
    toast.success("Welcome to HumanLink");
    navigate({ to: "/dashboard" });
  };

  if (step === "phone") {
    return (
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" /> Sign in with your phone
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          We'll send a one-time code by SMS.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp(false);
          }}
          className="space-y-4 mt-6"
        >
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <div className="mt-1 flex gap-2">
              <select
                aria-label="Country code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-2 text-sm min-w-[110px]"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Input
                id="phone"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^\d\s-]/g, ""))
                }
                placeholder="98765 43210"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              We'll text{" "}
              <span className="font-mono">
                {validPhone ? fullPhone : "your number"}
              </span>{" "}
              a 6-digit code.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !validPhone}
            className="w-full h-11 bg-gradient-brand text-primary-foreground border-0 shadow-glow"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Send OTP"
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setOtp("");
        }}
        className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Change number
      </button>
      <h1 className="mt-2 text-2xl font-bold flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" /> Enter the code
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Sent to <span className="font-mono">{fullPhone}</span>
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          verifyOtp();
        }}
        className="space-y-5 mt-6"
      >
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            autoFocus
            inputMode="numeric"
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="submit"
          disabled={loading || otp.length < 6}
          className="w-full h-11 bg-gradient-brand text-primary-foreground border-0 shadow-glow"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Verify & Continue"
          )}
        </Button>

        <div className="text-center text-sm">
          {resendIn > 0 ? (
            <span className="text-muted-foreground">
              Resend code in {resendIn}s
            </span>
          ) : (
            <button
              type="button"
              onClick={() => sendOtp(true)}
              disabled={loading}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              Resend OTP
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
