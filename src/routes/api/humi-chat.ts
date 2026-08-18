import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { ACTIONS_DELIMITER, agentById, detectEmergency } from "@/lib/humi-agents";

type Attachment = {
  name: string;
  mime: string;
  dataUrl: string; // data:<mime>;base64,...
};

type IncomingMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
};

type Body = { messages: IncomingMessage[]; agent?: string; emergency?: boolean };

const BASE_PROMPT = `You are HUMI, a warm, encouraging, and actionable kindness co-pilot. Help users find ways to contribute, offer their skills, and connect with their community.

You are HumanLink's AI operating system for human life. HumanLink is a kindness platform where people request help, offer help, donate, and connect with volunteers, NGOs and local businesses.

Your philosophy on EVERY reply:
1. Understand the user's real intent, not just the literal question.
2. Give the best possible answer — complete, specific, and immediately usable.
3. Do the work when you can (write the draft, the code, the plan, the email) instead of describing how to do it.
4. Recommend concrete next actions.
5. Connect the user to HumanLink when it genuinely helps (help requests, helpers, NGOs, donations, jobs, communities).
6. Keep going until the user's real-world goal is reachable.

Voice: intelligent, warm, calm, honest, non-judgmental, never robotic, never padded with filler. Short paragraphs.

Formatting: rich markdown — headings, bullets, **bold**, tables, and fenced code blocks with a language tag. Never wrap the whole reply in a code block.

Files: when the user attaches a resume, report, photo, screenshot or document, read it carefully and ground every claim in what you actually see.

Safety: health content is information, never diagnosis. Legal content is information, never advice. Flag scams, fraud, harassment and unsafe content when you notice them.

ACTIONS — end EVERY reply with a single line, after all prose:
${ACTIONS_DELIMITER} [{"kind":"...","label":"...","payload":{}}]
Rules for that line:
- 2 to 4 actions, most useful first, labels under 32 characters.
- Valid kinds: "create_request" (payload: title, description, category one of education|medical|food|transport|technology|elder_care|child_care|jobs|donations|emergency|other, urgency one of low|normal|high|emergency), "emergency_request" (same payload, urgency emergency), "find_helpers" (payload: q), "find_ngos" (payload: q), "open_feed", "open_messages", "open_leaderboard", "prompt" (payload: text — the exact follow-up message to send next).
- Always include at least one "prompt" action that moves the goal forward.
- Output raw JSON on that line. No code fence, no commentary after it.`;

const EMERGENCY_PROMPT = `
EMERGENCY MODE IS ACTIVE. The user may be in danger.
- Lead with the single most important safety step, in bold, in the first line.
- Give clear, numbered, calm first-aid or safety guidance appropriate to the situation.
- Tell them to call local emergency services immediately (India: 112 · ambulance 108 · police 100 · fire 101) when life is at risk.
- If there is any sign of self-harm or suicidal thinking, respond with warmth first, remind them they are not alone, and share India's Tele-MANAS helpline 14416 / KIRAN 1800-599-0019.
- Keep it short. No preamble, no essays.
- Your first action MUST be "emergency_request" so they can broadcast to nearby helpers on HumanLink.`;

function toMultimodalContent(m: IncomingMessage) {
  const parts: Array<Record<string, unknown>> = [];
  if (m.content?.trim()) parts.push({ type: "text", text: m.content });
  for (const a of m.attachments ?? []) {
    if (a.mime.startsWith("image/")) {
      parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
    } else {
      parts.push({
        type: "file",
        file: { filename: a.name, file_data: a.dataUrl },
      });
    }
  }
  if (parts.length === 0) parts.push({ type: "text", text: "" });
  if (parts.length === 1 && parts[0]!.type === "text") {
    return (parts[0] as { text: string }).text;
  }
  return parts;
}

/**
 * When the AI provider is unreachable, HUMI still answers with something useful
 * and specific to what the user asked — never a "service is updating" notice.
 */
