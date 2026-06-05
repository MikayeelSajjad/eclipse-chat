"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import {
  clearAllGroupKeysLocal,
  clearPrivateKeyEncrypted,
  decryptFromSender,
  decryptWithGroupKey,
  encryptedPreview,
  encryptForPublicKey,
  encryptWithGroupKey,
  exportGroupKeyRaw,
  exportPrivateKeyEncrypted,
  generateGroupKey,
  generateIdentity,
  importGroupKeyRaw,
  isEncryptedPayload,
  loadGroupKeyLocal,
  loadPrivateKeyEncrypted,
  saveGroupKeyLocal,
  savePrivateKeyEncrypted,
  unlockPrivateKey,
  unwrapGroupKey,
  wrapGroupKeyForUser,
} from "@/lib/crypto/e2e";

export const CRYPTO_LOCKED = "CRYPTO_LOCKED";

interface CryptoContextValue {
  cryptoReady: boolean;
  hasLocalKeys: (userId: string) => boolean;
  assertUnlocked: () => void;
  setupIdentity: (userId: string, password: string) => Promise<string | null>;
  unlockIdentity: (userId: string, password: string) => Promise<string | null>;
  clearIdentity: (userId: string) => void;
  encryptDm: (plaintext: string, peerId: string) => Promise<string>;
  encryptGroup: (plaintext: string, groupId: string) => Promise<string>;
  decryptMessage: (
    content: string,
    senderId: string,
    groupId?: string | null
  ) => Promise<string>;
  decryptOwnDm: (content: string, peerId: string) => Promise<string>;
  previewContent: (content: string) => string;
  rotatePrivateKeyPassword: (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => Promise<string | null>;
  prepareGroupKeysForMembers: (
    memberIds: string[]
  ) => Promise<{
    groupKeyRaw: string;
    wrapped: { user_id: string; wrapped_key: string }[];
  }>;
  storeGroupKeyRaw: (groupId: string, raw: string) => Promise<void>;
  loadGroupKey: (
    groupId: string,
    wrappedKey: string,
    wrapperPublicKey: string
  ) => Promise<boolean>;
  ensureGroupKey: (groupId: string) => Promise<boolean>;
  wrapGroupKeyForMember: (groupId: string, memberId: string) => Promise<string>;
}

const CryptoContext = createContext<CryptoContextValue | null>(null);

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [cryptoReady, setCryptoReady] = useState(false);
  const privateKeyRef = useRef<CryptoKey | null>(null);
  const publicKeysRef = useRef<Map<string, string>>(new Map());
  const groupKeysRef = useRef<Map<string, CryptoKey>>(new Map());

  const fetchPublicKey = useCallback(async (userId: string): Promise<string> => {
    const cached = publicKeysRef.current.get(userId);
    if (cached) return cached;
    const res = await apiFetch<{ public_key: string | null }>(
      `/api/users/${encodeURIComponent(userId)}/key`
    );
    if (!res.ok || !res.data.public_key) {
      throw new Error("Peer has no encryption key");
    }
    publicKeysRef.current.set(userId, res.data.public_key);
    return res.data.public_key;
  }, []);

  const setupIdentity = useCallback(
    async (userId: string, password: string): Promise<string | null> => {
      try {
        const { publicKeyJwk, privateKeyEncrypted } =
          await generateIdentity(password);
        savePrivateKeyEncrypted(userId, privateKeyEncrypted);
        const res = await apiFetch("/api/auth/keys", {
          method: "POST",
          body: JSON.stringify({ public_key: publicKeyJwk }),
        });
        if (!res.ok) return res.error;
        privateKeyRef.current = await unlockPrivateKey(
          password,
          privateKeyEncrypted
        );
        setCryptoReady(true);
        return null;
      } catch {
        return "Could not set up encryption keys";
      }
    },
    []
  );

  const unlockIdentity = useCallback(
    async (userId: string, password: string): Promise<string | null> => {
      const stored = loadPrivateKeyEncrypted(userId);
      if (!stored) {
        return setupIdentity(userId, password);
      }
      try {
        privateKeyRef.current = await unlockPrivateKey(password, stored);
        setCryptoReady(true);
        return null;
      } catch {
        return "Wrong password or corrupted encryption keys";
      }
    },
    [setupIdentity]
  );

  const hasLocalKeys = useCallback((userId: string) => {
    return Boolean(loadPrivateKeyEncrypted(userId));
  }, []);

  const assertUnlocked = useCallback(() => {
    if (!privateKeyRef.current) {
      throw new Error(CRYPTO_LOCKED);
    }
  }, []);

  const clearIdentity = useCallback((userId: string) => {
    privateKeyRef.current = null;
    publicKeysRef.current.clear();
    groupKeysRef.current.clear();
    clearPrivateKeyEncrypted(userId);
    clearAllGroupKeysLocal();
    setCryptoReady(false);
  }, []);

  const getGroupKey = useCallback(async (groupId: string): Promise<CryptoKey> => {
    const cached = groupKeysRef.current.get(groupId);
    if (cached) return cached;
    const local = loadGroupKeyLocal(groupId);
    if (local) {
      const key = await importGroupKeyRaw(local);
      groupKeysRef.current.set(groupId, key);
      return key;
    }
    throw new Error("Group key not available");
  }, []);

  const storeGroupKeyRaw = useCallback(async (groupId: string, raw: string) => {
    saveGroupKeyLocal(groupId, raw);
    const key = await importGroupKeyRaw(raw);
    groupKeysRef.current.set(groupId, key);
  }, []);

  const encryptDm = useCallback(
    async (plaintext: string, peerId: string): Promise<string> => {
      assertUnlocked();
      const priv = privateKeyRef.current!;
      const peerKey = await fetchPublicKey(peerId);
      return encryptForPublicKey(plaintext, peerKey, priv);
    },
    [assertUnlocked, fetchPublicKey]
  );

