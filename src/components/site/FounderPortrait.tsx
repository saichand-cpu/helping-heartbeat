import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/humanlink-logo.jpeg.asset.json";

const BUCKET = "founder-assets";
const PATH = "portrait.jpg";
const TEAM_BUCKET = "team-avatars";

/**
 * Founder portrait with admin-only upload gate.
 * - Public/standard users: read-only, no file inputs rendered.
 * - Admin (L. Saichand): gold-trimmed "Upload New Portrait" overlay.
 * Storage RLS enforces the same rule server-side (403 for non-admins).
 */
export function FounderPortrait() {
  const { isAdmin } = useIsAdmin();
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    // Preferred source: the `Founder` row in team_members.
    const { data: member } = await supabase
      .from("team_members")
      .select("image_url")
      .eq("role_title", "Founder")
      .maybeSingle();

    const stored = member?.image_url ?? null;
    if (stored) {
      if (stored.startsWith(`${TEAM_BUCKET}:`)) {
        const { data, error } = await supabase.storage
          .from(TEAM_BUCKET)
          .createSignedUrl(stored.slice(TEAM_BUCKET.length + 1), 60 * 60 * 24 * 30);
        if (!error && data?.signedUrl) {
          setUrl(data.signedUrl);
          return;
        }
      } else if (stored.startsWith("http")) {
        setUrl(stored);
        return;
      }
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(PATH, 60 * 60 * 24 * 30); // 30d
    if (!error && data?.signedUrl) setUrl(data.signedUrl);
  };

  useEffect(() => { load(); }, []);


  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(PATH, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Founder portrait updated");
    await load();
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="relative">
      <div className="aspect-square rounded-[2rem] bg-card border border-border shadow-pop p-1 rotate-3 hover:rotate-0 transition-transform duration-500 ring-1 ring-amber-500/20">
        <div className="h-full w-full rounded-[1.7rem] bg-primary flex items-center justify-center text-primary-foreground overflow-hidden">
          {url ? (
            <img src={url} alt="L. Saichand, Founder of HumanLink" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-bold">LS</div>
              <div className="mt-4 text-xl font-semibold">L. Saichand</div>
              <div className="text-sm opacity-90">Founder, HumanLink</div>
              <div className="text-xs opacity-75 mt-1">Hyderabad, India</div>
            </div>
          )}
        </div>
      </div>

      {/* Verified Founder Node badge — hardcoded, uneditable */}
      <div className="absolute -top-3 -right-3 bg-card border border-border rounded-full px-3 py-1.5 shadow-soft border border-amber-500/40 flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Verified Founder Node</span>
      </div>

      <div className="absolute -bottom-4 -left-4 rounded-2xl bg-card border border-border px-4 py-3 shadow-soft flex items-center gap-2">
        <img src={logoAsset.url} alt="" className="h-6 w-6 rounded" />
        <div>
          <div className="text-xs text-muted-foreground">Hyderabad, Telangana</div>
          <div className="text-sm font-semibold">India</div>
        </div>
      </div>

      {/* Admin-only upload trigger */}
      {isAdmin && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
          <Button
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300 border-0 shadow-sm font-semibold"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
            Upload New Portrait
          </Button>
        </>
      )}
    </div>
  );
}
