import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const options = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 64, options);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  const parts = typeof storedHash === "string" ? storedHash.split("$") : [];
  const valid = parts.length === 3 && parts[0] === "scrypt" && /^[a-f0-9]{32}$/.test(parts[1]) && /^[a-f0-9]{128}$/.test(parts[2]);
  // Perform the same expensive operation even for unknown users or invalid hashes.
  const salt = valid ? parts[1] : "00000000000000000000000000000000";
  const key = await derive(password, salt, 64, options);
  const expected = valid ? Buffer.from(parts[2], "hex") : Buffer.alloc(64);
  return timingSafeEqual(key, expected) && valid;
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
