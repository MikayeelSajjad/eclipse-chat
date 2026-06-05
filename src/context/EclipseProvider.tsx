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
import { CRYPTO_LOCKED, useCrypto } from "@/context/CryptoProvider";
import { mergeMessages, type LiveSyncPayload } from "@/lib/live";
import {
  ensureNotificationPermission,
  playMessageSound,
  showMessageNotification,
} from "@/lib/notifications";
import type {
  ConversationSummary,
  FriendsPayload,
  GroupSummary,
  Message,
  MobileTab,
  SearchUser,
  SessionUser,
  User,
  UserId,
} from "@/lib/types";

const LIVE_INTERVAL_MS = 2000;
const LIVE_HIDDEN_INTERVAL_MS = 3500;

const CRYPTO_UNLOCK_MSG =
  "Unlock encryption first — enter your account password in the yellow banner above.";

interface EclipseContextValue {
  hydrated: boolean;
  loading: boolean;
  liveConnected: boolean;
  currentUser: SessionUser | null;
  conversations: ConversationSummary[];
  groups: GroupSummary[];
  messages: Message[];
  friends: FriendsPayload;
  searchResults: SearchUser[];
  activePeerId: UserId | null;
  activeGroupId: string | null;
  mobileTab: MobileTab;
  typingPeerId: UserId | null;
  notificationsEnabled: boolean;
  cryptoReady: boolean;
  sendError: string | null;
  decryptedById: Record<string, string>;
  unlockEncryption: (password: string) => Promise<string | null>;
  enableNotifications: () => Promise<boolean>;
  isPeerUnread: (peerId: string) => boolean;
  setMobileTab: (tab: MobileTab) => void;
  refreshAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  login: (username: string, password: string) => Promise<string | null>;
  signup: (
    username: string,
    password: string,
    avatarUrl?: string
  ) => Promise<string | null>;
  logout: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  sendFriendRequest: (receiverId: UserId) => Promise<string | null>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  openConversation: (peerId: UserId) => Promise<void>;
  openGroup: (groupId: string) => Promise<void>;
  setActivePeer: (peerId: UserId | null) => void;
  setActiveGroup: (groupId: string | null) => void;
  sendMessage: (text: string) => Promise<void>;
  pingTyping: (peerId: UserId) => void;
  getActiveFriend: () => User | undefined;
  getActiveGroup: () => GroupSummary | undefined;
  getDisplayContent: (message: Message) => string;
  createGroup: (name: string, memberIds: string[]) => Promise<string | null>;
  inviteToGroup: (groupId: string, userId: string) => Promise<string | null>;
  startCheckout: (plan: "basic" | "plus") => Promise<string | null>;
}

const EclipseContext = createContext<EclipseContextValue | null>(null);

