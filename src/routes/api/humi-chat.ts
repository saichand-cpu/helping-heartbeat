import { createFileRoute } from "@tanstack/react-router";

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

type Body = { messages: IncomingMessage[] };

const SYSTEM_PROMPT = `You are HUMI, the warm in-app AI companion for HumanLink — a kindness platform where people request and offer help.
- Be concise, friendly, and supportive. Use simple language and short paragraphs.
- When the user shares a resume, medical report, photo, screenshot, or document, read it carefully and offer next steps grounded in what you actually see.
- For resumes: highlight 3-5 matching help opportunities, communities, or skills to share on HumanLink.
- For medical reports: give a plain-English summary, suggest follow-up questions for a doctor, and remind the user you are not a medical professional.
- For requests for help on the platform: suggest categories, urgency, who to reach out to, and how to phrase the request kindly.
- Use markdown (headings, bullets, **bold**). Never invent personal data.`;

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
  // If only a single text part, gateway accepts a plain string too.
  if (parts.length === 1 && parts[0].type === "text") {
    return (parts[0] as { text: string }).text;
  }
  return parts;
}

export const Route = createFileRoute("/api/humi-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = (body.messages ?? []).slice(-20).map((m) => ({
          role: m.role,
          content: toMultimodalContent(m),
        }));

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            stream: true,
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          }),
        });

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          return new Response(text || "Upstream error", { status: res.status || 500 });
        }

        // Transform OpenAI-style SSE to a simple text/event-stream of just delta tokens.
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
          },
        });
      },
    },
  },
});
