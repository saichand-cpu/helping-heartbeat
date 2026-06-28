import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreditCard, Smartphone, ShieldCheck, Loader2, CheckCircle2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/use-role";

type Plan = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
};

export function MockPaymentModal({
  plan,
  open,
  onOpenChange,
  onSuccess,
}: {
  plan: Plan | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}) {
  const [stage, setStage] = useState<"form" | "processing" | "done">("form");
  const [card, setCard] = useState({ number: "4242 4242 4242 4242", name: "", exp: "12/29", cvc: "123" });
  const [upi, setUpi] = useState("you@upi");
  const { isAdmin } = useIsAdmin();

  const reset = () => setStage("form");

  const confirm = async () => {
    if (!plan) return;
    setStage("processing");
    await new Promise((r) => setTimeout(r, 2000));

    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("Please sign in first");
      setStage("form");
      return;
    }

    const tier = plan.name.toLowerCase().includes("pro")
      ? "pro"
      : plan.name.toLowerCase().includes("plus")
        ? "plus"
        : "basic";

    const until = new Date();
    until.setMonth(until.getMonth() + 1);

    const { error } = await supabase
      .from("profiles")
      .update({
        verified: true,
        premium_tier: tier,
        premium_until: until.toISOString(),
      })
      .eq("id", u.user.id);

    if (error) {
      toast.error(error.message);
      setStage("form");
      return;
    }

    setStage("done");
    setTimeout(() => {
      onOpenChange(false);
      reset();
      onSuccess?.();
    }, 1600);
  };

  if (!plan) return null;
  const amount = `${plan.currency === "INR" ? "₹" : "$"}${(plan.price_cents / 100).toLocaleString()}`;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Premium header */}
        <div className="relative bg-gradient-brand text-primary-foreground p-6">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
          <DialogHeader className="relative">
            <DialogTitle className="text-primary-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Secure checkout
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              {plan.name} · {amount}/month
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          {stage === "form" && isAdmin && (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <div className="h-14 w-14 rounded-full bg-amber-400/15 flex items-center justify-center">
                <Crown className="h-7 w-7 text-amber-500" />
              </div>
              <div className="font-bold text-lg">God-mode active</div>
              <p className="text-sm text-muted-foreground max-w-xs">
                As an administrator you already have permanent Pro access — every paywall, ad-credit limit, and tier gate is bypassed. No charge needed.
              </p>
              <Button onClick={() => onOpenChange(false)} variant="outline" className="mt-2">Close</Button>
            </div>
          )}
          {stage === "form" && !isAdmin && (
            <Tabs defaultValue="card">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="card"><CreditCard className="h-4 w-4 mr-1" />Card</TabsTrigger>
                <TabsTrigger value="upi"><Smartphone className="h-4 w-4 mr-1" />UPI</TabsTrigger>
              </TabsList>
              <TabsContent value="card" className="space-y-3 mt-4">
                <div>
                  <Label className="text-xs">Card number</Label>
                  <Input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Name on card</Label>
                  <Input placeholder="Full name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Expiry</Label>
                    <Input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">CVC</Label>
                    <Input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="upi" className="space-y-3 mt-4">
                <div>
                  <Label className="text-xs">UPI ID</Label>
                  <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" />
                </div>
                <p className="text-xs text-muted-foreground">A payment request will be sent to your UPI app.</p>
              </TabsContent>
              <Button onClick={confirm} className="w-full mt-5 bg-gradient-brand text-primary-foreground border-0 shadow-glow">
                Pay {amount}
              </Button>
              <p className="mt-3 text-[11px] text-muted-foreground text-center">
                This is a demo gateway — no real charge will be made.
              </p>
            </Tabs>
          )}

          {stage === "processing" && (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="font-medium">Processing payment...</div>
              <div className="text-xs text-muted-foreground">Securely verifying with your bank</div>
            </div>
          )}

          {stage === "done" && (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <div className="h-16 w-16 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </div>
              <div className="font-bold text-lg">Welcome to {plan.name}!</div>
              <div className="text-sm text-muted-foreground">Your verified badge is now active across HumanLink.</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
