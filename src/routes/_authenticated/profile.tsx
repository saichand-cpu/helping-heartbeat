import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Award, ShieldCheck, EyeOff, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Storefront } from "@/components/site/Storefront";
import { ProfessionPicker } from "@/components/site/ProfessionPicker";
import { usePremium } from "@/hooks/use-premium";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { canAccess, tier, godMode } = usePremium();
  const canIncognito = canAccess("pro");
  const canStorefront = canAccess("plus");
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingIncognito, setTogglingIncognito] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    bio: "",
    location: "",
    role: "both",
    skills: "",
    languages: "",
    phone: "",
    profession: "",
    karma_points: 0,
    verified: false,
    incognito: false,
    seeking_cofounder: false,
    cofounder_pitch: "",
  });
  const [savingCofounder, setSavingCofounder] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setMeId(u.user.id);
      const [{ data }, { data: contact }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("profile_contacts" as never).select("phone").eq("user_id", u.user.id).maybeSingle(),
      ]);
      if (data) {
        setProfile({
          full_name: data.full_name ?? "",
          bio: data.bio ?? "",
          location: data.location ?? "",
          role: data.role ?? "both",
          skills: (data.skills ?? []).join(", "),
          languages: (data.languages ?? []).join(", "),
          phone: ((contact as { phone?: string } | null)?.phone) ?? "",
          profession: ((data as { profession?: string | null }).profession) ?? "",
          karma_points: data.karma_points ?? 0,
          verified: data.verified ?? false,
          incognito: (data as { incognito?: boolean }).incognito ?? false,
          seeking_cofounder: (data as { seeking_cofounder?: boolean }).seeking_cofounder ?? false,
          cofounder_pitch: (data as { cofounder_pitch?: string | null }).cofounder_pitch ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.profession.trim()) {
      toast.error("Profession is required — pick one below.");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return;
    const [{ error }, { error: contactErr }] = await Promise.all([
      supabase.from("profiles").update({
        full_name: profile.full_name,
        bio: profile.bio,
        location: profile.location,
        role: profile.role as never,
        skills: profile.skills.split(",").map((s) => s.trim()).filter(Boolean),
        languages: profile.languages.split(",").map((s) => s.trim()).filter(Boolean),
        profession: profile.profession.trim(),
        onboarded: true,
      } as never).eq("id", u.user.id),
      supabase.from("profile_contacts" as never).upsert({
        user_id: u.user.id,
        phone: profile.phone.trim() || null,
      } as never),
    ]);
    setSaving(false);
    if (error) return toast.error(error.message);
    if (contactErr) return toast.error(contactErr.message);
    toast.success("Profile updated");
  };

  const toggleIncognito = async (next: boolean) => {
    if (!meId || !canIncognito) {
      toast.error("Incognito is a Pro perk");
      return;
    }
    setTogglingIncognito(true);
    setProfile((p) => ({ ...p, incognito: next }));
    const { error } = await supabase.from("profiles").update({ incognito: next } as never).eq("id", meId);
    setTogglingIncognito(false);
    if (error) {
      setProfile((p) => ({ ...p, incognito: !next }));
      return toast.error(error.message);
    }
    toast.success(next ? "Incognito on — you'll appear as Anonymous Helper" : "Incognito off");
  };

  const saveCofounder = async (nextFlag: boolean, nextPitch: string) => {
    if (!meId) return;
    setSavingCofounder(true);
    const { error } = await supabase
      .from("profiles")
      .update({ seeking_cofounder: nextFlag, cofounder_pitch: nextPitch.trim() || null } as never)
      .eq("id", meId);
    setSavingCofounder(false);
    if (error) return toast.error(error.message);
    toast.success(nextFlag ? "You're now listed on the Co-Founder board" : "Removed from the Co-Founder board");
  };

  if (loading) return <div className="glass rounded-3xl h-96 animate-pulse" />;

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-6 space-y-6">
      <div className="rounded-3xl bg-gradient-brand p-6 md:p-8 text-primary-foreground shadow-pop relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur grid place-items-center text-3xl font-bold">
            {profile.full_name.charAt(0) || "?"}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{profile.full_name || "Your profile"}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="gap-1"><Award className="h-3 w-3" /> {profile.karma_points} karma</Badge>
              {profile.verified && <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
              <Badge variant="secondary">{profile.role}</Badge>
              {profile.incognito && (
                <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" /> Incognito</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy: Incognito mode */}
      <section className="glass rounded-3xl p-5 md:p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <EyeOff className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold flex items-center gap-2">
                Incognito mode
                <Badge variant="outline" className="text-[10px]">Pro</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                Appear as "Anonymous Helper" across the feed, comments, leaderboard, and request cards. Your own view is unchanged.
              </p>
              {!canIncognito && (
                <Link to="/pricing" className="text-xs text-primary hover:underline inline-block mt-1">
                  Upgrade to Pro →
                </Link>
              )}
              {godMode && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">God-mode: available without a subscription.</p>
              )}
            </div>
          </div>
          <Switch
            checked={profile.incognito}
            onCheckedChange={toggleIncognito}
            disabled={!canIncognito || togglingIncognito}
          />
        </div>
      </section>

      {/* Seeking co-founder */}
      <section className="glass rounded-3xl p-5 md:p-6 shadow-soft space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Handshake className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold">Seeking a co-founder</div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                Turn this on to appear in the "Find a Co-Founder" carousel on the Founder page.
              </p>
            </div>
          </div>
          <Switch
            checked={profile.seeking_cofounder}
            onCheckedChange={(next) => {
              setProfile((p) => ({ ...p, seeking_cofounder: next }));
              saveCofounder(next, profile.cofounder_pitch);
            }}
            disabled={savingCofounder}
          />
        </div>
        {profile.seeking_cofounder && (
          <div>
            <Label>Your pitch (what you're building or looking for)</Label>
            <Textarea
              rows={3}
              value={profile.cofounder_pitch}
              onChange={(e) => setProfile({ ...profile, cofounder_pitch: e.target.value })}
              onBlur={() => saveCofounder(profile.seeking_cofounder, profile.cofounder_pitch)}
              placeholder="e.g. Building a community-first mental health app — looking for a technical partner who cares."
              maxLength={240}
            />
            <p className="text-[11px] text-muted-foreground mt-1">Saved automatically. {240 - (profile.cofounder_pitch?.length ?? 0)} characters left.</p>
          </div>
        )}
      </section>


      {/* Storefront */}
      {meId && (
        <Storefront ownerId={meId} canManage unlocked={canStorefront} />
      )}

      <form onSubmit={save} className="glass rounded-3xl p-6 md:p-8 space-y-5 shadow-soft">
        <h2 className="text-xl font-semibold">Edit your profile</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Full name</Label>
            <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="City, country" />
          </div>
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell the community a bit about you." />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>I want to</Label>
            <Select value={profile.role} onValueChange={(v) => setProfile({ ...profile, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="seeker">Find help</SelectItem>
                <SelectItem value="helper">Offer help</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Skills (comma-separated)</Label>
            <Input value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} placeholder="tutoring, cooking, tech support" />
          </div>
          <div>
            <Label>Languages</Label>
            <Input value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} placeholder="English, Spanish" />
          </div>
        </div>
        <div>
          <Label>Profession <span className="text-destructive">*</span></Label>
          <div className="mt-2">
            <ProfessionPicker
              value={profile.profession}
              onChange={(v) => setProfile({ ...profile, profession: v })}
            />
          </div>
        </div>
        <div>
          <Label>Phone (private — only shown after you accept a helper's offer)</Label>
          <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" type="tel" />
        </div>
        <Button
          type="submit"
          disabled={saving || !profile.profession.trim()}
          className="bg-gradient-brand text-primary-foreground border-0 shadow-glow"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
        <p className="text-[11px] text-muted-foreground">Current tier: <span className="font-medium uppercase">{tier}</span></p>
      </form>
    </div>
  );
}
