import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, createSessionToken, hashSessionToken } from "../lib/password.mjs";

test("password hashes use unique salts and verify exact passwords", async () => {
  const password = "Clave de prueba segura 2026!";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password + " ", first), false);
  assert.equal(await verifyPassword("incorrecta", first), false);
});

test("missing, plaintext and malformed stored hashes cannot authenticate", async () => {
  for (const hash of [null, undefined, "contraseña", "scrypt$x$x", "scrypt$" + "a".repeat(32) + "$" + "b".repeat(128) + "$extra"]) {
    assert.equal(await verifyPassword("contraseña", hash), false);
  }
});

test("session tokens are unpredictable and stored only as SHA-256 hashes", () => {
  const first = createSessionToken();
  const second = createSessionToken();
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
  assert.notEqual(hashSessionToken(first), first);
  assert.equal(hashSessionToken(first), hashSessionToken(first));
  assert.notEqual(hashSessionToken(first), hashSessionToken(second));
});
