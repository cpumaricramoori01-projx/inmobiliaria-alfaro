import { loadEnvFile } from "node:process";
import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import mysql from "mysql2/promise";
import { hashPassword } from "../lib/password.mjs";

try { loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
const { values } = parseArgs({ options: {
  usuario: { type: "string" }, nombre: { type: "string" }, email: { type: "string" },
  rol: { type: "string", default: "operador" },
} });
const usuario = values.usuario?.trim().toLowerCase();
const nombre = values.nombre?.trim();
const email = (values.email ?? `${usuario}@inmobiliaria-alfaro.local`).trim().toLowerCase();
if (!usuario || !/^[a-z0-9._-]{1,60}$/.test(usuario) || !nombre || nombre.length > 120 || !email || email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["administrador", "operador"].includes(values.rol)) {
  throw new Error('Uso: npm run auth:user -- --usuario alberto --nombre "Alberto Alfaro" --rol administrador [--email correo@ejemplo.com]');
}
if (!process.env.DATABASE_URL) throw new Error("Falta configurar DATABASE_URL.");
if (!process.stdin.isTTY) throw new Error("Ejecuta este comando en una terminal interactiva para ingresar la contraseña de forma privada.");

let muted = false;
const output = new Writable({ write(chunk, encoding, callback) {
  if (!muted) process.stdout.write(chunk, encoding);
  callback();
} });
const terminal = createInterface({ input: process.stdin, output, terminal: true });
let password;
try {
  process.stdout.write("Contraseña (mínimo 8 caracteres, no se mostrará): ");
  muted = true;
  password = await terminal.question("");
  muted = false;
  process.stdout.write("\nConfirma la contraseña: ");
  muted = true;
  const confirmation = await terminal.question("");
  muted = false;
  process.stdout.write("\n");
  if (password !== confirmation) throw new Error("Las contraseñas no coinciden.");
  if (password.length < 8 || password.length > 256) throw new Error("La contraseña debe tener entre 8 y 256 caracteres.");
} finally {
  muted = false;
  terminal.close();
}

const passwordHash = await hashPassword(password);
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [users] = await connection.execute("SELECT id, usuario, email FROM inm_usuarios WHERE usuario = ? OR email = ? FOR UPDATE", [usuario, email]);
  if (users.length > 1 || (users.length === 1 && users[0].usuario !== null && users[0].usuario !== usuario)) {
    throw new Error("El correo o el usuario ya pertenece a otra cuenta.");
  }
  let id;
  if (users.length) {
    id = users[0].id;
    await connection.execute("UPDATE inm_usuarios SET nombre = ?, email = ?, usuario = ?, password_hash = ?, rol = ?, activo = 1, intentos_fallidos = 0, bloqueo_hasta = NULL WHERE id = ?", [nombre, email, usuario, passwordHash, values.rol, id]);
    await connection.execute("DELETE FROM inm_sesiones WHERE usuario_id = ?", [id]);
  } else {
    const [result] = await connection.execute("INSERT INTO inm_usuarios (nombre, email, usuario, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, 1)", [nombre, email, usuario, passwordHash, values.rol]);
    id = result.insertId;
  }
  await connection.commit();
  console.log(`Cuenta lista: ${usuario} (${values.rol}). ID: ${id}.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