  const encryptGroup = useCallback(
    async (plaintext: string, groupId: string): Promise<string> => {
      const gk = await getGroupKey(groupId);
      return encryptWithGroupKey(plaintext, gk);
    },
    [getGroupKey]
  );

  const decryptMessage = useCallback(
    async (
      content: string,
      senderId: string,
      groupId?: string | null
    ): Promise<string> => {
      if (!isEncryptedPayload(content)) return content;
      if (!privateKeyRef.current) return encryptedPreview();

      try {
        if (groupId) {
          const gk = await getGroupKey(groupId);
          return await decryptWithGroupKey(content, gk);
        }

        const senderKey = await fetchPublicKey(senderId);
        return await decryptFromSender(
          content,
          senderKey,
          privateKeyRef.current
        );
      } catch {
        return encryptedPreview();
      }
    },
    [fetchPublicKey, getGroupKey]
  );

  const decryptOwnDm = useCallback(
    async (content: string, peerId: string): Promise<string> => {
      if (!isEncryptedPayload(content)) return content;
      if (!privateKeyRef.current) return encryptedPreview();

      try {
        const receiverKey = await fetchPublicKey(peerId);
        return await decryptFromSender(
          content,
          receiverKey,
          privateKeyRef.current
        );
      } catch {
        return encryptedPreview();
      }
    },
    [fetchPublicKey]
  );

  const previewContent = useCallback((content: string) => {
    if (isEncryptedPayload(content)) return encryptedPreview();
    return content;
  }, []);

  const rotatePrivateKeyPassword = useCallback(
    async (
      userId: string,
      currentPassword: string,
      newPassword: string
    ): Promise<string | null> => {
      const stored = loadPrivateKeyEncrypted(userId);
      if (!stored) {
        return "No local encryption keys available";
      }

      let key = privateKeyRef.current;
      if (!key) {
        try {
          key = await unlockPrivateKey(currentPassword, stored);
        } catch {
          return "Wrong current password or corrupted local encryption keys";
        }
      }

      try {
        const encrypted = await exportPrivateKeyEncrypted(key, newPassword);
        savePrivateKeyEncrypted(userId, encrypted);
        privateKeyRef.current = key;
        setCryptoReady(true);
        return null;
      } catch {
        return "Could not update local encryption key storage";
      }
    },
    []
  );

  const prepareGroupKeysForMembers = useCallback(
    async (
      memberIds: string[]
    ): Promise<{
      groupKeyRaw: string;
      wrapped: { user_id: string; wrapped_key: string }[];
    }> => {
      assertUnlocked();
      const priv = privateKeyRef.current!;
      const gk = await generateGroupKey();
      const raw = await exportGroupKeyRaw(gk);
      const unique = Array.from(new Set(memberIds));
      const wrapped: { user_id: string; wrapped_key: string }[] = [];

      for (const uid of unique) {
        const userPub = await fetchPublicKey(uid);
        const w = await wrapGroupKeyForUser(gk, userPub, priv);
        wrapped.push({ user_id: uid, wrapped_key: w });
      }

      return { groupKeyRaw: raw, wrapped };
    },
    [assertUnlocked, fetchPublicKey]
  );

  const loadGroupKey = useCallback(
    async (
      groupId: string,
      wrappedKey: string,
      wrapperPublicKey: string
    ): Promise<boolean> => {
      if (!privateKeyRef.current) return false;
      try {
        const gk = await unwrapGroupKey(
          wrappedKey,
          wrapperPublicKey,
          privateKeyRef.current
        );
        const raw = await exportGroupKeyRaw(gk);
        await storeGroupKeyRaw(groupId, raw);
        return true;
      } catch {
        return false;
      }
    },
    [storeGroupKeyRaw]
  );

  const ensureGroupKey = useCallback(
    async (groupId: string): Promise<boolean> => {
      try {
        await getGroupKey(groupId);
        return true;
      } catch {
        /* not loaded */
      }
      const res = await apiFetch<{
        wrapped_key: string;
        wrapper_id: string;
      }>(`/api/groups/${encodeURIComponent(groupId)}/key`);
      if (!res.ok) return false;
      const wrapperKeyRes = await apiFetch<{ public_key: string | null }>(
        `/api/users/${encodeURIComponent(res.data.wrapper_id)}/key`
      );
      if (!wrapperKeyRes.ok || !wrapperKeyRes.data.public_key) return false;
      return loadGroupKey(
        groupId,
        res.data.wrapped_key,
        wrapperKeyRes.data.public_key
      );
    },
    [getGroupKey, loadGroupKey]
  );

  const wrapGroupKeyForMember = useCallback(
    async (groupId: string, memberId: string): Promise<string> => {
      assertUnlocked();
      const priv = privateKeyRef.current!;
      const gk = await getGroupKey(groupId);
      const userPub = await fetchPublicKey(memberId);
      return wrapGroupKeyForUser(gk, userPub, priv);
    },
    [assertUnlocked, fetchPublicKey, getGroupKey]
  );

  const value: CryptoContextValue = {
    cryptoReady,
    hasLocalKeys,
    assertUnlocked,
    setupIdentity,
    unlockIdentity,
    clearIdentity,
    encryptDm,
    encryptGroup,
    decryptMessage,
    decryptOwnDm,
    previewContent,
    rotatePrivateKeyPassword,
    prepareGroupKeysForMembers,
    storeGroupKeyRaw,
    loadGroupKey,
    ensureGroupKey,
    wrapGroupKeyForMember,
  };

  return (
    <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>
  );
}

export function useCrypto(): CryptoContextValue {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error("useCrypto must be used within CryptoProvider");
  return ctx;
}
