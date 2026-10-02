import test from "node:test";
import assert from "node:assert/strict";
import { sameOrigin } from "../lib/request-origin.mjs";

test("origin validation accepts local and forwarded hosts and rejects foreign origins", () => {
  const request = (origin, headers = {}) => new Request("http://localhost:3000/api/auth/login", {
    headers: { ...(origin ? { origin } : {}), ...headers },
  });
  assert.equal(sameOrigin(request("http://localhost:3000")), true);
  assert.equal(sameOrigin(request("https://app.example", { "x-forwarded-host": "app.example" })), true);
  assert.equal(sameOrigin(request("https://evil.example")), false);
  assert.equal(sameOrigin(request()), false);
  assert.equal(sameOrigin(request("null")), false);
  assert.equal(sameOrigin(request("https://public.example", { "sec-fetch-site": "same-origin" })), true);
  assert.equal(sameOrigin(request("https://public.example", { "sec-fetch-site": "cross-site" })), false);
  assert.equal(sameOrigin(request("http://localhost:3000", { "sec-fetch-site": "same-site" })), false);
  assert.equal(sameOrigin(request(undefined, { "sec-fetch-site": "same-origin" })), false);
  const previousName = process.env.CODESPACE_NAME;
  const previousDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  process.env.CODESPACE_NAME = "test-space";
  process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN = "app.github.dev";
  try {
    assert.equal(sameOrigin(request("https://test-space-3000.app.github.dev")), true);
    assert.equal(sameOrigin(request("https://other-space-3000.app.github.dev")), false);
    assert.equal(sameOrigin(request("https://test-space-3001.app.github.dev")), false);
    assert.equal(sameOrigin(request("http://test-space-3000.app.github.dev")), false);
  } finally {
    if (previousName === undefined) delete process.env.CODESPACE_NAME;
    else process.env.CODESPACE_NAME = previousName;
    if (previousDomain === undefined) delete process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
    else process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN = previousDomain;
  }
});
