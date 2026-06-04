/**
 * Client-side E2E encryption (Web Crypto).
 * Server only stores ciphertext + public keys.
 */

const E2E_PREFIX = "e2e:v1:";
const PRIVATE_STORAGE = "eclipse_private_key";
const GROUP_KEYS_STORAGE = "eclipse_group_keys";

export function isEncryptedPayload(content: string): boolean {
  return content.startsWith(E2E_PREFIX);
}

export function encryptedPreview(): string {
  return "🔒 Encrypted message";
}

function b64Encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function b64Decode(s: string): ArrayBuffer {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function derivePasswordKey(
  password: string,
  salt: BufferSource
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function generateIdentity(password: string): Promise<{
  publicKeyJwk: string;
  privateKeyEncrypted: string;
}> {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrapKey = await derivePasswordKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const privateBytes = new TextEncoder().encode(JSON.stringify(privateJwk));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrapKey,
    privateBytes
  );
  const privateKeyEncrypted = JSON.stringify({
    salt: b64Encode(salt.buffer),
    iv: b64Encode(iv.buffer),
    data: b64Encode(cipher),
  });
  return {
    publicKeyJwk: JSON.stringify(publicJwk),
    privateKeyEncrypted,
  };
}

export async function unlockPrivateKey(
  password: string,
  encrypted: string
): Promise<CryptoKey> {
  const { salt, iv, data } = JSON.parse(encrypted) as {
    salt: string;
    iv: string;
    data: string;
  };
  const wrapKey = await derivePasswordKey(
    password,
    new Uint8Array(b64Decode(salt)) as BufferSource
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(b64Decode(iv)) },
    wrapKey,
    b64Decode(data)
  );
  const privateJwk = JSON.parse(new TextDecoder().decode(plain)) as JsonWebKey;
  return crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"]
  );
}

async function importPublicKey(jwkJson: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkJson) as JsonWebKey;
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

async function deriveAesKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptForPublicKey(
  plaintext: string,
  publicKeyJwk: string,
  myPrivateKey: CryptoKey
): Promise<string> {
  const theirPublic = await importPublicKey(publicKeyJwk);
  const aes = await deriveAesKey(myPrivateKey, theirPublic);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aes,
    new TextEncoder().encode(plaintext)
  );
  return `${E2E_PREFIX}${b64Encode(iv.buffer)}.${b64Encode(cipher)}`;
}

export async function decryptFromSender(
  payload: string,
  senderPublicKeyJwk: string,
  myPrivateKey: CryptoKey
): Promise<string> {
  if (!isEncryptedPayload(payload)) return payload;
  const body = payload.slice(E2E_PREFIX.length);
  const [ivB64, ctB64] = body.split(".");
  if (!ivB64 || !ctB64) throw new Error("Invalid ciphertext");
  const senderPublic = await importPublicKey(senderPublicKeyJwk);
  const aes = await deriveAesKey(myPrivateKey, senderPublic);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(b64Decode(ivB64)) },
    aes,
    b64Decode(ctB64)
  );
  return new TextDecoder().decode(plain);
}

export async function generateGroupKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function exportGroupKeyRaw(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return b64Encode(raw);
}

export async function importGroupKeyRaw(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    b64Decode(b64),
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function wrapGroupKeyForUser(
  groupKey: CryptoKey,
  recipientPublicKeyJwk: string,
  myPrivateKey: CryptoKey
): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", groupKey);
  const theirPublic = await importPublicKey(recipientPublicKeyJwk);
  const aes = await deriveAesKey(myPrivateKey, theirPublic);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aes,
    raw
  );
  return `${b64Encode(iv.buffer)}.${b64Encode(cipher)}`;
}

export async function unwrapGroupKey(
  wrapped: string,
  senderPublicKeyJwk: string,
  myPrivateKey: CryptoKey
): Promise<CryptoKey> {
  const [ivB64, ctB64] = wrapped.split(".");
  if (!ivB64 || !ctB64) throw new Error("Invalid wrapped key");
  const senderPublic = await importPublicKey(senderPublicKeyJwk);
  const aes = await deriveAesKey(myPrivateKey, senderPublic);
  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(b64Decode(ivB64)) },
    aes,
    b64Decode(ctB64)
  );
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptWithGroupKey(
  plaintext: string,
  groupKey: CryptoKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    groupKey,
    new TextEncoder().encode(plaintext)
  );
  return `${E2E_PREFIX}${b64Encode(iv.buffer)}.${b64Encode(cipher)}`;
}

export async function decryptWithGroupKey(
  payload: string,
  groupKey: CryptoKey
): Promise<string> {
  if (!isEncryptedPayload(payload)) return payload;
  const body = payload.slice(E2E_PREFIX.length);
  const [ivB64, ctB64] = body.split(".");
  if (!ivB64 || !ctB64) throw new Error("Invalid ciphertext");
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(b64Decode(ivB64)) },
    groupKey,
    b64Decode(ctB64)
  );
  return new TextDecoder().decode(plain);
}

export function savePrivateKeyEncrypted(userId: string, data: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`${PRIVATE_STORAGE}:${userId}`, data);
}

export function loadPrivateKeyEncrypted(userId: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(`${PRIVATE_STORAGE}:${userId}`);
}

export function clearPrivateKeyEncrypted(userId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(`${PRIVATE_STORAGE}:${userId}`);
}

export function saveGroupKeyLocal(groupId: string, rawB64: string): void {
  if (typeof localStorage === "undefined") return;
  const all = loadAllGroupKeys();
  all[groupId] = rawB64;
  localStorage.setItem(GROUP_KEYS_STORAGE, JSON.stringify(all));
}

export function loadGroupKeyLocal(groupId: string): string | null {
  const all = loadAllGroupKeys();
  return all[groupId] ?? null;
}

function loadAllGroupKeys(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(GROUP_KEYS_STORAGE) ?? "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

export function clearAllGroupKeysLocal(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(GROUP_KEYS_STORAGE);
}
