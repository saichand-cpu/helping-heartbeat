import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing you in — HumanLink" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      // Supabase JS auto-exchanges ?code=... via detectSessionInUrl.
      // We defensively handle it here too in case that hasn't fired yet.
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const errorDescription =
        url.searchParams.get("error_description") ?? url.hash.match(/error_description=([^&]+)/)?.[1];

      if (errorDescription) {
        toast.error(decodeURIComponent(errorDescription));
        if (!cancelled) navigate({ to: "/auth" });
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !cancelled) {
          toast.error(error.message);
          navigate({ to: "/auth" });
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        navigate({ to: "/dashboard" });
      } else {
        // Wait one tick for detectSessionInUrl / hash flow
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            sub.subscription.unsubscribe();
            navigate({ to: "/dashboard" });
          }
        });
        setTimeout(() => {
          sub.subscription.unsubscribe();
          if (!cancelled) navigate({ to: "/auth" });
        }, 4000);
      }
    }

    complete();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Signing you in…
      </div>
    </div>
  );
}
