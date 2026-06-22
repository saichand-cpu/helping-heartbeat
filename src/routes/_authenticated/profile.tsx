import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Award, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    bio: "",
    location: "",
    role: "both",
    skills: "",
    languages: "",
    karma_points: 0,
    verified: false,
  });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) {
        setProfile({
          full_name: data.full_name ?? "",
          bio: data.bio ?? "",
          location: data.location ?? "",
          role: data.role ?? "both",
          skills: (data.skills ?? []).join(", "),
          languages: (data.languages ?? []).join(", "),
          karma_points: data.karma_points ?? 0,
          verified: data.verified ?? false,
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      bio: profile.bio,
      location: profile.location,
      role: profile.role as never,
      skills: profile.skills.split(",").map((s) => s.trim()).filter(Boolean),
      languages: profile.languages.split(",").map((s) => s.trim()).filter(Boolean),
      onboarded: true,
    }).eq("id", u.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
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
            </div>
          </div>
        </div>
      </div>

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
        <Button type="submit" disabled={saving} className="bg-gradient-brand text-primary-foreground border-0 shadow-glow">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
