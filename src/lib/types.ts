export type UserId = string;

export interface User {
  id: UserId;
  username: string;
  avatar_url: string | null;
}

export interface Message {
  id: string;
  sender_id: UserId;
  receiver_id: UserId;
  content: string;
  created_at: number;
}

export interface ConversationSummary {
  peerId: UserId;
  peer: User;
  lastMessage: Message | null;
  lastMessageAt: number;
}

export interface SessionUser extends User {}

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

export type MobileTab = "chats" | "friends" | "profile";