export function EclipseProvider({ children }: { children: ReactNode }) {
  const crypto = useCrypto();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [friends, setFriends] = useState<FriendsPayload>({
    accepted: [],
    incoming: [],
    outgoing: [],
  });
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [activePeerId, setActivePeerId] = useState<UserId | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chats");
  const [typingPeerId, setTypingPeerId] = useState<UserId | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<Record<string, number>>({});
  const [decryptedById, setDecryptedById] = useState<Record<string, string>>({});

  const lastSyncRef = useRef(0);
  const activePeerRef = useRef<UserId | null>(null);
  const activeGroupRef = useRef<string | null>(null);
  const currentUserRef = useRef<SessionUser | null>(null);
  const typingPingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    activePeerRef.current = activePeerId;
  }, [activePeerId]);

  useEffect(() => {
    activeGroupRef.current = activeGroupId;
  }, [activeGroupId]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const clearSession = useCallback(() => {
    const uid = currentUserRef.current?.id;
    if (uid) {
      crypto.clearIdentity(uid);
    }
    setCurrentUser(null);
    setConversations([]);
    setGroups([]);
    setMessages([]);
    setFriends({ accepted: [], incoming: [], outgoing: [] });
    setSearchResults([]);
    setActivePeerId(null);
    setActiveGroupId(null);
    setMobileTab("chats");
    setTypingPeerId(null);
    setNotificationsEnabled(false);
    setLiveConnected(false);
    setDecryptedById({});
    lastSyncRef.current = 0;
    notifiedIdsRef.current.clear();
  }, [crypto]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
    };
    window.addEventListener("eclipse:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("eclipse:unauthorized", handleUnauthorized);
    };
  }, [clearSession]);

  const markPeerRead = useCallback((peerId: string) => {
    setLastReadAt((prev) => ({ ...prev, [peerId]: Date.now() }));
  }, []);

  const markGroupRead = useCallback((groupId: string) => {
    setLastReadAt((prev) => ({ ...prev, [`g:${groupId}`]: Date.now() }));
  }, []);

  const loadConversations = useCallback(async () => {
    const res = await apiFetch<{ conversations: ConversationSummary[] }>(
      "/api/conversations"
    );
    if (res.ok) setConversations(res.data.conversations);
  }, []);

  const loadGroups = useCallback(async () => {
    const res = await apiFetch<{ groups: GroupSummary[] }>("/api/groups");
    if (res.ok) setGroups(res.data.groups);
  }, []);

  const loadFriends = useCallback(async () => {
    const res = await apiFetch<FriendsPayload>("/api/friends");
    if (res.ok) setFriends(res.data);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await apiFetch<{ user: SessionUser }>("/api/auth/me");
    if (res.ok) {
      setCurrentUser(res.data.user);
    } else {
      clearSession();
    }
  }, [clearSession]);


  const loadDmMessages = useCallback(async (peerId: string) => {
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

  const loadGroupMessages = useCallback(async (groupId: string) => {
    await crypto.ensureGroupKey(groupId);
    const res = await apiFetch<{ messages: Message[] }>(
      `/api/groups/${encodeURIComponent(groupId)}/messages`
    );
    if (res.ok) {
      setMessages(res.data.messages);
      if (res.data.messages.length > 0) {
        const last = res.data.messages[res.data.messages.length - 1];
        lastSyncRef.current = Math.max(lastSyncRef.current, last.created_at);
      }
    }
  }, [crypto]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const m of messages) {
        const gid = m.group_id ?? activeGroupId;
        try {
          next[m.id] = await crypto.decryptMessage(m.content, m.sender_id, gid);
        } catch {
          next[m.id] = crypto.previewContent(m.content);
        }
      }
      if (!cancelled) setDecryptedById((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, activeGroupId, crypto]);

  const getDisplayContent = useCallback(
    (message: Message) =>
      decryptedById[message.id] ?? crypto.previewContent(message.content),
    [decryptedById, crypto]
  );

  const applyLiveSync = useCallback(
    (data: LiveSyncPayload) => {
      setConversations(data.conversations);
      setGroups(data.groups);
      setLiveConnected(true);
      lastSyncRef.current = data.serverTime;

      const peer = activePeerRef.current;
      const group = activeGroupRef.current;
      const me = currentUserRef.current;

      if (data.newMessages.length > 0) {
        if (group) {
          setMessages((prev) => mergeMessages(prev, data.newMessages));
          playMessageSound();
          markGroupRead(group);
        } else if (peer) {
          setMessages((prev) => mergeMessages(prev, data.newMessages));
          const fromPeer = data.newMessages.filter((m) => m.sender_id === peer);
          if (fromPeer.length > 0) {
            playMessageSound();
            markPeerRead(peer);
          }
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

      for (const item of data.groupInbox) {
        if (notifiedIdsRef.current.has(item.message.id)) continue;
        notifiedIdsRef.current.add(item.message.id);
        const isActive =
          group === item.groupId && document.visibilityState === "visible";
        if (!isActive) playMessageSound();
        if (isActive) {
          setMessages((prev) => mergeMessages(prev, [item.message]));
          markGroupRead(item.groupId);
        }
      }

      if (me && (data.inbox.length > 0 || data.groupInbox.length > 0)) {
        const unread =
          data.inbox.filter((i) => i.peer.id !== peer).length +
          data.groupInbox.filter((i) => i.groupId !== group).length;
        if (unread > 0 && document.visibilityState !== "visible") {
          document.title = `(${unread}) Eclipse`;
        } else if (document.visibilityState === "visible") {
          document.title = "Eclipse — E2E Chat";
        }
      }
    },
    [markPeerRead, markGroupRead]
  );

  const runLiveSync = useCallback(async () => {
    if (!currentUserRef.current) return;
    const peer = activePeerRef.current;
    const group = activeGroupRef.current;
    const since = lastSyncRef.current;
    let url = `/api/live?since=${since}`;
    if (group) url += `&groupId=${encodeURIComponent(group)}`;
    else if (peer) url += `&peerId=${encodeURIComponent(peer)}`;

    const res = await apiFetch<LiveSyncPayload>(url);
    if (res.ok) applyLiveSync(res.data);
  }, [applyLiveSync]);

  useEffect(() => {
    if (!currentUser) {
      setLiveConnected(false);
      return;
    }
    void runLiveSync();
    const tick = () => void runLiveSync();
    const interval =
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
        ? LIVE_HIDDEN_INTERVAL_MS
        : LIVE_INTERVAL_MS;
    const id = window.setInterval(tick, interval);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        document.title = "Eclipse — E2E Chat";
        void runLiveSync();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [currentUser, activePeerId, activeGroupId, runLiveSync]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadConversations(), loadFriends(), loadGroups()]);
    if (activePeerId) await loadDmMessages(activePeerId);
    if (activeGroupId) await loadGroupMessages(activeGroupId);
    await runLiveSync();
    setLoading(false);
  }, [
    activePeerId,
    activeGroupId,
    loadConversations,
    loadFriends,
    loadGroups,
    loadDmMessages,
    loadGroupMessages,
    runLiveSync,
  ]);

  useEffect(() => {
    (async () => {
      const res = await apiFetch<{ user: SessionUser }>("/api/auth/me");
      if (res.ok) {
        setCurrentUser(res.data.user);
        await Promise.all([loadConversations(), loadFriends(), loadGroups()]);
        const granted = await ensureNotificationPermission();
        setNotificationsEnabled(granted);
      }
      setHydrated(true);
    })();
  }, [loadConversations, loadFriends, loadGroups]);

  useEffect(() => {
    if (!currentUser) return;
    if (activePeerId) {
      loadDmMessages(activePeerId);
      markPeerRead(activePeerId);
    }
  }, [activePeerId, currentUser, loadDmMessages, markPeerRead]);

  useEffect(() => {
    if (!currentUser || !activeGroupId) return;

    const activateGroup = async () => {
      await crypto.ensureGroupKey(activeGroupId);
      await loadGroupMessages(activeGroupId);
      markGroupRead(activeGroupId);
    };

    void activateGroup();
  }, [activeGroupId, currentUser, loadGroupMessages, markGroupRead, crypto]);

  const enableNotifications = useCallback(async () => {
    const granted = await ensureNotificationPermission();
    setNotificationsEnabled(granted);
    return granted;
  }, []);

  const unlockEncryption = useCallback(
    async (password: string): Promise<string | null> => {
      if (!currentUser) return "Not signed in";
      return crypto.unlockIdentity(currentUser.id, password);
    },
    [currentUser, crypto]
  );

  const afterAuth = useCallback(
    async (user: SessionUser, password: string) => {
      const cryptoErr = await crypto.unlockIdentity(user.id, password);
      if (cryptoErr) return cryptoErr;
      setCurrentUser(user);
      lastSyncRef.current = Date.now();
      notifiedIdsRef.current.clear();
      await Promise.all([loadConversations(), loadFriends(), loadGroups()]);
      const granted = await ensureNotificationPermission();
      setNotificationsEnabled(granted);
      return null;
    },
    [crypto, loadConversations, loadFriends, loadGroups]
  );

  const getDisplayContent = useCallback(
    (message: Message) => {
      return decryptedById[message.id] ?? crypto.previewContent(message.content);
    },
    [crypto, decryptedById]
  );

  const login = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      const res = await apiFetch<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return res.error;
      return afterAuth(res.data.user, password);
    },
    [afterAuth]
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
      return afterAuth(res.data.user, password);
    },
    [afterAuth]
  );

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    clearSession();
  }, [clearSession]);

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
    async (receiverId: UserId): Promise<string | null> => {
      const res = await apiFetch<{ id: string }>("/api/friends", {
        method: "POST",
        body: JSON.stringify({ receiver_id: receiverId }),
      });
      if (!res.ok) return res.error;
      await Promise.all([loadFriends(), refreshUser()]);
      return null;
    },
    [loadFriends, refreshUser]
  );

  const acceptFriendRequest = useCallback(
    async (requestId: string) => {
      await apiFetch(`/api/friends/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "accept" }),
      });
      await Promise.all([loadFriends(), loadConversations(), refreshUser()]);
      await runLiveSync();
    },
    [loadFriends, loadConversations, refreshUser, runLiveSync]
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
      setActiveGroupId(null);
      setActivePeerId(peerId);
      markPeerRead(peerId);
      await loadDmMessages(peerId);
    },
    [loadDmMessages, markPeerRead]
  );

  const openGroup = useCallback(
    async (groupId: string) => {
      setActivePeerId(null);
      setActiveGroupId(groupId);
      markGroupRead(groupId);
      await loadGroupMessages(groupId);
    },
    [loadGroupMessages, markGroupRead]
  );

  const setActivePeer = useCallback(
    (peerId: UserId | null) => {
      setActiveGroupId(null);
      setActivePeerId(peerId);
      if (!peerId) setMessages([]);
      else markPeerRead(peerId);
    },
    [markPeerRead]
  );

  const setActiveGroup = useCallback(
    (groupId: string | null) => {
      setActivePeerId(null);
      setActiveGroupId(groupId);
      if (!groupId) setMessages([]);
      else markGroupRead(groupId);
    },
    [markGroupRead]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !currentUser) return;
      if (!crypto.cryptoReady) {
        setSendError(CRYPTO_UNLOCK_MSG);
        return;
      }

      setSendError(null);

      try {
        if (activeGroupId) {
          const ok = await crypto.ensureGroupKey(activeGroupId);
          if (!ok) {
            setSendError("Unable to unlock the group encryption key.");
            return;
          }
          const content = await crypto.encryptGroup(trimmed, activeGroupId);
          const res = await apiFetch<{ message: Message }>(
            `/api/groups/${encodeURIComponent(activeGroupId)}/messages`,
            { method: "POST", body: JSON.stringify({ content }) }
          );
          if (!res.ok) {
            setSendError(res.error);
            return;
          }
          setMessages((prev) => mergeMessages(prev, [res.data.message]));
        } else if (activePeerId) {
          const content = await crypto.encryptDm(trimmed, activePeerId);
          const res = await apiFetch<{ message: Message }>("/api/messages", {
            method: "POST",
            body: JSON.stringify({
              receiver_id: activePeerId,
              content,
            }),
          });
          if (!res.ok) {
            setSendError(res.error);
            return;
          }
          setMessages((prev) => mergeMessages(prev, [res.data.message]));
        } else return;

        lastSyncRef.current = Date.now();
        await runLiveSync();
        setTypingPeerId(null);
      } catch (e) {
        if (e instanceof Error && e.message === CRYPTO_LOCKED) {
          setSendError(CRYPTO_UNLOCK_MSG);
          return;
        }
        setSendError("Could not send message.");
        throw e;
      }
    },
    [activePeerId, activeGroupId, currentUser, crypto, runLiveSync]
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

  const createGroup = useCallback(
    async (name: string, memberIds: string[]): Promise<string | null> => {
      if (!currentUser) return "Not signed in";
      if (!crypto.cryptoReady) return CRYPTO_UNLOCK_MSG;
      try {
      const allMembers = Array.from(new Set([currentUser.id, ...memberIds]));
      const { groupKeyRaw, wrapped } =
        await crypto.prepareGroupKeysForMembers(allMembers);
      const res = await apiFetch<{ group: GroupSummary }>("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name,
          member_ids: memberIds,
          wrapped_keys: wrapped,
        }),
      });
      if (!res.ok) return res.error;
      if (res.data.group) {
        await crypto.storeGroupKeyRaw(res.data.group.id, groupKeyRaw);
      }
      await loadGroups();
      return null;
      } catch (e) {
        if (e instanceof Error && e.message === CRYPTO_LOCKED) {
          return CRYPTO_UNLOCK_MSG;
        }
        return e instanceof Error ? e.message : "Could not create group";
      }
    },
    [currentUser, crypto, loadGroups]
  );

  const inviteToGroup = useCallback(
    async (groupId: string, userId: string): Promise<string | null> => {
      if (!currentUser) return "Not signed in";
      if (!crypto.cryptoReady) return CRYPTO_UNLOCK_MSG;
      const ok = await crypto.ensureGroupKey(groupId);
      if (!ok) return "Could not unlock group encryption";
      let wrappedKey: string;
      try {
        wrappedKey = await crypto.wrapGroupKeyForMember(groupId, userId);
      } catch (e) {
        if (e instanceof Error && e.message === CRYPTO_LOCKED) {
          return CRYPTO_UNLOCK_MSG;
        }
        return "User has no encryption key";
      }
      const res = await apiFetch(
        `/api/groups/${encodeURIComponent(groupId)}/members`,
        {
          method: "POST",
          body: JSON.stringify({ user_id: userId, wrapped_key: wrappedKey }),
        }
      );
      if (!res.ok) return res.error;
      await loadGroups();
      return null;
    },
    [currentUser, crypto, loadGroups]
  );

  const startCheckout = useCallback(async (plan: "basic" | "plus") => {
    const res = await apiFetch<{ url: string }>("/api/lemonsqueezy/checkout", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) return res.error;
    if (res.data.url) window.location.href = res.data.url;
    return null;
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

  const getActiveGroup = useCallback((): GroupSummary | undefined => {
    if (!activeGroupId) return undefined;
    return groups.find((g) => g.id === activeGroupId);
  }, [activeGroupId, groups]);

  const value = useMemo<EclipseContextValue>(
    () => ({
      hydrated,
      loading,
      liveConnected,
      currentUser,
      conversations,
      groups,
      messages,
      friends,
      searchResults,
      activePeerId,
      activeGroupId,
      mobileTab,
      typingPeerId,
      notificationsEnabled,
      cryptoReady: crypto.cryptoReady,
      decryptedById,
      unlockEncryption,
      enableNotifications,
      isPeerUnread,
      setMobileTab,
      refreshAll,
      refreshUser,
      login,
      signup,
      logout,
      searchUsers,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      openConversation,
      openGroup,
      setActivePeer,
      setActiveGroup,
      sendMessage,
      pingTyping,
      getActiveFriend,
      getActiveGroup,
      getDisplayContent,
      createGroup,
      inviteToGroup,
      startCheckout,
      sendError,
    }),
    [
      hydrated,
      loading,
      liveConnected,
      currentUser,
      conversations,
      groups,
      messages,
      friends,
      searchResults,
      activePeerId,
      activeGroupId,
      mobileTab,
      typingPeerId,
      notificationsEnabled,
      crypto.cryptoReady,
      decryptedById,
      sendError,
      unlockEncryption,
      enableNotifications,
      isPeerUnread,
      refreshAll,
      refreshUser,
      login,
      signup,
      logout,
      searchUsers,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      openConversation,
      openGroup,
      setActivePeer,
      setActiveGroup,
      sendMessage,
      pingTyping,
      getActiveFriend,
      getActiveGroup,
      getDisplayContent,
      createGroup,
      inviteToGroup,
      startCheckout,
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
