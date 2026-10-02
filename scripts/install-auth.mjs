import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";

try { loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
if (!process.env.DATABASE_URL) throw new Error("Falta configurar DATABASE_URL.");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [columns] = await connection.query("SHOW COLUMNS FROM inm_usuarios");
  const existing = new Set(columns.map(column => column.Field));
  const additions = [
    ["usuario", "varchar(60) NULL"],
    ["password_hash", "varchar(255) NULL"],
    ["intentos_fallidos", "int NOT NULL DEFAULT 0"],
    ["bloqueo_hasta", "timestamp NULL"],
  ];
  for (const [column, definition] of additions) {
    if (!existing.has(column)) {
      await connection.query(`ALTER TABLE inm_usuarios ADD COLUMN \`${column}\` ${definition}`);
      console.log(`Campo de acceso agregado: ${column}`);
    }
  }
  const [indexes] = await connection.query("SHOW INDEX FROM inm_usuarios");
  if (!indexes.some(index => index.Key_name === "uq_inm_usuarios_usuario")) {
    await connection.query("CREATE UNIQUE INDEX uq_inm_usuarios_usuario ON inm_usuarios (usuario)");
  }
  await connection.query(`CREATE TABLE IF NOT EXISTS inm_sesiones (
    token_hash varchar(64) NOT NULL PRIMARY KEY,
    usuario_id bigint unsigned NOT NULL,
    expira timestamp NOT NULL,
    INDEX idx_inm_sesiones_usuario (usuario_id),
    INDEX idx_inm_sesiones_expira (expira),
    CONSTRAINT inm_sesiones_usuario_id_inm_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES inm_usuarios(id)
  )`);
  console.log("Campos de acceso y tabla de sesiones listos. No se modificaron contraseñas ni datos de cartera.");
} finally {
  await connection.end();
}
