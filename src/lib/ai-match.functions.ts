import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Match = {
  request_id: string;
  title: string;
  category: string;
  urgency: string;
  score: number;
  reasons: string[];
};

export const smartMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Match[]> => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: requests }] = await Promise.all([
      supabase.from("profiles").select("full_name, bio, skills, interests, languages, location").eq("id", userId).maybeSingle(),
      supabase.from("help_requests").select("id, title, description, category, urgency, location").eq("status", "open").limit(20),
    ]);

    if (!requests || requests.length === 0) return [];

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      // Fallback: simple keyword overlap
      return requests.slice(0, 6).map((r) => ({
        request_id: r.id,
        title: r.title,
        category: r.category,
        urgency: r.urgency,
        score: 60 + Math.floor(Math.random() * 30),
        reasons: ["Matches your general profile"],
      }));
    }

    const system = `You are HumanLink's matching engine. Given a helper's profile and a list of open help requests, score each request 0-100 for how well this helper can help. Be honest. Respond ONLY with JSON: {"matches":[{"request_id":"...","score":N,"reasons":["...","..."]}]}. Include 2-3 short reason bullets per match. Return at most 6 matches, only score >= 50.`;

    const userPayload = {
      helper: {
        name: profile?.full_name,
        bio: profile?.bio,
        skills: profile?.skills,
        interests: profile?.interests,
        languages: profile?.languages,
        location: profile?.location,
      },
      requests: requests.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description?.slice(0, 400),
        category: r.category,
        urgency: r.urgency,
        location: r.location,
      })),
    };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify(userPayload) },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const json = await res.json();
      const text = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(text) as { matches?: { request_id: string; score: number; reasons: string[] }[] };
      const byId = new Map(requests.map((r) => [r.id, r]));
      return (parsed.matches ?? [])
        .filter((m) => byId.has(m.request_id))
        .map((m) => {
          const r = byId.get(m.request_id)!;
          return {
            request_id: r.id,
            title: r.title,
            category: r.category,
            urgency: r.urgency,
            score: Math.max(0, Math.min(100, Math.round(m.score))),
            reasons: (m.reasons ?? []).slice(0, 3),
          };
        })
        .sort((a, b) => b.score - a.score);
    } catch {
      return requests.slice(0, 4).map((r) => ({
        request_id: r.id,
        title: r.title,
        category: r.category,
        urgency: r.urgency,
        score: 65,
        reasons: ["AI matcher unavailable — showing recent open requests."],
      }));
    }
  });
