import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HumiMetrics = {
  today: {
    newUsers: number;
    newRequests: number;
    completed: number;
    newPosts: number;
    adImpressions: number;
    adClicks: number;
  };
  last7d: {
    newUsers: number;
    newRequests: number;
    completed: number;
    newPosts: number;
    adImpressions: number;
    adClicks: number;
  };
  totals: {
    users: number;
    requests: number;
    openRequests: number;
    activeAds: number;
  };
  briefing: string;
  highlights: string[];
  generatedAt: string;
};

const since = (days: number) =>
  new Date(Date.now() - days * 86400000).toISOString();

export const getHumiBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HumiMetrics> => {
    const { supabase, userId } = context;

    // Admin gate
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const day1 = since(1);
    const day7 = since(7);

    const head = { count: "exact" as const, head: true };
    const c = async (q: any) => (await q).count ?? 0;

    const [
      usersTotal,
      requestsTotal,
      openRequests,
      activeAds,
      newUsers1,
      newUsers7,
      newReq1,
      newReq7,
      done1,
      done7,
      newPosts1,
      newPosts7,
    ] = await Promise.all([
      c(supabase.from("profiles").select("*", head)),
      c(supabase.from("help_requests").select("*", head)),
      c(supabase.from("help_requests").select("*", head).eq("status", "open")),
      c(supabase.from("advertisements").select("*", head).eq("active", true)),
      c(supabase.from("profiles").select("*", head).gte("created_at", day1)),
      c(supabase.from("profiles").select("*", head).gte("created_at", day7)),
      c(supabase.from("help_requests").select("*", head).gte("created_at", day1)),
      c(supabase.from("help_requests").select("*", head).gte("created_at", day7)),
      c(supabase.from("help_requests").select("*", head).eq("status", "completed").gte("updated_at", day1)),
      c(supabase.from("help_requests").select("*", head).eq("status", "completed").gte("updated_at", day7)),
      c(supabase.from("posts").select("*", head).gte("created_at", day1)),
      c(supabase.from("posts").select("*", head).gte("created_at", day7)),
    ]);

    // Ad events (admin-only readable)
    const { data: events } = await supabase
      .from("ad_events")
      .select("event_type, created_at")
      .gte("created_at", day7);
    let imp1 = 0, imp7 = 0, clk1 = 0, clk7 = 0;
    const cutoff1 = Date.now() - 86400000;
    for (const e of events ?? []) {
      const recent1 = new Date(e.created_at).getTime() >= cutoff1;
      if (e.event_type === "impression") { imp7++; if (recent1) imp1++; }
      else if (e.event_type === "click") { clk7++; if (recent1) clk1++; }
    }

    const metrics = {
      today: { newUsers: newUsers1, newRequests: newReq1, completed: done1, newPosts: newPosts1, adImpressions: imp1, adClicks: clk1 },
      last7d: { newUsers: newUsers7, newRequests: newReq7, completed: done7, newPosts: newPosts7, adImpressions: imp7, adClicks: clk7 },
      totals: { users: usersTotal, requests: requestsTotal, openRequests, activeAds },
    };

    // HUMI AI briefing
    let briefing = "";
    let highlights: string[] = [];
    const apiKey = process.env.LOVABLE_API_KEY;
    if (apiKey) {
      try {
        const system = `You are HUMI, HumanLink's calm, warm AI analyst briefing an admin.
Given platform metrics JSON, return STRICT JSON: {
  "briefing": "2-3 short sentences, conversational, mention notable today-vs-7d momentum and one suggested focus area",
  "highlights": ["3-5 short bullet insights, each under 90 chars, no emojis"]
}
No markdown. No preface.`;
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: system },
              { role: "user", content: JSON.stringify(metrics) },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const text = json.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(text);
          briefing = String(parsed.briefing ?? "");
          highlights = Array.isArray(parsed.highlights) ? parsed.highlights.map(String).slice(0, 5) : [];
        }
      } catch {
        // fall through to fallback
      }
    }
    if (!briefing) {
      briefing = `Today: ${metrics.today.newUsers} new members, ${metrics.today.newRequests} requests, ${metrics.today.completed} completions. Past 7 days are running at ${metrics.last7d.newRequests} requests and ${metrics.last7d.completed} completions — keep an eye on open requests (${metrics.totals.openRequests}).`;
      highlights = [
        `${metrics.today.newUsers} new members today vs ${metrics.last7d.newUsers} in 7d`,
        `${metrics.today.newRequests} new requests today vs ${metrics.last7d.newRequests} in 7d`,
        `${metrics.today.completed} completions today vs ${metrics.last7d.completed} in 7d`,
        `${metrics.today.adImpressions} ad impressions / ${metrics.today.adClicks} clicks today`,
      ];
    }

    return { ...metrics, briefing, highlights, generatedAt: new Date().toISOString() };
  });
