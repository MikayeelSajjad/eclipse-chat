"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { mergeMessages, type LiveSyncPayload } from "@/lib/live";
import {
  ensureNotificationPermission,
  playMessageSound,
  showMessageNotification,
} from "@/lib/notifications";
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

const LIVE_INTERVAL_MS = 2000;
const LIVE_HIDDEN_INTERVAL_MS = 3500;

interface EclipseContextValue {
  hydrated: boolean;
  loading: boolean;
  liveConnected: boolean;
  currentUser: SessionUser | null;
  conversations: ConversationSummary[];
  messages: Message[];
  friends: FriendsPayload;
  searchResults: SearchUser[];
  activePeerId: UserId | null;
  mobileTab: MobileTab;
  typingPeerId: UserId | null;
  notificationsEnabled: boolean;
  enableNotifications: () => Promise<boolean>;
  isPeerUnread: (peerId: string) => boolean;
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
  pingTyping: (peerId: UserId) => void;
  getActiveFriend: () => User | undefined;
}

const EclipseContext = createContext<EclipseContextValue | null>(null);

export function EclipseProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
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
  const [lastReadAt, setLastReadAt] = useState<Record<string, number>>({});

  const lastSyncRef = useRef(0);
  const activePeerRef = useRef<UserId | null>(null);
  const currentUserRef = useRef<SessionUser | null>(null);
  const typingPingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    activePeerRef.current = activePeerId;
  }, [activePeerId]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const markPeerRead = useCallback((peerId: string) => {
    setLastReadAt((prev) => ({ ...prev, [peerId]: Date.now() }));
  }, []);

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
    if (res.ok) {
      setMessages(res.data.messages);
      if (res.data.messages.length > 0) {
        const last = res.data.messages[res.data.messages.length - 1];
        lastSyncRef.current = Math.max(lastSyncRef.current, last.created_at);
      }
    }
  }, []);

  const applyLiveSync = useCallback((data: LiveSyncPayload) => {
    setConversations(data.conversations);
    setLiveConnected(true);
    lastSyncRef.current = data.serverTime;

    const peer = activePeerRef.current;
    const me = currentUserRef.current;

    if (peer && data.newMessages.length > 0) {
      setMessages((prev) => mergeMessages(prev, data.newMessages));
      const fromPeer = data.newMessages.filter((m) => m.sender_id === peer);
      if (fromPeer.length > 0) {
        playMessageSound();
        markPeerRead(peer);
      }
    }

    setTypingPeerId(data.peerTyping && peer ? peer : null);

    for (const item of data.inbox) {
      if (notifiedIdsRef.current.has(item.message.id)) continue;
      notifiedIdsRef.current.add(item.message.id);

      const isActiveChat =
        peer === item.peer.id && document.visibilityState === "visible";

      if (!isActiveChat) {
        showMessageNotification(item.message, item.peer);
        playMessageSound();
      }

      if (peer === item.peer.id && document.visibilityState === "visible") {
        setMessages((prev) => mergeMessages(prev, [item.message]));
        markPeerRead(peer);
      }
    }

    if (me && data.inbox.length > 0) {
      const unread = data.inbox.filter((i) => i.peer.id !== peer).length;
      if (unread > 0 && document.visibilityState !== "visible") {
        document.title = `(${unread}) Eclipse`;
      } else if (document.visibilityState === "visible") {
        document.title = "Eclipse — Real-time Chat";
      }
    }
  }, [markPeerRead]);

  const runLiveSync = useCallback(async () => {
    if (!currentUserRef.current) return;
    const peer = activePeerRef.current;
    const since = lastSyncRef.current;
    const url = peer
      ? `/api/live?since=${since}&peerId=${encodeURIComponent(peer)}`
      : `/api/live?since=${since}`;

    const res = await apiFetch<LiveSyncPayload>(url);
    if (res.ok) applyLiveSync(res.data);
  }, [applyLiveSync]);

  useEffect(() => {
    if (!currentUser) {
      setLiveConnected(false);
      return;
    }

    void runLiveSync();

    const tick = () => {
      void runLiveSync();
    };

    const interval =
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
        ? LIVE_HIDDEN_INTERVAL_MS
        : LIVE_INTERVAL_MS;

    const id = window.setInterval(tick, interval);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        document.title = "Eclipse — Real-time Chat";
        void runLiveSync();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [currentUser, activePeerId, runLiveSync]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadConversations(), loadFriends()]);
    if (activePeerId) await loadMessages(activePeerId);
    await runLiveSync();
    setLoading(false);
  }, [activePeerId, loadConversations, loadFriends, loadMessages, runLiveSync]);

  useEffect(() => {
    (async () => {
      const res = await apiFetch<{ user: SessionUser }>("/api/auth/me");
      if (res.ok) {
        setCurrentUser(res.data.user);
        await Promise.all([loadConversations(), loadFriends()]);
        const granted = await ensureNotificationPermission();
        setNotificationsEnabled(granted);
      }
      setHydrated(true);
    })();
  }, [loadConversations, loadFriends]);

  useEffect(() => {
    if (!activePeerId || !currentUser) return;
    loadMessages(activePeerId);
    markPeerRead(activePeerId);
  }, [activePeerId, currentUser, loadMessages, markPeerRead]);

  const enableNotifications = useCallback(async () => {
    const granted = await ensureNotificationPermission();
    setNotificationsEnabled(granted);
    return granted;
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      const res = await apiFetch<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return res.error;
      setCurrentUser(res.data.user);
      lastSyncRef.current = Date.now();
      notifiedIdsRef.current.clear();
      await Promise.all([loadConversations(), loadFriends()]);
      const granted = await ensureNotificationPermission();
      setNotificationsEnabled(granted);
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
      lastSyncRef.current = Date.now();
      notifiedIdsRef.current.clear();
      await Promise.all([loadConversations(), loadFriends()]);
      const granted = await ensureNotificationPermission();
      setNotificationsEnabled(granted);
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
    setTypingPeerId(null);
    setLiveConnected(false);
    lastSyncRef.current = 0;
    notifiedIdsRef.current.clear();
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
      await runLiveSync();
    },
    [loadFriends, loadConversations, runLiveSync]
  );

  const declineFriendRequest = useCallback(
    async (requestId: string) => {
      await apiFetch(`/api/friends/${requestId}`, { method: "DELETE" });
      await loadFriends();
    },
    [loadFriends]
  );

  const openConversation = useCallback(
    async (peerId: UserId) => {
      setActivePeerId(peerId);
      markPeerRead(peerId);
      await loadMessages(peerId);
    },
    [loadMessages, markPeerRead]
  );

  const setActivePeer = useCallback((peerId: UserId | null) => {
    setActivePeerId(peerId);
    if (!peerId) setMessages([]);
    else markPeerRead(peerId);
  }, [markPeerRead]);

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

      setMessages((prev) => mergeMessages(prev, [res.data.message]));
      lastSyncRef.current = Math.max(
        lastSyncRef.current,
        res.data.message.created_at
      );
      await runLiveSync();
      setTypingPeerId(null);
    },
    [activePeerId, currentUser, runLiveSync]
  );

  const pingTyping = useCallback((peerId: UserId) => {
    if (typingPingRef.current) return;
    void apiFetch("/api/typing", {
      method: "POST",
      body: JSON.stringify({ peer_id: peerId }),
    });
    typingPingRef.current = setTimeout(() => {
      typingPingRef.current = null;
    }, 1500);
  }, []);

  const isPeerUnread = useCallback(
    (peerId: string) => {
      const conv = conversations.find((c) => c.peerId === peerId);
      if (!conv?.lastMessage || !currentUser) return false;
      if (conv.lastMessage.sender_id === currentUser.id) return false;
      const readAt = lastReadAt[peerId] ?? 0;
      return conv.lastMessageAt > readAt;
    },
    [conversations, currentUser, lastReadAt]
  );

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
      liveConnected,
      currentUser,
      conversations,
      messages,
      friends,
      searchResults,
      activePeerId,
      mobileTab,
      typingPeerId,
      notificationsEnabled,
      enableNotifications,
      isPeerUnread,
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
      pingTyping,
      getActiveFriend,
    }),
    [
      hydrated,
      loading,
      liveConnected,
      currentUser,
      conversations,
      messages,
      friends,
      searchResults,
      activePeerId,
      mobileTab,
      typingPeerId,
      notificationsEnabled,
      enableNotifications,
      isPeerUnread,
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
      pingTyping,
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
