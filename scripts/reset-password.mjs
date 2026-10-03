import { loadEnvFile } from "node:process";
import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import mysql from "mysql2/promise";
import { hashPassword } from "../lib/password.mjs";

try { loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
const { values } = parseArgs({ options: { usuario: { type: "string" } } });
const usuario = values.usuario?.trim().toLowerCase();
if (!usuario || !/^[a-z0-9._-]{1,60}$/.test(usuario)) throw new Error("Uso: npm run auth:password -- --usuario operador");
if (!process.env.DATABASE_URL) throw new Error("Falta configurar DATABASE_URL.");
if (!process.stdin.isTTY) throw new Error("Ejecuta este comando en la terminal de Codespaces para introducir la contraseña de forma privada.");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [existing] = await connection.execute("SELECT id FROM inm_usuarios WHERE usuario = ?", [usuario]);
  if (existing.length !== 1) throw new Error("No se encontró esa cuenta.");
  let muted = false;
  const output = new Writable({ write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk, encoding);
    callback();
  } });
  const terminal = createInterface({ input: process.stdin, output, terminal: true });
  let password;
  try {
    process.stdout.write(`Nueva contraseña para ${usuario} (mínimo 8 caracteres, no se mostrará): `);
    muted = true;
    password = await terminal.question("");
    muted = false;
    process.stdout.write("\nConfirma la nueva contraseña: ");
    muted = true;
    const confirmation = await terminal.question("");
    muted = false;
    process.stdout.write("\n");
    if (password !== confirmation) throw new Error("Las contraseñas no coinciden.");
    if (password.length < 8 || password.length > 256) throw new Error("La contraseña debe tener entre 8 y 256 caracteres.");
  } finally { muted = false; terminal.close(); }
  const passwordHash = await hashPassword(password);
  await connection.beginTransaction();
  const [users] = await connection.execute("SELECT id FROM inm_usuarios WHERE usuario = ? FOR UPDATE", [usuario]);
  if (users.length !== 1 || users[0].id !== existing[0].id) throw new Error("La cuenta ha cambiado. Ejecuta nuevamente el comando.");
  await connection.execute("UPDATE inm_usuarios SET password_hash = ?, intentos_fallidos = 0, bloqueo_hasta = NULL WHERE id = ?", [passwordHash, users[0].id]);
  await connection.execute("DELETE FROM inm_sesiones WHERE usuario_id = ?", [users[0].id]);
  await connection.commit();
  console.log(`Contraseña actualizada para ${usuario}. Puedes iniciar sesión con la nueva contraseña.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally { await connection.end(); }
