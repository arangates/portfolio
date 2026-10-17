import {
  createCipheriv,
  createDecipheriv,
  pbkdf2,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

const MAGIC_HEADER = Buffer.from([0x53, 0x45, 0x4c, 0x56]); // "SELV"
const VAULT_VERSION = 0x01;
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // GCM recommended IV size
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 32; // 256 bits

/**
 * Derives a 256-bit cryptographic key from a master passcode and salt using PBKDF2-SHA512.
 */
export async function deriveKey(passcode: string, salt: Buffer): Promise<Buffer> {
  return (await pbkdf2Async(passcode, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha512")) as Buffer;
}

/**
 * Encrypts arbitrary data (string or bytes) using authenticated AES-256-GCM.
 * Output format: [4 bytes MAGIC][1 byte VERSION][16 bytes SALT][12 bytes IV][16 bytes AUTH_TAG][CIPHERTEXT]
 */
export async function encryptVaultPayload(
  data: Uint8Array | string,
  passcode: string,
): Promise<Uint8Array> {
  const plaintext = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = await deriveKey(passcode, salt);

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const header = Buffer.concat([MAGIC_HEADER, Buffer.from([VAULT_VERSION]), salt, iv, authTag]);

  return new Uint8Array(Buffer.concat([header, encrypted]));
}

/**
 * Decrypts and authenticates a vault payload encrypted with AES-256-GCM.
 * Throws an error if the passcode is incorrect or if the data has been tampered with.
 */
export async function decryptVaultPayload(
  encryptedBytes: Uint8Array,
  passcode: string,
): Promise<Uint8Array> {
  const buffer = Buffer.from(encryptedBytes);
  const minLength = 4 + 1 + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;
  if (buffer.length < minLength) {
    throw new Error("Invalid vault file: payload is too short");
  }

  const magic = buffer.subarray(0, 4);
  if (!magic.equals(MAGIC_HEADER)) {
    throw new Error("Invalid vault file: missing SELV magic header");
  }

  const version = buffer[4];
  if (version !== VAULT_VERSION) {
    throw new Error(`Unsupported vault version: ${version}`);
  }

  let offset = 5;
  const salt = buffer.subarray(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;

  const iv = buffer.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;

  const authTag = buffer.subarray(offset, offset + AUTH_TAG_LENGTH);
  offset += AUTH_TAG_LENGTH;

  const ciphertext = buffer.subarray(offset);

  const key = await deriveKey(passcode, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return new Uint8Array(decrypted);
  } catch {
    throw new Error("Failed to decrypt vault: incorrect passcode or corrupted data");
  }
}

/**
 * Hashes a master passcode for secure local lock verification.
 */
export async function hashPasscode(passcode: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await deriveKey(passcode, salt);
  return {
    hash: derived.toString("hex"),
    salt: salt.toString("hex"),
  };
}

/**
 * Verifies a master passcode in constant time against a stored hash and salt.
 */
export async function verifyPasscode(
  passcode: string,
  storedHashHex: string,
  storedSaltHex: string,
): Promise<boolean> {
  const salt = Buffer.from(storedSaltHex, "hex");
  const storedHash = Buffer.from(storedHashHex, "hex");
  const derived = await deriveKey(passcode, salt);

  if (derived.length !== storedHash.length) return false;
  return timingSafeEqual(derived, storedHash);
}
