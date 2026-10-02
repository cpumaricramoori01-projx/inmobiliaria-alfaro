import test from "node:test";
import assert from "node:assert/strict";
import { isAdministrator, homeForUser } from "../lib/access.mjs";

test("only the administrator role receives full access", () => {
  assert.equal(isAdministrator({ rol: "administrador" }), true);
  assert.equal(homeForUser({ rol: "administrador" }), "/");
  for (const rol of ["operador", "usuario", "", "Administrador"]) {
    // The existing operador account has the legacy usuario role.
    const user = { usuario: "administrador", rol };
    assert.equal(isAdministrator(user), false);
    assert.equal(homeForUser(user), "/datos-inmuebles");
  }
  assert.equal(isAdministrator(null), false);
});
