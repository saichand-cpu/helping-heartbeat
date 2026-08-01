import { supabase } from "@/integrations/supabase/client";
import type { HumiAction } from "./humi-agents";

export type HumiAttachment = { name: string; mime: string; dataUrl: string };

export type HumiThread = {
  id: string;
  title: string;
  agent: string;
  emergency: boolean;
  updated_at: string;
};

export type HumiDbMessage = {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments: HumiAttachment[];
  actions: HumiAction[];
  created_at: string;
};

const table = (name: string) => supabase.from(name as never);

export async function listThreads(): Promise<HumiThread[]> {
  const { data, error } = await table("humi_threads")
    .select("id, title, agent, emergency, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as HumiThread[];
}

export async function createThread(agent = "general"): Promise<HumiThread> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { data, error } = await table("humi_threads")
    .insert({ user_id: u.user.id, agent } as never)
    .select("id, title, agent, emergency, updated_at")
    .single();
  if (error) throw error;
  return data as unknown as HumiThread;
}

export async function updateThread(
  id: string,
  patch: Partial<Pick<HumiThread, "title" | "agent" | "emergency">>,
): Promise<void> {
  const { error } = await table("humi_threads").update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function deleteThread(id: string): Promise<void> {
  const { error } = await table("humi_threads").delete().eq("id", id);
  if (error) throw error;
}

export async function listMessages(threadId: string): Promise<HumiDbMessage[]> {
  const { data, error } = await table("humi_messages")
    .select("id, thread_id, role, content, attachments, actions, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as HumiDbMessage[];
}

export async function saveMessage(input: {
  threadId: string;
  role: "user" | "assistant";
  content: string;
  attachments?: HumiAttachment[];
  actions?: HumiAction[];
}): Promise<HumiDbMessage> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { data, error } = await table("humi_messages")
    .insert({
      thread_id: input.threadId,
      user_id: u.user.id,
      role: input.role,
      content: input.content,
      attachments: input.attachments ?? [],
      actions: input.actions ?? [],
    } as never)
    .select("id, thread_id, role, content, attachments, actions, created_at")
    .single();
  if (error) throw error;
  return data as unknown as HumiDbMessage;
}

export function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New conversation";
  return clean.length > 58 ? `${clean.slice(0, 58)}…` : clean;
}
