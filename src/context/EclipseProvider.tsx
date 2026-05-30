"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import type {
  ConversationSummary,
  FriendsPayload,
  Message,
  MobileTab,
  SearchUser,
  SessionUser,
  User,
  UserId,
} from "@/lib/types";

interface EclipseContextValue {
  hydrated: boolean;
  loading: boolean;
  currentUser: SessionUser | null;
  conversations: ConversationSummary[];
  messages: Message[];
  friends: FriendsPayload;
  searchResults: SearchUser[];
  activePeerId: UserId | null;
  mobileTab: MobileTab;
  typingPeerId: UserId | null;
  setMobileTab: (tab: MobileTab) => void;
  refreshAll: () => Promise<void>;
  login: (username: string, password: string) => Promise<string | null>;
  signup: (
    username: string,
    password: string,
    avatarUrl?: string
  ) => Promise<string | null>;
  logout: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  sendFriendRequest: (receiverId: UserId) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  openConversation: (peerId: UserId) => Promise<void>;
  setActivePeer: (peerId: UserId | null) => void;
  sendMessage: (text: string) => Promise<void>;
  setTyping: (peerId: UserId, typing: boolean) => void;
  getActiveFriend: () => User | undefined;
}

const EclipseContext = createContext<EclipseContextValue | null>(null);

export function EclipseProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [friends, setFriends] = useState<FriendsPayload>({
    accepted: [],
    incoming: [],
    outgoing: [],
  });
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [activePeerId, setActivePeerId] = useState<UserId | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chats");
  const [typingPeerId, setTypingPeerId] = useState<UserId | null>(null);

  const loadConversations = useCallback(async () => {
    const res = await apiFetch<{ conversations: ConversationSummary[] }>(
      "/api/conversations"
    );
    if (res.ok) setConversations(res.data.conversations);
  }, []);

  const loadFriends = useCallback(async () => {
    const res = await apiFetch<FriendsPayload>("/api/friends");
    if (res.ok) setFriends(res.data);
  }, []);

  const loadMessages = useCallback(async (peerId: string) => {
    const res = await apiFetch<{ messages: Message[] }>(
      `/api/messages?peerId=${encodeURIComponent(peerId)}`
    );
    if (res.ok) setMessages(res.data.messages);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadConversations(), loadFriends()]);
    if (activePeerId) await loadMessages(activePeerId);
    setLoading(false);
  }, [activePeerId, loadConversations, loadFriends, loadMessages]);

  useEffect(() => {
    (async () => {
      const res = await apiFetch<{ user: SessionUser }>("/api/auth/me");
      if (res.ok) {
        setCurrentUser(res.data.user);
        await Promise.all([loadConversations(), loadFriends()]);
      }
      setHydrated(true);
    })();
  }, [loadConversations, loadFriends]);

  useEffect(() => {
    if (!activePeerId || !currentUser) return;
    loadMessages(activePeerId);
  }, [activePeerId, currentUser, loadMessages]);

  const login = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      const res = await apiFetch<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return res.error;
      setCurrentUser(res.data.user);
      await Promise.all([loadConversations(), loadFriends()]);
      return null;
    },
    [loadConversations, loadFriends]
  );

  const signup = useCallback(
    async (
      username: string,
      password: string,
      avatarUrl?: string
    ): Promise<string | null> => {
      const res = await apiFetch<{ user: SessionUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          avatar_url: avatarUrl ?? null,
        }),
      });
      if (!res.ok) return res.error;
      setCurrentUser(res.data.user);
      await Promise.all([loadConversations(), loadFriends()]);
      return null;
    },
    [loadConversations, loadFriends]
  );

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setConversations([]);
    setMessages([]);
    setFriends({ accepted: [], incoming: [], outgoing: [] });
    setActivePeerId(null);
    setSearchResults([]);
    setMobileTab("chats");
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await apiFetch<{ users: SearchUser[] }>(
      `/api/users/search?q=${encodeURIComponent(query)}`
    );
    if (res.ok) setSearchResults(res.data.users);
  }, []);

  const sendFriendRequest = useCallback(
    async (receiverId: UserId): Promise<boolean> => {
      const res = await apiFetch<{ id: string }>("/api/friends", {
        method: "POST",
        body: JSON.stringify({ receiver_id: receiverId }),
      });
      if (!res.ok) return false;
      await loadFriends();
      return true;
    },
    [loadFriends]
  );

  const acceptFriendRequest = useCallback(
    async (requestId: string) => {
      await apiFetch(`/api/friends/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "accept" }),
      });
      await Promise.all([loadFriends(), loadConversations()]);
    },
    [loadFriends, loadConversations]
  );

  const declineFriendRequest = useCallback(
    async (requestId: string) => {
      await apiFetch(`/api/friends/${requestId}`, { method: "DELETE" });
      await loadFriends();
    },
    [loadFriends]
  );

  const openConversation = useCallback(async (peerId: UserId) => {
    setActivePeerId(peerId);
    await loadMessages(peerId);
  }, [loadMessages]);

  const setActivePeer = useCallback((peerId: UserId | null) => {
    setActivePeerId(peerId);
    if (!peerId) setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !currentUser || !activePeerId) return;

      const res = await apiFetch<{ message: Message }>("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          receiver_id: activePeerId,
          content: trimmed,
        }),
      });

      if (!res.ok) return;

      setMessages((prev) => [...prev, res.data.message]);
      await loadConversations();
      setTypingPeerId(null);
    },
    [activePeerId, currentUser, loadConversations]
  );

  const setTyping = useCallback((peerId: UserId, typing: boolean) => {
    setTypingPeerId(typing ? peerId : null);
  }, []);

  const getActiveFriend = useCallback((): User | undefined => {
    if (!activePeerId) return undefined;
    const fromConv = conversations.find((c) => c.peerId === activePeerId)?.peer;
    if (fromConv) return fromConv;
    return friends.accepted.find((f) => f.id === activePeerId);
  }, [activePeerId, conversations, friends.accepted]);

  const value = useMemo<EclipseContextValue>(
    () => ({
      hydrated,
      loading,
      currentUser,
      conversations,
      messages,
      friends,
      searchResults,
      activePeerId,
      mobileTab,
      typingPeerId,
      setMobileTab,
      refreshAll,
      login,
      signup,
      logout,
      searchUsers,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      openConversation,
      setActivePeer,
      sendMessage,
      setTyping,
      getActiveFriend,
    }),
    [
      hydrated,
      loading,
      currentUser,
      conversations,
      messages,
      friends,
      searchResults,
      activePeerId,
      mobileTab,
      typingPeerId,
      refreshAll,
      login,
      signup,
      logout,
      searchUsers,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      openConversation,
      setActivePeer,
      sendMessage,
      setTyping,
      getActiveFriend,
    ]
  );

  return (
    <EclipseContext.Provider value={value}>{children}</EclipseContext.Provider>
  );
}

export function useEclipse(): EclipseContextValue {
  const ctx = useContext(EclipseContext);
  if (!ctx) throw new Error("useEclipse must be used within EclipseProvider");
  return ctx;
}
