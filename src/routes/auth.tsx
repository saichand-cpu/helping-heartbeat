import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HumanLink" },
      { name: "description", content: "Sign in or create your HumanLink account to start helping and being helped." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) {
      toast.error("Could not sign in with Google");
      setLoading(false);
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand/30 blur-3xl animate-pulse-glow" aria-hidden />
        <div className="absolute -top-32 -right-10 h-80 w-80 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" aria-hidden />
        <Logo />
        <div className="relative space-y-6">
          <h2 className="text-5xl font-bold leading-tight">Helping begins with <span className="text-gradient-brand">one click</span></h2>
          <p className="text-muted-foreground max-w-md">Join a worldwide community of kindness. Post requests, offer help, earn karma.</p>
          <div className="glass rounded-2xl p-5 max-w-md shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-brand grid place-items-center text-primary-foreground"><Heart className="h-5 w-5" /></div>
              <div className="text-sm">
                <div className="font-semibold">120,000+ kind humans</div>
                <div className="text-muted-foreground text-xs">already helping each other</div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground relative">© {new Date().getFullYear()} HumanLink</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md glass rounded-3xl p-8 shadow-pop">
          <div className="lg:hidden mb-6"><Logo /></div>
          <h1 className="text-2xl font-bold">Welcome to HumanLink</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in or create an account to continue.</p>

          <Button onClick={handleGoogle} disabled={loading} variant="outline" className="w-full mt-6 h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>

          <p className="mt-6 text-xs text-center text-muted-foreground">
            By continuing you agree to our <Link to="/" className="underline">Terms</Link> and <Link to="/" className="underline">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div>
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div>
        <Label htmlFor="si-pass">Password</Label>
        <Input id="si-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-brand text-primary-foreground border-0 shadow-glow">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! You can sign in now.");
    navigate({ to: "/dashboard" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div>
        <Label htmlFor="su-name">Full name</Label>
        <Input id="su-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Kind" />
      </div>
      <div>
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div>
        <Label htmlFor="su-pass">Password</Label>
        <Input id="su-pass" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
      </div>
      <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-brand text-primary-foreground border-0 shadow-glow">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}
