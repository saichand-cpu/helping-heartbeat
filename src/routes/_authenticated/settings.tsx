import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  User, Shield, Lock, Bell, MessageSquare, Settings2, CreditCard, BadgeCheck,
  Activity, Palette, Info, Loader2, Camera, LogOut, Trash2, ChevronRight, Ban,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { usePremium } from "@/hooks/use-premium";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { uploadFeedMedia } from "@/lib/upload";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — HumanLink" },
      { name: "description", content: "Manage your HumanLink account, privacy, notifications, and preferences." },
    ],
  }),
  component: SettingsPage,
});

type SectionId =
  | "account" | "security" | "privacy" | "notifications" | "chat"
  | "preferences" | "subscription" | "verification" | "activity"
  | "appearance" | "about";

const SECTIONS: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "preferences", label: "Preferences", icon: Settings2 },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "verification", label: "Verification", icon: BadgeCheck },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "about", label: "About", icon: Info },
];

function SettingsPage() {
  const [section, setSection] = useState<SectionId>("account");

  return (
    <div className="pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, privacy, and preferences.</p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <nav className="rounded-2xl bg-card border border-border p-2 h-fit lg:sticky lg:top-4 overflow-x-auto">
          <div className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="rounded-2xl bg-card border border-border p-4 md:p-6">
          {section === "account" && <AccountSection />}
          {section === "security" && <SecuritySection />}
          {section === "privacy" && <PrivacySection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "chat" && <ChatSection />}
          {section === "preferences" && <PreferencesSection />}
          {section === "subscription" && <SubscriptionSection />}
          {section === "verification" && <VerificationSection />}
          {section === "activity" && <ActivitySection />}
          {section === "appearance" && <AppearanceSection />}
          {section === "about" && <AboutSection />}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

/* ============ ACCOUNT ============ */
function AccountSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: "", username: "", bio: "", avatar_url: "", cover_url: "",
    date_of_birth: "", gender: "", profession: "", address: "",
    country: "", state: "", city: "", preferred_language: "",
  });
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: c }, { data: pv }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("profile_contacts").select("phone").eq("user_id", user.id).maybeSingle(),
        supabase.from("profile_private").select("date_of_birth, gender, address").eq("user_id", user.id).maybeSingle(),
      ]);
      if (p) {
        const pp = p as Record<string, unknown>;
        const priv = (pv ?? {}) as Record<string, unknown>;
        setForm({
          full_name: (pp.full_name as string) ?? "",
          username: (pp.username as string) ?? "",
          bio: (pp.bio as string) ?? "",
          avatar_url: (pp.avatar_url as string) ?? "",
          cover_url: (pp.cover_url as string) ?? "",
          date_of_birth: (priv.date_of_birth as string) ?? "",
          gender: (priv.gender as string) ?? "",
          profession: (pp.profession as string) ?? "",
          address: (priv.address as string) ?? "",
          country: (pp.country as string) ?? "",
          state: (pp.state as string) ?? "",
          city: (pp.city as string) ?? "",
          preferred_language: (pp.preferred_language as string) ?? "",
        });
      }
      setPhone((c as { phone?: string } | null)?.phone ?? "");
      setLoading(false);
    })();
  }, [user]);

  const handleImage = async (file: File, kind: "avatar" | "cover") => {
    if (!user) return;
    const setter = kind === "avatar" ? setUploadingAvatar : setUploadingCover;
    setter(true);
    try {
      const { signedUrl } = await uploadFeedMedia(file);
      const col = kind === "avatar" ? "avatar_url" : "cover_url";
      const patch = { [col]: signedUrl } as Record<string, string>;
      const { error } = await supabase.from("profiles").update(patch as never).eq("id", user.id);
      if (error) throw error;
      setForm((f) => ({ ...f, [col]: signedUrl }));
      toast.success(`${kind === "avatar" ? "Profile picture" : "Cover photo"} updated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setter(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      username: form.username.trim() || null,
      bio: form.bio.trim() || null,
      profession: form.profession.trim() || null,
      country: form.country.trim() || null,
      state: form.state.trim() || null,
      city: form.city.trim() || null,
      preferred_language: form.preferred_language || null,
    }).eq("id", user.id);
    const { error: privError } = await supabase.from("profile_private").upsert({
      user_id: user.id,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      address: form.address.trim() || null,
    });
    if (phone.trim()) {
      await supabase.from("profile_contacts").upsert({ user_id: user.id, phone: phone.trim() });
    }
    setSaving(false);
    if (error || privError) return toast.error((error ?? privError)!.message);
    toast.success("Profile saved");
  };

  if (loading) return <SkeletonBlock />;

  return (
    <div>
      <SectionHeader title="Account" description="Update your public profile information." />
      {/* Cover */}
      <div className="relative rounded-2xl overflow-hidden h-40 bg-muted mb-4 group">
        {form.cover_url ? (
          <img src={form.cover_url} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary opacity-60" />
        )}
        <button
          onClick={() => coverInput.current?.click()}
          className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white"
        >
          {uploadingCover ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Camera className="h-5 w-5 mr-2" /> Change cover</>}
        </button>
        <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0], "cover")} />
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 -mt-14 ml-4 mb-6 relative z-10">
        <div className="relative">
          <div className="h-24 w-24 rounded-full ring-4 ring-background overflow-hidden bg-muted">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-2xl font-bold text-muted-foreground">
                {form.full_name.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <button
            onClick={() => avatarInput.current?.click()}
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg"
          >
            {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0], "avatar")} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="Username"><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="@username" /></Field>
        <Field label="Email"><Input value={user?.email ?? ""} disabled /></Field>
        <Field label="Mobile number"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." /></Field>
        <Field label="Date of birth"><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></Field>
        <Field label="Gender">
          <Select value={form.gender || undefined} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="nonbinary">Non-binary</SelectItem>
              <SelectItem value="prefer_not">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Occupation"><Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} /></Field>
        <Field label="Preferred language">
          <Select value={form.preferred_language || undefined} onValueChange={(v) => setForm({ ...form, preferred_language: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["English","Hindi","Tamil","Telugu","Kannada","Marathi","Bengali","Spanish","French"].map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Country"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Field>
        <Field label="State"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
        <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        <Field label="Address" className="md:col-span-2"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="Bio" className="md:col-span-2">
          <Textarea rows={3} value={form.bio} maxLength={500} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

/* ============ SECURITY ============ */
function SecuritySection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) return toast.error(error.message);
    setPw(""); setPw2("");
    toast.success("Password updated");
  };

  const signOutOthers = async () => {
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) return toast.error(error.message);
    toast.success("Signed out of other sessions");
  };

  const deactivate = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ deactivated_at: new Date().toISOString() }).eq("id", user.id);
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const deleteAccount = async () => {
    if (!user) return;
    // Soft-delete: mark deactivated + suspend, clear profile fields. Full deletion needs super-admin.
    const { error } = await supabase.from("profiles").update({
      deactivated_at: new Date().toISOString(),
      suspended: true,
      suspended_reason: "user_requested_deletion",
      suspended_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    await supabase.auth.signOut();
    toast.success("Account scheduled for deletion");
    navigate({ to: "/" });
  };

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader title="Change password" />
        <div className="grid md:grid-cols-2 gap-4 max-w-lg">
          <Field label="New password"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <Field label="Confirm password"><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={changePassword} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}</Button>
          <Link to="/forgot-password"><Button variant="ghost">Forgot password?</Button></Link>
        </div>
      </div>

      <Separator />

      <div>
        <SectionHeader title="Sessions" description="Manage where you're signed in." />
        <div className="rounded-xl border p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Current session</p>
            <p className="text-xs text-muted-foreground">This device</p>
          </div>
          <Button variant="outline" onClick={signOutOthers}>Sign out other devices</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Two-factor authentication coming soon.</p>
      </div>

      <Separator />

      <div>
        <SectionHeader title="Danger zone" description="These actions are permanent." />
        <div className="space-y-3">
          <DangerRow
            title="Deactivate account"
            description="Temporarily hide your profile. Reactivate any time by signing in."
            actionLabel="Deactivate"
            onConfirm={deactivate}
          />
          <DangerRow
            title="Delete account"
            description="Your account will be scheduled for permanent deletion."
            actionLabel="Delete"
            destructive
            onConfirm={deleteAccount}
          />
        </div>
      </div>
    </div>
  );
}

function DangerRow({ title, description, actionLabel, onConfirm, destructive }: {
  title: string; description: string; actionLabel: string; onConfirm: () => void; destructive?: boolean;
}) {
  return (
    <div className="rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={destructive ? "destructive" : "outline"}>{actionLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>{description} This cannot be undone easily.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>{actionLabel}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ============ PRIVACY ============ */
type PrivacyRow = {
  profile_visibility: string; who_can_message: string;
  who_can_view_followers: string; who_can_view_following: string;
  who_can_view_phone: string; who_can_view_email: string;
  show_online_status: boolean; show_last_seen: boolean;
  show_activity_status: boolean; allow_profile_indexing: boolean;
};
const PRIVACY_DEFAULT: PrivacyRow = {
  profile_visibility: "public", who_can_message: "everyone",
  who_can_view_followers: "everyone", who_can_view_following: "everyone",
  who_can_view_phone: "nobody", who_can_view_email: "nobody",
  show_online_status: true, show_last_seen: true,
  show_activity_status: true, allow_profile_indexing: true,
};

function PrivacySection() {
  const { user } = useAuth();
  const [row, setRow] = useState<PrivacyRow>(PRIVACY_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profile_privacy").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setRow({ ...PRIVACY_DEFAULT, ...(data as Partial<PrivacyRow>) });
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profile_privacy").upsert({ user_id: user.id, ...row });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Privacy updated");
  };

  if (loading) return <SkeletonBlock />;

  const WHO = [
    { v: "everyone", l: "Everyone" },
    { v: "followers", l: "Followers" },
    { v: "following", l: "Following" },
    { v: "nobody", l: "Nobody" },
  ];

  return (
    <div>
      <SectionHeader title="Privacy" description="Control who can see and contact you." />
      <div className="space-y-4">
        <SelectRow label="Profile visibility" value={row.profile_visibility} onChange={(v) => setRow({ ...row, profile_visibility: v })}
          options={[{ v: "public", l: "Public" }, { v: "private", l: "Private" }]} />
        <SelectRow label="Who can message me" value={row.who_can_message} onChange={(v) => setRow({ ...row, who_can_message: v })} options={WHO} />
        <SelectRow label="Who can view my followers" value={row.who_can_view_followers} onChange={(v) => setRow({ ...row, who_can_view_followers: v })} options={WHO} />
        <SelectRow label="Who can view following" value={row.who_can_view_following} onChange={(v) => setRow({ ...row, who_can_view_following: v })} options={WHO} />
        <SelectRow label="Who can view my phone" value={row.who_can_view_phone} onChange={(v) => setRow({ ...row, who_can_view_phone: v })} options={WHO} />
        <SelectRow label="Who can view my email" value={row.who_can_view_email} onChange={(v) => setRow({ ...row, who_can_view_email: v })} options={WHO} />
        <Separator />
        <SwitchRow label="Show online status" checked={row.show_online_status} onChange={(v) => setRow({ ...row, show_online_status: v })} />
        <SwitchRow label="Show last seen" checked={row.show_last_seen} onChange={(v) => setRow({ ...row, show_last_seen: v })} />
        <SwitchRow label="Show activity status" checked={row.show_activity_status} onChange={(v) => setRow({ ...row, show_activity_status: v })} />
        <SwitchRow label="Allow profile indexing by search engines" checked={row.allow_profile_indexing} onChange={(v) => setRow({ ...row, allow_profile_indexing: v })} />
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}

/* ============ NOTIFICATIONS ============ */
type NotifRow = {
  push_enabled: boolean; email_enabled: boolean; chat_notifications: boolean;
  request_updates: boolean; donation_updates: boolean; followers: boolean;
  likes: boolean; comments: boolean; mentions: boolean;
  marketing_emails: boolean; product_updates: boolean;
};
const NOTIF_DEFAULT: NotifRow = {
  push_enabled: true, email_enabled: true, chat_notifications: true,
  request_updates: true, donation_updates: true, followers: true,
  likes: true, comments: true, mentions: true,
  marketing_emails: false, product_updates: true,
};

function NotificationsSection() {
  const { user } = useAuth();
  const [row, setRow] = useState<NotifRow>(NOTIF_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("notification_prefs").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setRow({ ...NOTIF_DEFAULT, ...(data as Partial<NotifRow>) });
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("notification_prefs").upsert({ user_id: user.id, ...row });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Notifications updated");
  };

  if (loading) return <SkeletonBlock />;

  const items: [keyof NotifRow, string][] = [
    ["push_enabled", "Push notifications"],
    ["email_enabled", "Email notifications"],
    ["chat_notifications", "Chat notifications"],
    ["request_updates", "Help request updates"],
    ["donation_updates", "Donation updates"],
    ["followers", "New followers"],
    ["likes", "Post likes"],
    ["comments", "Comments"],
    ["mentions", "Mentions"],
    ["marketing_emails", "Marketing emails"],
    ["product_updates", "Product updates"],
  ];

  return (
    <div>
      <SectionHeader title="Notifications" description="Choose which alerts you receive." />
      <div className="space-y-3">
        {items.map(([k, l]) => (
          <SwitchRow key={k} label={l} checked={row[k]} onChange={(v) => setRow({ ...row, [k]: v })} />
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}

/* ============ CHAT ============ */
function ChatSection() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({
    read_receipts: true, typing_indicator: true, auto_download_images: true,
    auto_download_videos: false, auto_play_media: true, save_media: false,
    wallpaper: "default", font_size: "md",
  });
  const [blocked, setBlocked] = useState<{ id: string; blocked_user_id: string; full_name?: string | null }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hl-chat-prefs");
      if (raw) setPrefs((p) => ({ ...p, ...JSON.parse(raw) }));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("blocked_users")
        .select("id, blocked_user_id, profiles:blocked_user_id(full_name)")
        .eq("blocker_id", user.id);
      setBlocked((data ?? []).map((r) => {
        const rr = r as { id: string; blocked_user_id: string; profiles: { full_name?: string | null } | null };
        return { id: rr.id, blocked_user_id: rr.blocked_user_id, full_name: rr.profiles?.full_name };
      }));
    })();
  }, [user]);

  const savePrefs = (next: typeof prefs) => {
    setPrefs(next);
    localStorage.setItem("hl-chat-prefs", JSON.stringify(next));
  };

  const unblock = async (id: string) => {
    const { error } = await supabase.from("blocked_users").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setBlocked((b) => b.filter((x) => x.id !== id));
    toast.success("Unblocked");
  };

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader title="Chat" description="How your conversations behave." />
        <div className="space-y-3">
          <SwitchRow label="Read receipts" checked={prefs.read_receipts} onChange={(v) => savePrefs({ ...prefs, read_receipts: v })} />
          <SwitchRow label="Typing indicator" checked={prefs.typing_indicator} onChange={(v) => savePrefs({ ...prefs, typing_indicator: v })} />
          <SwitchRow label="Auto-download images" checked={prefs.auto_download_images} onChange={(v) => savePrefs({ ...prefs, auto_download_images: v })} />
          <SwitchRow label="Auto-download videos" checked={prefs.auto_download_videos} onChange={(v) => savePrefs({ ...prefs, auto_download_videos: v })} />
          <SwitchRow label="Auto-play media" checked={prefs.auto_play_media} onChange={(v) => savePrefs({ ...prefs, auto_play_media: v })} />
          <SwitchRow label="Save media automatically" checked={prefs.save_media} onChange={(v) => savePrefs({ ...prefs, save_media: v })} />
          <SelectRow label="Chat wallpaper" value={prefs.wallpaper} onChange={(v) => savePrefs({ ...prefs, wallpaper: v })}
            options={[{ v: "default", l: "Default" }, { v: "aurora", l: "Aurora" }, { v: "night", l: "Night" }, { v: "warm", l: "Warm" }]} />
          <SelectRow label="Font size" value={prefs.font_size} onChange={(v) => savePrefs({ ...prefs, font_size: v })}
            options={[{ v: "sm", l: "Small" }, { v: "md", l: "Medium" }, { v: "lg", l: "Large" }]} />
        </div>
      </div>

      <Separator />

      <div>
        <SectionHeader title="Blocked users" description={`${blocked.length} blocked`} />
        {blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted grid place-items-center"><Ban className="h-4 w-4 text-muted-foreground" /></div>
                  <span className="text-sm font-medium">{b.full_name ?? "Unknown user"}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => unblock(b.id)}>Unblock</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ============ PREFERENCES ============ */
function PreferencesSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    location: "", search_radius: 25, availability: "", categories: "",
    skills: "", emergency_contact: "", preferred_language: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("location, search_radius, availability, categories, skills, emergency_contact, preferred_language").eq("id", user.id).maybeSingle();
      if (data) {
        const d = data as Record<string, unknown>;
        setForm({
          location: (d.location as string) ?? "",
          search_radius: (d.search_radius as number) ?? 25,
          availability: (d.availability as string) ?? "",
          categories: ((d.categories as string[]) ?? []).join(", "),
          skills: ((d.skills as string[]) ?? []).join(", "),
          emergency_contact: (d.emergency_contact as string) ?? "",
          preferred_language: (d.preferred_language as string) ?? "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      location: form.location.trim() || null,
      search_radius: form.search_radius,
      availability: form.availability || null,
      categories: form.categories.split(",").map((s) => s.trim()).filter(Boolean),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      emergency_contact: form.emergency_contact.trim() || null,
      preferred_language: form.preferred_language || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Preferences saved");
  };

  if (loading) return <SkeletonBlock />;

  return (
    <div>
      <SectionHeader title="HumanLink Preferences" description="Help us match you better." />
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Default location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, State" /></Field>
        <Field label="Search radius (km)"><Input type="number" min={1} max={500} value={form.search_radius} onChange={(e) => setForm({ ...form, search_radius: Number(e.target.value) })} /></Field>
        <Field label="Volunteer availability">
          <Select value={form.availability || undefined} onValueChange={(v) => setForm({ ...form, availability: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="anytime">Anytime</SelectItem>
              <SelectItem value="weekdays">Weekdays</SelectItem>
              <SelectItem value="weekends">Weekends</SelectItem>
              <SelectItem value="evenings">Evenings</SelectItem>
              <SelectItem value="on_call">On call</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Emergency contact"><Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} placeholder="+91 ..." /></Field>
        <Field label="Preferred categories" className="md:col-span-2"><Input value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} placeholder="Comma separated: medical, teaching, delivery" /></Field>
        <Field label="Skills" className="md:col-span-2"><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Comma separated" /></Field>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}

/* ============ SUBSCRIPTION ============ */
function SubscriptionSection() {
  const { tier, godMode } = usePremium();
  return (
    <div>
      <SectionHeader title="Subscription" description="Your plan and billing." />
      <div className="rounded-2xl border p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="text-2xl font-bold capitalize">{godMode ? "God-mode (Admin)" : tier ?? "Free"}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/pricing"><Button className="bg-primary text-primary-foreground hover:bg-primary/90">Upgrade plan</Button></Link>
        </div>
      </div>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <InfoCard title="Payment history" text="Your past invoices will appear here." />
        <InfoCard title="Saved payment methods" text="Manage cards & UPI in your next checkout." />
        <InfoCard title="Billing information" text="Update your billing name & address at checkout." />
        <InfoCard title="Invoices" text="Contact support to download historical invoices." />
      </div>
    </div>
  );
}

/* ============ VERIFICATION ============ */
function VerificationSection() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<{ id: string; kind: string; status: string; created_at: string }[]>([]);
  const [kind, setKind] = useState<"ngo" | "business" | "identity">("identity");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("verification_requests").select("id, kind, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    setRequests((data ?? []) as { id: string; kind: string; status: string; created_at: string }[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("verification_requests").insert({ user_id: user.id, kind, notes: notes.trim() || null });
    setSaving(false);
    if (error) return toast.error(error.message);
    setNotes("");
    toast.success("Verification request submitted");
    load();
  };

  return (
    <div>
      <SectionHeader title="Verification" description="Get a verified badge on your profile." />
      <div className="rounded-2xl border p-4 space-y-4">
        <Field label="Verification type">
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="identity">Identity verification</SelectItem>
              <SelectItem value="ngo">NGO verification</SelectItem>
              <SelectItem value="business">Business verification</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Details (optional)">
          <Textarea rows={3} value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} placeholder="Registration numbers, website, or relevant links." />
        </Field>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit request"}</Button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Your requests</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <span className="capitalize font-medium">{r.kind}</span>
                  <span className="text-xs text-muted-foreground ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ============ ACTIVITY ============ */
function ActivitySection() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ karma: 0, requests: 0, offers: 0, reviews: 0, bookmarks: 0, followers: 0, following: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, req, off, rev, bm, fol, folg] = await Promise.all([
        supabase.from("profiles").select("karma_points").eq("id", user.id).maybeSingle(),
        supabase.from("help_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id),
        supabase.from("request_offers").select("id", { count: "exact", head: true }).eq("helper_id", user.id),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("reviewee_id", user.id),
        supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("followed_id", user.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);
      setStats({
        karma: (p.data as { karma_points?: number } | null)?.karma_points ?? 0,
        requests: req.count ?? 0, offers: off.count ?? 0, reviews: rev.count ?? 0,
        bookmarks: bm.count ?? 0, followers: fol.count ?? 0, following: folg.count ?? 0,
      });
    })();
  }, [user]);

  const items = [
    { label: "Karma points", value: stats.karma },
    { label: "Help requests", value: stats.requests },
    { label: "Offers made", value: stats.offers },
    { label: "Reviews received", value: stats.reviews },
    { label: "Saved items", value: stats.bookmarks },
    { label: "Followers", value: stats.followers },
    { label: "Following", value: stats.following },
  ];

  return (
    <div>
      <SectionHeader title="Activity" description="Your HumanLink footprint." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((i) => (
          <div key={i.label} className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">{i.label}</p>
            <p className="text-2xl font-bold mt-1">{i.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/requests"><Button variant="outline">My requests</Button></Link>
        <Link to="/feed"><Button variant="outline">My posts</Button></Link>
        <Link to="/profile"><Button variant="outline">Full profile</Button></Link>
      </div>
    </div>
  );
}

/* ============ APPEARANCE ============ */
function AppearanceSection() {
  const { theme, toggle } = useTheme();
  const [fontSize, setFontSize] = useState<string>(() => (typeof window !== "undefined" && localStorage.getItem("hl-font-size")) || "md");
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => (typeof window !== "undefined" && localStorage.getItem("hl-reduced-motion") === "1"));

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
    localStorage.setItem("hl-font-size", fontSize);
  }, [fontSize]);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? "1" : "0";
    localStorage.setItem("hl-reduced-motion", reducedMotion ? "1" : "0");
  }, [reducedMotion]);

  return (
    <div>
      <SectionHeader title="Appearance" description="Theme & accessibility." />
      <div className="space-y-4">
        <div className="rounded-xl border p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-xs text-muted-foreground capitalize">{theme}</p>
          </div>
          <Button variant="outline" onClick={toggle}>Switch to {theme === "dark" ? "light" : "dark"}</Button>
        </div>
        <SelectRow label="Font size" value={fontSize} onChange={setFontSize}
          options={[{ v: "sm", l: "Small" }, { v: "md", l: "Medium" }, { v: "lg", l: "Large" }, { v: "xl", l: "Extra large" }]} />
        <SwitchRow label="Reduce motion" checked={reducedMotion} onChange={setReducedMotion} />
      </div>
    </div>
  );
}

/* ============ ABOUT ============ */
function AboutSection() {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };
  const links = [
    { l: "Privacy Policy", to: "/about" },
    { l: "Terms & Conditions", to: "/about" },
    { l: "Community Guidelines", to: "/about" },
    { l: "Help Center", to: "/about" },
    { l: "Contact Support", to: "/about" },
  ] as const;
  return (
    <div>
      <SectionHeader title="About" />
      <ul className="divide-y rounded-xl border">
        {links.map((x) => (
          <li key={x.l}>
            <Link to={x.to} className="flex items-center justify-between p-3 hover:bg-accent">
              <span className="text-sm font-medium">{x.l}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
        <li className="p-3 flex items-center justify-between text-sm">
          <span className="font-medium">App version</span>
          <span className="text-muted-foreground">1.0.0</span>
        </li>
      </ul>
      <div className="mt-6">
        <Button variant="destructive" onClick={signOut}><LogOut className="h-4 w-4 mr-2" /> Sign out</Button>
      </div>
    </div>
  );
}

/* ============ Shared UI ============ */
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <Label className="text-sm font-medium">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SelectRow({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[];
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3 gap-4">
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{text}</p>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

// Silence unused imports lint (icons reserved for future rows)
void Trash2;
