import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfessionPicker } from "@/components/site/ProfessionPicker";
import { AccountTypeSelector } from "@/components/site/AccountTypeSelector";
import { isNgo, type AccountType, type OrgType } from "@/lib/org-types";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [profession, setProfession] = useState("");
  const [location, setLocation] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) return;
      setMe(u.user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) {
        setFullName(data?.full_name ?? "");
        setLocation(data?.location ?? "");
        const prof = (data as { profession?: string | null }).profession ?? "";
        setProfession(prof);
        setAccountType(((data as { account_type?: string }).account_type as AccountType) ?? "individual");
        setOrgType(((data as { org_type?: string | null }).org_type as OrgType | null) ?? null);
        if (prof && (data.full_name ?? "").trim()) {
          navigate({ to: "/dashboard", replace: true });
        }
      }
    })();
  }, [navigate]);

  const isOrg = accountType === "business";
  const ngo = isNgo(orgType);
  const nameLabel = isOrg ? (ngo ? "Organization name" : "Business name") : "Your name";
  const namePlaceholder = isOrg ? (ngo ? "Helping Hands Foundation" : "Delta Plumbing Co.") : "Jane Doe";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    if (!fullName.trim()) return toast.error("Please enter your name");
    if (!profession.trim()) return toast.error("Please pick a profession");
    if (accountType === "business" && !orgType) return toast.error("Please pick an organization type");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        location: location.trim(),
        profession: profession.trim(),
        account_type: accountType,
        org_type: accountType === "business" ? orgType : null,
        onboarded: true,
      } as never)
      .eq("id", me);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to HumanLink 👋");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 md:p-8 shadow-pop max-w-xl w-full space-y-5"
      >
        <div className="flex items-center gap-2 text-sm text-primary">
          <Sparkles className="h-4 w-4" /> Let's set up your profile
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">Tell us who you are</h1>
        <p className="text-sm text-muted-foreground">
          Choose the account type that best fits you. NGOs and community groups unlock a green verified badge.
        </p>

        <div>
          <Label>Account type</Label>
          <div className="mt-2">
            <AccountTypeSelector
              accountType={accountType}
              orgType={orgType}
              onAccountTypeChange={setAccountType}
              onOrgTypeChange={setOrgType}
            />
          </div>
        </div>

        <div>
          <Label>{nameLabel}</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={namePlaceholder} />
        </div>
        <div>
          <Label>Location (optional)</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, country" />
        </div>
        <div>
          <Label>{isOrg ? "Category / Speciality *" : "Profession *"}</Label>
          <div className="mt-2">
            <ProfessionPicker value={profession} onChange={setProfession} />
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving || !fullName.trim() || !profession.trim() || (accountType === "business" && !orgType)}
          className="w-full bg-gradient-brand text-primary-foreground border-0 shadow-glow"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue →"}
        </Button>
      </motion.form>
    </div>
  );
}
