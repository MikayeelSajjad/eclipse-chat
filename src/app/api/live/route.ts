import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prepareDb } from "@/lib/api-route";
import { findUserById, rowToPublicUser } from "@/lib/db";
import { getUserGroups } from "@/lib/db/groups";
import {
  getConversationSummaries,
  getGroupMessagesSince,
  getIncomingGroupMessagesSince,
  getIncomingMessagesSince,
  getMessagesSince,
} from "@/lib/db/messages";
import { getTypingFromPeer } from "@/lib/db/typing";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const dbError = await prepareDb();
  if (dbError) return dbError;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const since = Number(searchParams.get("since") ?? "0");
  const peerId = searchParams.get("peerId") ?? "";
  const groupId = searchParams.get("groupId") ?? "";
  const safeSince = Number.isFinite(since) ? since : 0;

  const conversations = await getConversationSummaries(userId);
  const groups = await getUserGroups(userId);

  let newMessages: Awaited<ReturnType<typeof getMessagesSince>> = [];
  let peerTyping = false;

  if (groupId) {
    newMessages = await getGroupMessagesSince(groupId, safeSince);
  } else if (peerId) {
    newMessages = await getMessagesSince(userId, peerId, safeSince);
    peerTyping = await getTypingFromPeer(userId, peerId);
  }

  const incoming = await getIncomingMessagesSince(userId, safeSince);
  const inbox = await Promise.all(
    incoming.map(async (msg) => {
      const peer = await findUserById(msg.sender_id);
      if (!peer) return null;
      return { message: msg, peer: rowToPublicUser(peer) };
    })
  );

  const incomingGroups = await getIncomingGroupMessagesSince(userId, safeSince);
  const groupNameById = new Map(groups.map((g) => [g.id, g.name]));
  const groupInbox = incomingGroups.map((msg) => ({
    message: msg,
    groupId: msg.group_id ?? msg.receiver_id,
    groupName: groupNameById.get(msg.group_id ?? msg.receiver_id) ?? "Group",
  }));

  return NextResponse.json({
    serverTime: Date.now(),
    conversations,
    groups,
    newMessages,
    peerTyping,
    inbox: inbox.filter((x): x is NonNullable<typeof x> => Boolean(x)),
    groupInbox,
  });
}
