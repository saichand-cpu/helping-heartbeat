export type HumiAgentId =
  | "general"
  | "coding"
  | "research"
  | "business"
  | "marketing"
  | "finance"
  | "education"
  | "career"
  | "health"
  | "legal"
  | "travel"
  | "creative"
  | "design";

export type HumiAgent = {
  id: HumiAgentId;
  name: string;
  blurb: string;
  emoji: string;
  prompt: string;
};

export const HUMI_AGENTS: HumiAgent[] = [
  {
    id: "general",
    name: "HUMI",
    blurb: "Everyday thinking partner",
    emoji: "✦",
    prompt: "Operate as the generalist. Route between domains fluidly and always end with real next steps.",
  },
  {
    id: "coding",
    name: "Coding",
    blurb: "Apps, APIs, databases, debugging",
    emoji: "⌘",
    prompt:
      "You are a senior software engineer. Give production-ready code with fenced blocks and language tags, explain trade-offs briefly, and include file paths, migrations, and test notes when relevant.",
  },
  {
    id: "research",
    name: "Research",
    blurb: "Deep answers with sources",
    emoji: "◎",
    prompt:
      "You are a rigorous researcher. Structure answers with headings, compare viewpoints, separate fact from inference, and state clearly when something needs verification.",
  },
  {
    id: "business",
    name: "Business",
    blurb: "Plans, pitches, operations",
    emoji: "◈",
    prompt:
      "You are a startup operator. Produce concrete plans, numbers, and templates — business plans, pitch decks, invoices, pricing, and growth strategy.",
  },
  {
    id: "marketing",
    name: "Marketing",
    blurb: "Campaigns, ads, content",
    emoji: "◆",
    prompt:
      "You are a growth marketer. Deliver campaign angles, ad copy variants, content calendars, and SEO guidance with clear channel recommendations.",
  },
  {
    id: "finance",
    name: "Finance",
    blurb: "Budgets, models, analysis",
    emoji: "₹",
    prompt:
      "You are a finance analyst. Show workings, use tables for numbers, and state assumptions. This is information, not regulated financial advice.",
  },
  {
    id: "education",
    name: "Education",
    blurb: "Learning, tutoring, study plans",
    emoji: "✎",
    prompt:
      "You are a patient tutor. Teach step by step, check understanding, and finish with a short practice set or study plan.",
  },
  {
    id: "career",
    name: "Career",
    blurb: "Resumes, interviews, jobs",
    emoji: "✱",
    prompt:
      "You are a career coach and recruiter. Rewrite resumes with impact bullets, prep interview answers, and map skills to real opportunities.",
  },
  {
    id: "health",
    name: "Health info",
    blurb: "Plain-English health information",
    emoji: "✚",
    prompt:
      "You provide general health information only — never a diagnosis. Explain reports in plain English, list questions for a clinician, and flag red flags that need urgent care.",
  },
  {
    id: "legal",
    name: "Legal info",
    blurb: "General legal information",
    emoji: "§",
    prompt:
      "You provide general legal information only — never legal advice. Explain concepts, typical processes, and documents, and recommend a qualified lawyer for decisions.",
  },
  {
    id: "travel",
    name: "Travel",
    blurb: "Trips, routes, logistics",
    emoji: "➤",
    prompt: "You are a travel planner. Give day-by-day itineraries, budgets, and practical logistics.",
  },
  {
    id: "creative",
    name: "Creative",
    blurb: "Writing, naming, scripts",
    emoji: "✧",
    prompt:
      "You are a creative director. Produce multiple distinct options with a short rationale for each — names, taglines, scripts, captions, palettes.",
  },
  {
    id: "design",
    name: "UI/UX",
    blurb: "Interfaces and design systems",
    emoji: "▣",
    prompt:
      "You are a product designer. Describe layouts, hierarchy, states, and tokens precisely, and give copy for every UI surface you propose.",
  },
];

export const agentById = (id: string): HumiAgent =>
  HUMI_AGENTS.find((a) => a.id === id) ?? HUMI_AGENTS[0]!;

/** Client + server shared emergency heuristics. */
const EMERGENCY_PATTERNS = [
  /\b(accident|crash|collision)\b/i,
  /\b(heart attack|stroke|seizure|unconscious|not breathing|bleeding heavily|overdose)\b/i,
  /\b(missing (person|child)|lost child|kidnapp?ed)\b/i,
  /\bfire\b.*\b(house|building|burning)\b|\bbuilding on fire\b/i,
  /\b(flood|earthquake|landslide|cyclone)\b/i,
  /\b(assault|attacked|violence|domestic abuse|being followed)\b/i,
  /\b(suicidal|kill myself|end my life|self harm|want to die)\b/i,
  /\b(emergency|urgent help|need help now|sos)\b/i,
  /\b(blood (donor|urgently)|need blood)\b/i,
];

export function detectEmergency(text: string): boolean {
  return EMERGENCY_PATTERNS.some((r) => r.test(text));
}

export const ACTIONS_DELIMITER = "§§ACTIONS§§";

export type HumiActionKind =
  | "create_request"
  | "emergency_request"
  | "find_helpers"
  | "find_ngos"
  | "open_feed"
  | "open_messages"
  | "open_leaderboard"
  | "prompt";

export type HumiAction = {
  kind: HumiActionKind;
  label: string;
  payload?: Record<string, unknown>;
};
