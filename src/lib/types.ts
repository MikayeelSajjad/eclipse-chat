import type { NitroTier } from "./nitro";

export type UserId = string;

export interface User {
  id: UserId;
  username: string;
  avatar_url: string | null;
  public_key?: string | null;
  nitro_tier?: NitroTier;
  role?: "member" | "admin";
}

export interface SessionUser extends User {
  nitro_tier: NitroTier;
  friend_count: number;
  friend_limit: number;
  can_create_groups: boolean;
}

export interface Message {
  id: string;
  sender_id: UserId;
  receiver_id: UserId;
  content: string;
  created_at: number;
  group_id?: string | null;
}

export interface ConversationSummary {
  peerId: UserId;
  peer: User;
  lastMessage: Message | null;
  lastMessageAt: number;
}

export interface GroupSummary {
  id: string;
  name: string;
  creator_id: string;
  created_at: number;
  members: User[];
  lastMessage: Message | null;
  lastMessageAt: number;
}

export interface FriendRequestItem {
  id: string;
  user: User;
}

export interface FriendsPayload {
  accepted: User[];
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
}

export interface SearchUser extends User {
  friendshipStatus: "pending" | "accepted" | null;
  friendshipId: string | null;
  isIncoming: boolean;
}

export type MobileTab = "chats" | "friends" | "groups" | "profile";

export type ActiveChat =
  | { kind: "dm"; id: string }
  | { kind: "group"; id: string }
  | null;
