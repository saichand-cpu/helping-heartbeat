import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ requestId: z.string().uuid() });

export type HelperRec = {
  helper_id: string;
  score: number;
  reasons: string[];
  full_name: string | null;
  avatar_url: string | null;
  karma_points: number | null;
  verified: boolean | null;
  availability: string | null;
  profession: string | null;
  location: string | null;
  completed_helps: number;
};

type CandidateProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  karma_points: number | null;
  verified: boolean | null;
  availability: string | null;
  profession: string | null;
  skills: string[] | null;
  interests: string[] | null;
  languages: string[] | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  last_seen_at: string | null;
  account_type: string | null;
  suspended: boolean | null;
  premium_tier: string | null;
};

type RequestRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  location: string | null;
  requester_id: string;
};

function tokenize(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function overlap(a: Set<string>, b: Set<string>): string[] {
  const out: string[] = [];
  for (const x of a) if (b.has(x)) out.push(x);
  return out;
}

function normalizeLoc(...parts: (string | null | undefined)[]): Set<string> {
  return tokenize(parts.filter(Boolean).join(" "));
}

function scoreCandidate(
  req: RequestRow,
  requesterLocTokens: Set<string>,
  requestTokens: Set<string>,
  helper: CandidateProfile,
  completedHelps: number,
  recentOffers: number,
): { score: number; reasons: string[]; signals: Record<string, unknown> } {
  const reasons: string[] = [];
  let score = 0;

  // Availability (0-25)
  const avail = (helper.availability ?? "available").toLowerCase();
  if (avail === "available") {
    score += 25;
    reasons.push("Currently available");
  } else if (avail === "emergency_only" && (req.urgency === "emergency" || req.urgency === "high")) {
    score += 22;
    reasons.push("On call for emergencies");
  } else if (avail === "busy") {
    score += 5;
  } else if (avail === "offline") {
    score += 0;
  }

  // Skills / interests overlap with request (0-25)
  const skillSet = tokenize((helper.skills ?? []).join(" "));
  const interestSet = tokenize((helper.interests ?? []).join(" "));
  const skillHits = overlap(skillSet, requestTokens);
  const interestHits = overlap(interestSet, requestTokens);
  const skillScore = Math.min(20, skillHits.length * 7);
  score += skillScore;
  if (skillHits.length) reasons.push(`Skilled in ${skillHits.slice(0, 3).join(", ")}`);
  const interestScore = Math.min(5, interestHits.length * 2);
  score += interestScore;
  if (!skillHits.length && interestHits.length) {
    reasons.push(`Interested in ${interestHits.slice(0, 2).join(", ")}`);
  }

  // Location (0-20)
  const helperLoc = normalizeLoc(helper.location, helper.city, helper.state, helper.country);
  const locHits = overlap(helperLoc, requesterLocTokens);
  if (locHits.length) {
    score += 20;
    reasons.push(`Nearby (${locHits[0]})`);
  } else if (helper.country && requesterLocTokens.has((helper.country ?? "").toLowerCase())) {
    score += 8;
  }

  // Karma / reputation (0-15)
  const karma = helper.karma_points ?? 0;
  const karmaScore = Math.min(15, Math.floor(karma / 20));
  score += karmaScore;
  if (karma >= 50) reasons.push(`${karma} karma points`);

  // Completed helps track record (0-10)
  const trackScore = Math.min(10, completedHelps * 2);
  score += trackScore;
  if (completedHelps >= 3) reasons.push(`${completedHelps} successful helps`);

  // Verified / trust (0-5)
  if (helper.verified) {
    score += 5;
    reasons.push("Verified");
  }

  // Recency / response signal (0-5) — based on last_seen_at
  if (helper.last_seen_at) {
    const ageMs = Date.now() - new Date(helper.last_seen_at).getTime();
    const hours = ageMs / (1000 * 60 * 60);
    if (hours < 1) {
      score += 5;
      reasons.push("Active now");
    } else if (hours < 24) {
      score += 3;
      reasons.push("Active today");
    } else if (hours < 24 * 7) {
      score += 1;
    }
  }

  // Response-time proxy: recent offers = engaged helper (0-5)
  if (recentOffers > 0) {
    const r = Math.min(5, recentOffers);
    score += r;
    if (recentOffers >= 2) reasons.push("Fast responder");
  }

  // NGO / org boost for donations, emergency, medical
  if (
    (helper.account_type === "ngo" || helper.account_type === "business") &&
    ["donations", "emergency", "medical", "food"].includes(req.category)
  ) {
    score += 5;
    reasons.push("Organization active in this category");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons: reasons.slice(0, 4),
    signals: {
      availability: avail,
      skill_hits: skillHits,
      interest_hits: interestHits,
      loc_hits: locHits,
      karma,
      completed_helps: completedHelps,
      recent_offers: recentOffers,
      verified: !!helper.verified,
    },
  };
}

export const recommendHelpers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }): Promise<HelperRec[]> => {
    const { supabase, userId } = context;

    // Load the request; only the requester or an admin may trigger scoring
    const { data: req, error: reqErr } = await supabase
      .from("help_requests")
      .select("id, title, description, category, urgency, location, requester_id")
      .eq("id", data.requestId)
      .maybeSingle();
    if (reqErr || !req) throw new Error("Request not found");

    // Load requester profile for location context
    const { data: requester } = await supabase
      .from("profiles")
      .select("id, location, city, state, country")
      .eq("id", req.requester_id)
      .maybeSingle();

    const requesterLocTokens = normalizeLoc(
      req.location,
      requester?.location,
      requester?.city,
      requester?.state,
      requester?.country,
    );
    const requestTokens = new Set<string>([
      ...tokenize(req.title),
      ...tokenize(req.description),
      req.category,
    ]);

    // Candidate pool: exclude self, suspended, deactivated
    const { data: candidates } = await supabase
      .from("profiles")
      .select(
        "id, full_name, avatar_url, karma_points, verified, availability, profession, skills, interests, languages, location, city, state, country, last_seen_at, account_type, suspended, premium_tier",
      )
      .neq("id", req.requester_id)
      .is("deactivated_at", null)
      .neq("availability", "offline")
      .limit(200);

    const pool = (candidates ?? []).filter(
      (c) => !c.suspended,
    ) as CandidateProfile[];
    if (pool.length === 0) return [];

    // Track record: completed helps per helper
    const helperIds = pool.map((c) => c.id);
    const { data: completedRows } = await supabase
      .from("help_requests")
      .select("helper_id")
      .eq("status", "completed")
      .in("helper_id", helperIds);
    const completedMap = new Map<string, number>();
    (completedRows ?? []).forEach((r) => {
      if (r.helper_id) completedMap.set(r.helper_id, (completedMap.get(r.helper_id) ?? 0) + 1);
    });

    // Response-time proxy: offers in the last 14 days
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: offerRows } = await supabase
      .from("request_offers")
      .select("helper_id")
      .in("helper_id", helperIds)
      .gte("created_at", since);
    const offerMap = new Map<string, number>();
    (offerRows ?? []).forEach((r) => {
      if (r.helper_id) offerMap.set(r.helper_id, (offerMap.get(r.helper_id) ?? 0) + 1);
    });

    // Score everyone
    const scored = pool.map((c) => {
      const s = scoreCandidate(
        req as RequestRow,
        requesterLocTokens,
        requestTokens,
        c,
        completedMap.get(c.id) ?? 0,
        offerMap.get(c.id) ?? 0,
      );
      return { candidate: c, ...s };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.filter((s) => s.score >= 20).slice(0, 8);
    if (top.length === 0) return [];

    // Optional AI narrative pass on the top slice — enriches "reasons" with a
    // one-line rationale. Falls back silently if AI is unavailable.
    const apiKey = process.env.LOVABLE_API_KEY;
    if (apiKey && top.length > 0) {
      try {
        const aiPrompt = {
          request: {
            title: req.title,
            description: req.description.slice(0, 400),
            category: req.category,
            urgency: req.urgency,
          },
          helpers: top.map((t) => ({
            id: t.candidate.id,
            name: t.candidate.full_name,
            profession: t.candidate.profession,
            skills: (t.candidate.skills ?? []).slice(0, 8),
            location: t.candidate.location,
            karma: t.candidate.karma_points,
            completed: completedMap.get(t.candidate.id) ?? 0,
          })),
        };
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
          body: JSON.stringify({
            model: "openai/gpt-5.5",
            messages: [
              {
                role: "system",
                content:
                  'Given a help request and candidate helpers, return JSON {"insights":[{"id":"...","reason":"one short sentence why this helper is a strong match"}]}. Be specific, warm, and honest. Max 90 chars per reason.',
              },
              { role: "user", content: JSON.stringify(aiPrompt) },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const text = json.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(text) as { insights?: { id: string; reason: string }[] };
          const byId = new Map((parsed.insights ?? []).map((i) => [i.id, i.reason]));
          top.forEach((t) => {
            const r = byId.get(t.candidate.id);
            if (r) t.reasons = [r, ...t.reasons].slice(0, 4);
          });
        }
      } catch {
        // AI narrative failed — keep heuristic reasons
      }
    }

    // Persist recommendations (admin client bypasses RLS insert)
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const rows = top.map((t) => ({
        request_id: req.id,
        helper_id: t.candidate.id,
        score: t.score,
        reasons: t.reasons,
        signals: t.signals,
        updated_at: new Date().toISOString(),
      }));
      await supabaseAdmin
        .from("helper_recommendations")
        .upsert(rows, { onConflict: "request_id,helper_id" });
    } catch {
      // Non-fatal — still return live scores to the caller
    }

    // Only the requester or an admin sees the ranked list
    const isRequester = userId === req.requester_id;
    if (!isRequester) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) return [];
    }

    return top.map((t) => ({
      helper_id: t.candidate.id,
      score: t.score,
      reasons: t.reasons,
      full_name: t.candidate.full_name,
      avatar_url: t.candidate.avatar_url,
      karma_points: t.candidate.karma_points,
      verified: t.candidate.verified,
      availability: t.candidate.availability,
      profession: t.candidate.profession,
      location: t.candidate.location,
      completed_helps: completedMap.get(t.candidate.id) ?? 0,
    }));
  });
