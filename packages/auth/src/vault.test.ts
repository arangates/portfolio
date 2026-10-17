import assert from "node:assert/strict";
import test from "node:test";
import { encryptVaultPayload, decryptVaultPayload, hashPasscode, verifyPasscode } from "./vault";

test("encrypts and decrypts string data losslessly with AES-256-GCM", async () => {
  const secret = "Confidential portfolio data: 120,000 EUR in Dutch ETF";
  const passcode = "MySecureMasterPasscode2026!";

  const encrypted = await encryptVaultPayload(secret, passcode);
  assert.ok(encrypted.length > secret.length);

  const decrypted = await decryptVaultPayload(encrypted, passcode);
  const text = new TextDecoder().decode(decrypted);
  assert.equal(text, secret);
});

test("encrypts and decrypts binary buffers accurately", async () => {
  const binaryData = new Uint8Array([0x00, 0xff, 0x42, 0x13, 0x37, 0x99, 0xaa, 0xbb]);
  const passcode = "SovereignKey999";

  const encrypted = await encryptVaultPayload(binaryData, passcode);
  const decrypted = await decryptVaultPayload(encrypted, passcode);

  assert.deepEqual(decrypted, binaryData);
});

test("rejects decryption with the wrong passcode", async () => {
  const secret = "Sensitive financial payload";
  const encrypted = await encryptVaultPayload(secret, "CorrectPassword123");

  await assert.rejects(
    async () => {
      await decryptVaultPayload(encrypted, "WrongPassword456");
    },
    { message: /incorrect passcode or corrupted data/ },
  );
});

test("detects tampering with ciphertext via GCM auth tag", async () => {
  const secret = "Authentic financial ledger";
  const passcode = "TamperProofKey";

  const encrypted = await encryptVaultPayload(secret, passcode);
  const lastIdx = encrypted.length - 1;
  encrypted[lastIdx] = (encrypted[lastIdx] ?? 0) ^ 0x01;

  await assert.rejects(
    async () => {
      await decryptVaultPayload(encrypted, passcode);
    },
    { message: /incorrect passcode or corrupted data/ },
  );
});

test("rejects malformed or truncated payloads", async () => {
  await assert.rejects(
    async () => {
      await decryptVaultPayload(new Uint8Array([1, 2, 3]), "anyPass");
    },
    { message: /payload is too short/ },
  );

  const fakeHeader = new Uint8Array(50);
  await assert.rejects(
    async () => {
      await decryptVaultPayload(fakeHeader, "anyPass");
    },
    { message: /missing SELV magic header/ },
  );
});

test("verifies master passcode hash and rejects incorrect passcode", async () => {
  const passcode = "PasscodeMaster-987!";
  const { hash, salt } = await hashPasscode(passcode);

  const isValid = await verifyPasscode(passcode, hash, salt);
  assert.equal(isValid, true);

  const isInvalid = await verifyPasscode("WrongPasscode-123", hash, salt);
  assert.equal(isInvalid, false);
});
