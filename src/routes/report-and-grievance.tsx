import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GRIEVANCE_CATEGORIES } from "@/lib/legal";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/report-and-grievance")({
  head: () => ({
    meta: [
      { title: "Report & Grievance — HumanLink" },
      {
        name: "description",
        content:
          "Raise a safety, privacy, payment, content or account complaint with the HumanLink team and track it with a ticket ID.",
      },
      { property: "og:title", content: "Report & Grievance — HumanLink" },
      {
        property: "og:description",
        content: "File a complaint with HumanLink and receive a trackable ticket ID.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GrievancePage,
});

function GrievancePage() {
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);

  const submit = async () => {
    if (!user) return toast.error("Please sign in to file a grievance.");
    if (!category) return toast.error("Please choose a category.");
    if (subject.trim().length < 4) return toast.error("Please add a short subject.");
    if (description.trim().length < 20)
      return toast.error("Please describe the issue in at least 20 characters.");

    setBusy(true);
    const { data, error } = await supabase
      .from("grievances")
      .insert({
        user_id: user.id,
        category,
        subject: subject.trim().slice(0, 160),
        description: description.trim().slice(0, 4000),
        contact_email: email.trim().slice(0, 255) || user.email || null,
      })
      .select("ref_code")
      .single();
    setBusy(false);

    if (error) {
      toast.error(error.message || "Could not submit your grievance.");
      return;
    }
    setTicket(data?.ref_code ?? null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Report &amp; Grievance</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Use this form for safety, privacy, payment, content, account or any other complaint. You'll
          receive a ticket ID and our team will review it.
        </p>

        {ticket ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Grievance received</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep this ticket ID for follow-up.
            </p>
            <div className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 font-mono text-sm">
              {ticket}
            </div>
          </div>
        ) : (
          <div className="mt-10 space-y-5 rounded-2xl border border-border bg-card p-8">
            <div className="space-y-2">
              <Label htmlFor="g-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="g-category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {GRIEVANCE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-subject">Subject</Label>
              <Input
                id="g-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="A short summary of the issue"
                maxLength={160}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-desc">What happened?</Label>
              <Textarea
                id="g-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={7}
                maxLength={4000}
                placeholder="Include dates, usernames, request or payment references, and anything else that helps us investigate."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-email">Contact email (optional)</Label>
              <Input
                id="g-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={user?.email ?? "you@example.com"}
                maxLength={255}
              />
            </div>

            <Button onClick={submit} disabled={busy} className="w-full">
              {busy ? "Submitting…" : "Submit grievance"}
            </Button>
            {!user && (
              <p className="text-xs text-muted-foreground text-center">
                You need to be signed in to file a grievance.
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
