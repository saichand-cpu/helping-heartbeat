import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Award, ShieldCheck, EyeOff, Camera, MapPin } from "lucide-react";
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
import { ProfileMediaGrid } from "@/components/site/ProfileMediaGrid";
import { usePremium } from "@/hooks/use-premium";
import { Link } from "@tanstack/react-router";
import { useFollow } from "@/hooks/use-follow";
import { uploadFeedMedia, signFeedMedia } from "@/lib/upload";
import { AccountTypeSelector } from "@/components/site/AccountTypeSelector";
import { isNgo, type AccountType, type OrgType } from "@/lib/org-types";

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
    avatar_url: "" as string | null | "",
    account_type: "individual" as AccountType,
    org_type: null as OrgType | null,
    fundraising_link: "",
    operational_hours: "",
    website_url: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const follow = useFollow(meId);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setLoading(false);
        return;
      }
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
          avatar_url: (data as { avatar_url?: string | null }).avatar_url ?? "",
          account_type: (((data as { account_type?: string }).account_type as AccountType) ?? "individual"),
          org_type: (((data as { org_type?: string | null }).org_type as OrgType | null) ?? null),
          fundraising_link: ((data as { fundraising_link?: string | null }).fundraising_link) ?? "",
          operational_hours: ((data as { operational_hours?: string | null }).operational_hours) ?? "",
          website_url: ((data as { website_url?: string | null }).website_url) ?? "",
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
    if (!u?.user) {
      setSaving(false);
      toast.error("Please sign in again.");
      return;
    }
    const effectiveHours =
      profile.account_type === "business" && !profile.operational_hours.trim()
        ? "9 AM - 6 PM"
        : profile.operational_hours.trim() || null;
    const [{ error }, { error: contactErr }] = await Promise.all([
      supabase.from("profiles").update({
        full_name: profile.full_name,
        bio: profile.bio,
        location: profile.location,
        role: profile.role as never,
        skills: profile.skills.split(",").map((s) => s.trim()).filter(Boolean),
        languages: profile.languages.split(",").map((s) => s.trim()).filter(Boolean),
        profession: profile.profession.trim(),
        account_type: profile.account_type,
        org_type: profile.account_type === "business" ? profile.org_type : null,
        fundraising_link: profile.fundraising_link.trim() || null,
        operational_hours: effectiveHours,
        website_url: profile.account_type === "business" ? (profile.website_url.trim() || null) : null,
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

  const changeAvatar = async (file: File | null) => {
    if (!file || !meId) return;
    setUploadingAvatar(true);
    try {
      const media = await uploadFeedMedia(file);
      const signed = await signFeedMedia(media.path, 60 * 60 * 24 * 365);
      const { error } = await supabase.from("profiles").update({ avatar_url: signed } as never).eq("id", meId);
      if (error) throw error;
      setProfile((p) => ({ ...p, avatar_url: signed }));
      toast.success("Profile picture updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) return <div className="rounded-3xl bg-card border border-border h-96 animate-pulse" />;

  const initial = (profile.full_name || "?").charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-6 space-y-6">
      <div className="rounded-3xl bg-card border border-border p-5 md:p-6 shadow-pop">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-8">
          <div className="relative group shrink-0">
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary grid place-items-center text-primary-foreground text-3xl font-bold ring-2 ring-border">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initial}
            </div>
            <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition grid place-items-center text-primary-foreground" aria-label="Change profile picture">
              {uploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => changeAvatar(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">{profile.full_name || "Your profile"}</h1>
              {profile.verified && <ShieldCheck className="h-5 w-5 text-primary" />}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 max-w-md">
              {[{ n: postCount, l: "Posts" }, { n: follow.followers, l: "Followers" }, { n: follow.followingCount, l: "Following" }].map((s) => (
                <div key={s.l} className="text-center">
                  <div className="text-xl md:text-2xl font-black text-foreground tabular-nums">{s.n.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5 font-semibold">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              {profile.location && <div className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</div>}
              {profile.bio && <p className="whitespace-pre-wrap break-words">{profile.bio}</p>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="secondary" className="gap-1"><Award className="h-3 w-3" /> {profile.karma_points} karma</Badge>
                <Badge variant="secondary">{profile.role}</Badge>
                {profile.incognito && <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" /> Incognito</Badge>}
              </div>
            </div>
            <div className="mt-4"><Button type="button" onClick={() => document.getElementById("edit-profile-form")?.scrollIntoView({ behavior: "smooth" })} className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-sm">Edit Bio</Button></div>
          </div>
        </div>
      </div>

      {meId && <ProfileMediaGrid userId={meId} isOwner onCountChange={setPostCount} />}

      <section className="rounded-3xl bg-card border border-border p-5 md:p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><EyeOff className="h-4 w-4" /></div>
            <div>
              <div className="font-semibold flex items-center gap-2">Incognito mode <Badge variant="outline" className="text-[10px]">Pro</Badge></div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">Appear as "Anonymous Helper" across the feed, comments, leaderboard, and request cards. Your own view is unchanged.</p>
              {!canIncognito && <Link to="/pricing" className="text-xs text-primary hover:underline inline-block mt-1">Upgrade to Pro →</Link>}
              {godMode && <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">God-mode: available without a subscription.</p>}
            </div>
          </div>
          <Switch checked={profile.incognito} onCheckedChange={toggleIncognito} disabled={!canIncognito || togglingIncognito} />
        </div>
      </section>

      {meId && <Storefront ownerId={meId} canManage unlocked={canStorefront} />}

      <form id="edit-profile-form" onSubmit={save} className="rounded-3xl bg-card border border-border p-6 md:p-8 space-y-5 shadow-soft">
        <h2 className="text-xl font-semibold">Edit your profile</h2>
        <div>
          <Label>Account type</Label>
          <div className="mt-2"><AccountTypeSelector accountType={profile.account_type} orgType={profile.org_type} onAccountTypeChange={(v) => setProfile({ ...profile, account_type: v })} onOrgTypeChange={(v) => setProfile({ ...profile, org_type: v })} /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>{profile.account_type === "business" ? (isNgo(profile.org_type) ? "Organization name" : "Business name") : "Full name"}</Label><Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
          <div><Label>Location</Label><Input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="City, country" /></div>
        </div>
        {profile.account_type === "business" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>{isNgo(profile.org_type) ? "Operational hours" : "Work hours"}</Label><Input value={profile.operational_hours} onChange={(e) => setProfile({ ...profile, operational_hours: e.target.value })} placeholder="9 AM - 6 PM" /><p className="text-[11px] text-muted-foreground mt-1">Defaults to 9 AM - 6 PM if left blank.</p></div>
            <div><Label>Website URL</Label><Input value={profile.website_url} onChange={(e) => setProfile({ ...profile, website_url: e.target.value })} placeholder="https://your-business.example" type="url" /></div>
            {isNgo(profile.org_type) && <div className="md:col-span-2"><Label>Fundraising / donation link</Label><Input value={profile.fundraising_link} onChange={(e) => setProfile({ ...profile, fundraising_link: e.target.value })} placeholder="upi://pay?pa=ngo@bank  or  https://donate.example.org" /></div>}
          </div>
        )}
        <div><Label>Bio</Label><Textarea rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell the community a bit about you." /></div>
        <div className="grid md:grid-cols-3 gap-4">
          <div><Label>I want to</Label><Select value={profile.role} onValueChange={(v) => setProfile({ ...profile, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="seeker">Find help</SelectItem><SelectItem value="helper">Offer help</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent></Select></div>
          <div><Label>Skills (comma-separated)</Label><Input value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} placeholder="tutoring, cooking, tech support" /></div>
          <div><Label>Languages</Label><Input value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} placeholder="English, Spanish" /></div>
        </div>
        <div><Label>Profession <span className="text-destructive">*</span></Label><div className="mt-2"><ProfessionPicker value={profile.profession} onChange={(v) => setProfile({ ...profile, profession: v })} /></div></div>
        <div><Label>Phone (private — only shown after you accept a helper's offer)</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" type="tel" /></div>
        <Button type="submit" disabled={saving || !profile.profession.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button>
        <p className="text-[11px] text-muted-foreground">Current tier: <span className="font-medium uppercase">{tier}</span></p>
      </form>
    </div>
  );
}
