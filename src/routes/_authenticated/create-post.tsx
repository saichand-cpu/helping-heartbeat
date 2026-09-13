import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, GraduationCap, Megaphone, Plus, Rocket, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RazorpayCheckoutModal } from "@/components/site/RazorpayCheckoutModal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/create-post")({
  component: CreatePostPage,
});

type Sector = "job" | "business" | "skill" | "service" | "announcement";

const SECTORS: { key: Sector; title: string; description: string; icon: typeof BriefcaseBusiness; paid: boolean }[] = [
  { key: "job", title: "Job Vacancy", description: "Hire employees, interns and talent.", icon: BriefcaseBusiness, paid: true },
  { key: "business", title: "Business Promotion", description: "Promote your company, shop or brand.", icon: Building2, paid: true },
  { key: "skill", title: "Teach a Skill", description: "Offer classes, mentoring or your expertise.", icon: GraduationCap, paid: true },
  { key: "service", title: "Professional Service", description: "Promote freelance and professional services.", icon: Users, paid: true },
  { key: "announcement", title: "Community Post", description: "Share a normal non-commercial update.", icon: Megaphone, paid: false },
];

function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sector, setSector] = useState<Sector>("job");
  const [premiumTier, setPremiumTier] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [details, setDetails] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const current = useMemo(() => SECTORS.find((s) => s.key === sector)!, [sector]);
  const isPaid = current.paid;
  const hasPro = premiumTier === "pro" || premiumTier === "business" || premiumTier === "professional";
  const canPublish = !isPaid || hasPro;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("premium_tier")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setPremiumTier(data?.premium_tier ?? null))
      .finally(() => setLoadingPlan(false));
  }, [user]);

  const addTag = () => {
    const value = tagInput.trim().replace(/^#/, "");
    if (!value || tags.includes(value) || tags.length >= 6) return;
    setTags((v) => [...v, value]);
    setTagInput("");
  };

  const publish = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!canPublish) {
      setCheckoutOpen(true);
      return;
    }
    if (!title.trim() || !details.trim()) {
      toast.error("Add a title and description before publishing.");
      return;
    }

    setPublishing(true);
    try {
      const parts = [
        title.trim(),
        company.trim() ? `Organization: ${company.trim()}` : "",
        location.trim() ? `Location: ${location.trim()}` : "",
        salary.trim() ? `Compensation: ${salary.trim()}` : "",
        details.trim(),
      ].filter(Boolean);

      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        body: parts.join("\n\n"),
        post_type: "normal",
        visibility: "public",
        hashtags: tags.length ? tags : [sector],
        is_announcement: isPaid,
      });
      if (error) throw error;
      toast.success("Published successfully on HumanLink.");
      navigate({ to: "/feed" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish your post.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground">← Back to feed</Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Create on HumanLink</h1>
            <p className="mt-1 text-muted-foreground">Jobs, skills, businesses, services and community — all in one network.</p>
          </div>
          <Link to="/pricing"><Button variant="outline">View plans</Button></Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl border bg-card p-5 md:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">01 · Choose purpose</div>
                  <h2 className="mt-1 text-xl font-semibold">What are you publishing?</h2>
                </div>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {SECTORS.map((item) => {
                  const Icon = item.icon;
                  const active = sector === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSector(item.key)}
                      className={cn("rounded-2xl border p-4 text-left transition-all", active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-muted")}><Icon className="h-5 w-5" /></div>
                        <div className="min-w-0">
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </div>
                      {item.paid && <div className="mt-3 text-[11px] font-medium text-primary">Professional posting · ₹599/mo</div>}
                    </button>
                  );
                })}
              </div>
            </section>

            <motion.section layout className="rounded-3xl border bg-card p-5 md:p-7">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">02 · Details</div>
              <h2 className="mt-1 text-xl font-semibold">{current.title}</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={sector === "job" ? "Position / role title" : sector === "skill" ? "Skill or class title" : "Post title"} />
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={sector === "job" ? "Company / organization" : "Business / creator name"} />
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" />
                {(sector === "job" || sector === "skill" || sector === "service") && <Input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder={sector === "job" ? "Salary / CTC" : "Price / fee (optional)"} />}
              </div>
              <Textarea className="mt-4 min-h-44" value={details} onChange={(e) => setDetails(e.target.value)} placeholder={sector === "job" ? "Describe the role, responsibilities, skills and how candidates can apply…" : "Describe what you are offering, who it is for, and how people can contact you…"} />

              <div className="mt-4">
                <div className="text-sm font-medium">Categories / hashtags</div>
                <div className="mt-2 flex gap-2">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="e.g. Hyderabad, Hiring, Python" />
                  <Button type="button" variant="outline" onClick={addTag}><Plus className="h-4 w-4" /></Button>
                </div>
                {tags.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{tags.map((tag) => <button key={tag} type="button" onClick={() => setTags((v) => v.filter((x) => x !== tag))} className="rounded-full bg-muted px-3 py-1 text-xs">#{tag} <X className="ml-1 inline h-3 w-3" /></button>)}</div>}
              </div>
            </motion.section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link to="/feed"><Button variant="ghost">Cancel</Button></Link>
              <Button size="lg" onClick={publish} disabled={publishing || loadingPlan} className="gap-2">
                {isPaid && !hasPro ? <ShieldCheck className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
                {isPaid && !hasPro ? "Unlock & Publish" : publishing ? "Publishing…" : "Publish on HumanLink"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border bg-card p-6">
              <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-primary" /> Publishing access</div>
              <div className="mt-4 rounded-2xl bg-muted/60 p-4">
                <div className="text-xs text-muted-foreground">Current account</div>
                <div className="mt-1 text-lg font-semibold">{hasPro ? "Professional access active" : "Free account"}</div>
                <div className="mt-1 text-xs text-muted-foreground">{hasPro ? "You can publish commercial opportunities." : "Commercial posts require a monthly plan."}</div>
              </div>
              {isPaid && !hasPro && (
                <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 font-semibold"><Rocket className="h-4 w-4 text-primary" /> HumanLink Pro</div>
                  <div className="mt-1 text-3xl font-bold">₹599<span className="text-sm font-medium text-muted-foreground">/month</span></div>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {["Job vacancies", "Business promotions", "Skill & service promotion", "Priority visibility"].map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{x}</li>)}
                  </ul>
                  <Button className="mt-5 w-full" onClick={() => setCheckoutOpen(true)}>Subscribe & continue</Button>
                </div>
              )}
              {!isPaid && <div className="mt-4 text-xs text-muted-foreground">Community posts remain free. Choose a professional category when you want to promote a job, business, skill or service.</div>}
            </div>

            <div className="rounded-3xl border bg-card p-6">
              <div className="text-sm font-semibold">HumanLink ecosystem</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {["Students", "Jobs", "Businesses", "Skills", "Freelancers", "NGOs", "Professionals", "Communities"].map((x) => <div key={x} className="rounded-xl bg-muted px-3 py-2">{x}</div>)}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <RazorpayCheckoutModal open={checkoutOpen} defaultTier="pro" onOpenChange={setCheckoutOpen} onSuccess={() => {
        setPremiumTier("pro");
        toast.success("Professional posting unlocked. You can publish now.");
      }} />
    </div>
  );
}
