import "server-only";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inmSesiones, inmUsuarios, securityAudit } from "@/db/schema";
import { auditValues } from "@/lib/security-audit";
import { hashPassword } from "@/lib/password.mjs";
import { assertUserAccessChange, userInput, UserInputError } from "@/lib/user-input.mjs";

export async function createManagedUser(actorId: number, body: unknown) {
  const input = userInput(body, true);
  const passwordHash = await hashPassword(input.password);
  return db.transaction(async tx => {
    const users = await tx.select({ id: inmUsuarios.id, rol: inmUsuarios.rol, activo: inmUsuarios.activo }).from(inmUsuarios).orderBy(asc(inmUsuarios.id)).for("update");
    const actor = users.find(user => user.id === actorId);
    if (!actor?.activo || actor.rol !== "administrador") throw new UserInputError("Tu cuenta ya no tiene permiso para administrar usuarios.", 403);
    const [result] = await tx.insert(inmUsuarios).values({ nombre: input.nombre, usuario: input.usuario, email: input.email, rol: input.rol, activo: input.activo, passwordHash });
    await tx.insert(securityAudit).values(auditValues(actorId,"user.create",`user:${result.insertId}`));
    return { id: result.insertId };
  });
}

export async function updateManagedUser(actorId: number, id: number, body: unknown) {
  const input = userInput(body);
  const passwordHash = input.password ? await hashPassword(input.password) : null;
  return db.transaction(async tx => {
    // All management mutations take these locks in the same order. Recheck the
    // actor after locking, so concurrent deactivations cannot retain old powers.
    const users = await tx.select({ id: inmUsuarios.id, rol: inmUsuarios.rol, activo: inmUsuarios.activo, usuario: inmUsuarios.usuario, passwordHash: inmUsuarios.passwordHash }).from(inmUsuarios).orderBy(asc(inmUsuarios.id)).for("update");
    const target = users.find(user => user.id === id);
    const actor = users.find(user => user.id === actorId);
    if (!target) throw new UserInputError("Usuario no encontrado.", 404);
    assertUserAccessChange(actor, target, input, users.filter(user => user.activo && user.rol === "administrador").length);
    if (!target.passwordHash && !passwordHash) throw new UserInputError("Define una contraseña para configurar el acceso de esta cuenta.");
    const revokeSessions = Boolean(passwordHash || target.usuario !== input.usuario || target.rol !== input.rol || target.activo !== input.activo);
    const unlock = Boolean(input.desbloquear || passwordHash || (!target.activo && input.activo));
    await tx.update(inmUsuarios).set({ nombre: input.nombre, usuario: input.usuario, email: input.email, rol: input.rol, activo: input.activo,
      ...(passwordHash ? { passwordHash } : {}), ...(unlock ? { intentosFallidos: 0, bloqueoHasta: null } : {}),
    }).where(eq(inmUsuarios.id, id));
    if (revokeSessions) await tx.delete(inmSesiones).where(eq(inmSesiones.usuarioId, id));
    await tx.insert(securityAudit).values(auditValues(actorId,"user.update",`user:${id}`));
    return { ok: true, volverAIngresar: actorId === id && revokeSessions };
  });
}

export function userManagementError(error: unknown) {
  if (error instanceof UserInputError) return NextResponse.json({ error: error.message }, { status: error.status });
  const failure = error as { code?: string; cause?: { code?: string } };
  if ((failure.cause?.code ?? failure.code) === "ER_DUP_ENTRY") return NextResponse.json({ error: "Ese nombre de usuario o correo ya pertenece a otra cuenta." }, { status: 409 });
  console.error("Error en gestión de usuarios:", failure.cause?.code ?? failure.code ?? "ERROR");
  return NextResponse.json({ error: "No se pudo guardar el usuario. Inténtalo nuevamente." }, { status: 500 });
}
