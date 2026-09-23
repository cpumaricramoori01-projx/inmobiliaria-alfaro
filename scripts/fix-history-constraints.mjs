import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("ERROR: Falta configurar DATABASE_URL.");
  process.exit(1);
}

const pool = mysql.createPool(databaseUrl);

const statements = [
  "ALTER TABLE inm_asignaciones_posicion DROP INDEX uq_inm_posicion_activa",
  "ALTER TABLE inm_liberaciones DROP INDEX uq_inm_liberacion_pendiente",
];

try {
  console.log("Corrigiendo restricciones de historial...");
  for (const statement of statements) {
    try {
      await pool.query(statement);
      console.log(`OK: ${statement}`);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : "";
      if (code === "ER_CANT_DROP_FIELD_OR_KEY") {
        console.log(`Omitido (el índice ya no existe): ${statement}`);
      } else {
        throw error;
      }
    }
  }
  console.log("Corrección completada.");
} finally {
  await pool.end();
}
