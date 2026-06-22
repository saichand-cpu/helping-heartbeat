import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ description: z.string().min(5).max(2000) });

type Improved = {
  title: string;
  description: string;
  category: string;
  urgency: string;
};

export const improveRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<Improved> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const system = `You are HumanLink's writing assistant. Given a help request draft, return a concise JSON object with:
- title (max 80 chars, action-oriented)
- description (3-5 sentences, warm, clear, no PII)
- category: one of education, medical, food, transport, technology, elder_care, child_care, jobs, donations, emergency, other
- urgency: one of low, normal, high, emergency
Respond ONLY with valid JSON. No markdown.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.description },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits.");
    if (res.status === 429) throw new Error("Rate limited. Try again in a moment.");
    if (!res.ok) throw new Error("AI request failed");

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Partial<Improved> = {};
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    return {
      title: parsed.title ?? "",
      description: parsed.description ?? data.description,
      category: parsed.category ?? "other",
      urgency: parsed.urgency ?? "normal",
    };
  });
