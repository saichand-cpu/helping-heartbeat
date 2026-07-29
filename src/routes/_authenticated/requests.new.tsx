import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { improveRequest } from "@/lib/ai.functions";
import { recommendHelpers } from "@/lib/helper-match.functions";

export const Route = createFileRoute("/_authenticated/requests/new")({
  component: NewRequest,
});

const categories = ["education","medical","food","transport","technology","elder_care","child_care","jobs","donations","emergency","other"];
const urgencies = ["low","normal","high","emergency"];

function NewRequest() {
  const navigate = useNavigate();
  const aiImprove = useServerFn(improveRequest);
  const runMatch = useServerFn(recommendHelpers);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [urgency, setUrgency] = useState("normal");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { data: inserted, error } = await supabase.from("help_requests").insert({
      requester_id: u.user.id, title, description, location,
      category: category as never, urgency: urgency as never,
    }).select("id").single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Request posted!");
    // Fire-and-forget: pre-warm AI helper recommendations so they're ready when the requester opens the detail page.
    if (inserted?.id) {
      void runMatch({ data: { requestId: inserted.id } }).catch(() => {});
      navigate({ to: "/requests/$requestId", params: { requestId: inserted.id } });
    } else {
      navigate({ to: "/requests" });
    }
  };

  const handleAI = async () => {
    if (!description.trim()) return toast.error("Add a description first");
    setAiLoading(true);
    try {
      const out = await aiImprove({ data: { description } });
      if (out.title) setTitle(out.title);
      if (out.description) setDescription(out.description);
      if (out.category && categories.includes(out.category)) setCategory(out.category);
      if (out.urgency && urgencies.includes(out.urgency)) setUrgency(out.urgency);
      toast.success("AI improved your request");
    } catch (e) {
      toast.error("AI is busy, please try again");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-6">
      <Link to="/requests" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to requests
      </Link>
      <div className="rounded-3xl bg-card border border-border p-6 md:p-8 shadow-soft">
        <h1 className="text-3xl font-bold">Ask for <span className="text-primary">help</span></h1>
        <p className="text-sm text-muted-foreground mt-1">Tell the community what you need. The clearer your story, the faster help arrives.</p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Need a ride to the hospital tomorrow" required />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="desc">Description</Label>
              <Button type="button" size="sm" variant="outline" onClick={handleAI} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1 text-primary" />}
                Improve with AI
              </Button>
            </div>
            <Textarea id="desc" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} required
              placeholder="Describe what you need, when, and any helpful context." />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{urgencies.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="loc">Location</Label>
              <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or neighborhood" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post request"}
          </Button>
        </form>
      </div>
    </div>
  );
}