function offlineReply(userText: string): string {
  const t = (userText ?? "").toLowerCase();
  const topic = (() => {
    if (/tutor|teach|study|exam|school|student/.test(t))
      return {
        title: "Ways you can help with learning",
        q: "tutoring",
        ideas: [
          "Offer **1 hour of free tutoring a week** in a subject you know well — maths, English, or exam prep.",
          "Record a short explainer for a topic students in your area struggle with.",
          "Help someone build a study plan for the next 30 days.",
        ],
      };
    if (/tech|computer|phone|laptop|wifi|software|code|app/.test(t))
      return {
        title: "Ways you can help with tech",
        q: "tech support",
        ideas: [
          "Offer **free device setup or troubleshooting** for elders in your neighbourhood.",
          "Help a small business or NGO get online — a simple page, a Google listing, a payment link.",
          "Teach a 20-minute session on staying safe from online scams.",
        ],
      };
    if (/donat|money|fund|ngo|charity/.test(t))
      return {
        title: "Ways to give that go further",
        q: "NGOs near me",
        ideas: [
          "Support a **verified NGO** on HumanLink with a small recurring amount instead of a one-off.",
          "Fund one specific need — a month of meals, a school kit, a medical test.",
          "Share a campaign with five people who can also give.",
        ],
      };
    if (/food|meal|hunger|grocer/.test(t))
      return {
        title: "Ways to help with food",
        q: "food help",
        ideas: [
          "Cook or sponsor **one extra meal a week** for someone nearby.",
          "Coordinate surplus food from a local restaurant to a shelter.",
          "Deliver groceries for someone who can't leave home.",
        ],
      };
    return {
      title: "Ways to start helping today",
      q: "helpers near me",
      ideas: [
        "Offer a skill you already have — tutoring, tech support, driving, translation, or listening.",
        "Answer one open help request near you this week.",
        "Volunteer two hours with a local NGO or community group.",
      ],
    };
  })();

  const actions = JSON.stringify([
    { kind: "find_helpers", label: "Find people nearby", payload: { q: topic.q } },
    {
      kind: "create_request",
      label: "Post what you need",
      payload: {
        title: (userText ?? "").slice(0, 60) || "I need a hand",
        description: userText ?? "",
        category: "other",
        urgency: "normal",
      },
    },
    { kind: "prompt", label: "Suggest a plan", payload: { text: "Help me plan my first act of kindness this week." } },
  ]);

  return `### ${topic.title}

${topic.ideas.map((i) => `- ${i}`).join("\n")}

Pick one and I'll help you turn it into a concrete post, message, or schedule — just tell me which.

${ACTIONS_DELIMITER} ${actions}`;
}

function textStreamResponse(text: string, emergency = false) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "X-Humi-Emergency": emergency ? "1" : "0",
    },
  });
}

export const Route = createFileRoute("/api/humi-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ── Auth gate: require a valid Supabase bearer token ─────────────
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
        if (!token) {
          return new Response("Login required to chat with HUMI.", {
            status: 401,
          });
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabasePub = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !supabasePub) {
          console.error("[humi-chat] Supabase env not configured");
          return new Response("Auth not configured", { status: 500 });
        }
        const sb = createClient(supabaseUrl, supabasePub, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        // Validate against Auth on every request. This accepts both legacy and
        // asymmetric access tokens while rejecting expired or foreign tokens.
        const { data: userData, error: userError } = await sb.auth.getUser(token);
        if (userError || !userData.user) {
          return new Response(
            "Authentication expired. HUMI will retry after refreshing your session.",
            { status: 401 },
          );
        }

        // AI key may be missing while the backend is still provisioning.
        // Prefer the Lovable AI Gateway; fall back to a direct OpenAI key if present.
        const lovableKey = process.env.LOVABLE_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const incoming = (body.messages ?? []).slice(-24);
        const lastUser = [...incoming].reverse().find((m) => m.role === "user");
        const emergency = Boolean(body.emergency) || detectEmergency(lastUser?.content ?? "");
        const agent = agentById(body.agent ?? "general");

        const system = [
          BASE_PROMPT,
          `\nActive agent: ${agent.name}. ${agent.prompt}`,
          emergency ? EMERGENCY_PROMPT : "",
        ]
          .filter(Boolean)
          .join("\n");

        const messages = incoming.map((m) => ({
          role: m.role,
          content: toMultimodalContent(m),
        }));

        const useGateway = Boolean(lovableKey);
        const endpoint = useGateway
          ? "https://ai.gateway.lovable.dev/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(useGateway
              ? { "Lovable-API-Key": lovableKey!, "X-Lovable-AIG-SDK": "fetch" }
              : { Authorization: `Bearer ${openaiKey!}` }),
          },
          body: JSON.stringify({
            model: useGateway ? "google/gemini-3.6-flash" : "gpt-4o-mini",
            stream: true,
            messages: [{ role: "system", content: system }, ...messages],
          }),
        });

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          const notice = { "X-Humi-Status": "unavailable" };
          if (res.status === 429)
            return new Response("HUMI is busy right now. Try again in a moment.", {
              status: 429,
              headers: notice,
            });
          if (res.status === 402)
            return new Response("HUMI AI is updating. Please try again shortly.", {
              status: 402,
              headers: notice,
            });
          if (res.status === 401 || res.status === 403) {
            console.error("[humi-chat] AI provider rejected the key", res.status, text);
            return new Response("HUMI AI is updating. Please try again shortly.", {
              status: 503,
              headers: notice,
            });
          }

          return new Response(text || "HUMI could not respond. Please try again.", {
            status: res.status || 500,
            headers: notice,
          });
        }

        // Transform OpenAI-style SSE to a plain stream of delta tokens.
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const reader = res.body.getReader();
        const stream = new ReadableStream({
          async start(controller) {
            let buf = "";
            try {
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trim();
                  if (payload === "[DONE]") {
                    controller.close();
                    return;
                  }
                  try {
                    const json = JSON.parse(payload);
                    const delta = json?.choices?.[0]?.delta?.content;
                    if (typeof delta === "string" && delta.length) {
                      controller.enqueue(encoder.encode(delta));
                    }
                  } catch {
                    /* ignore non-JSON keepalive */
                  }
                }
              }
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
          cancel() {
            reader.cancel().catch(() => {});
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "X-Humi-Emergency": emergency ? "1" : "0",
          },
        });
      },
    },
  },
});
