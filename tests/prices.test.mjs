import test from "node:test";
import assert from "node:assert/strict";
import { parsePrice } from "../lib/prices.mjs";

test("prices preserve cents and fit the database precision", () => {
  assert.equal(parsePrice("450000"), "450000.00");
  assert.equal(parsePrice(" 450000.5 "), "450000.50");
  assert.equal(parsePrice(450000.25), "450000.25");
  assert.equal(parsePrice("9999999999999.99"), "9999999999999.99");
  assert.equal(parsePrice("0.01"), "0.01");
});

test("invalid or missing prices cannot silently become valid amounts", () => {
  for (const value of [null, undefined, "", "0", 0, -1, "NaN", "Infinity", "1e5", "450,000", "450000.999", "10000000000000", {}, true]) {
    assert.equal(parsePrice(value), null, String(value));
  }
});
