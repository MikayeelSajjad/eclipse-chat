import type { ConversationSummary, Message, User } from "./types";

export interface LiveSyncPayload {
  serverTime: number;
  conversations: ConversationSummary[];
  newMessages: Message[];
  peerTyping: boolean;
  inbox: { message: Message; peer: User }[];
}

export function mergeMessages(prev: Message[], incoming: Message[]): Message[] {
  if (incoming.length === 0) return prev;
  const byId = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return Array.from(byId.values()).sort((a, b) => a.created_at - b.created_at);
}
