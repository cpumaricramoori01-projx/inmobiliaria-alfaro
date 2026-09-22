import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

function loadDatabaseUrl() {
  const envPath = path.resolve(".env.local");

  if (!fs.existsSync(envPath)) {
    throw new Error("No existe .env.local en la raíz del proyecto.");
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const line = lines.find((item) => /^\s*DATABASE_URL\s*=/.test(item));

  if (!line) {
    throw new Error("No se encontró DATABASE_URL en .env.local.");
  }

  const raw = line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim();
  const value = raw.replace(/^\"(.*)\"$/, "$1").replace(/^'(.*)'$/, "$1");

  if (!value.startsWith("mysql://")) {
    throw new Error("DATABASE_URL no parece una URL MySQL válida.");
  }

  return value;
}

function cleanSql(sql) {
  return sql
    .replace(/^\s*--.*$/gm, "")
    .replace(/^[ \t]*\r?\n/gm, "")
    .trim();
}

function getStatementTableName(statement) {
  const match = statement.match(/^CREATE TABLE(?: IF NOT EXISTS)?\s+([\w]+)/i);
  return match?.[1] ?? null;
}

const sqlPath = path.resolve("db/schema.sql");
const sql = fs.readFileSync(sqlPath, "utf8");
const statements = cleanSql(sql)
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

let connection;

try {
  const databaseUrl = loadDatabaseUrl();

  console.log("Conectando a la base de datos configurada en DATABASE_URL...");

  connection = await mysql.createConnection(databaseUrl);

  const [databaseRows] = await connection.query(
    "SELECT DATABASE() AS database_name"
  );
  console.log(
    `Base de datos: ${databaseRows[0]?.database_name ?? "desconocida"}`
  );

  const [existingRows] = await connection.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE 'inm_%' ORDER BY table_name"
  );

  const existingTables = new Set(existingRows.map((row) => row.table_name));

  if (existingTables.size > 0) {
    console.log("\nSe encontraron tablas inm_* existentes.");
    console.log(
      "El instalador continuará solo con las tablas que todavía falten."
    );
    for (const table of existingTables) console.log(`- ${table}`);
  } else {
    console.log("\nNo se encontraron tablas inm_*. Iniciando instalación...");
  }

  for (const statement of statements) {
    const tableName = getStatementTableName(statement);

    if (tableName && existingTables.has(tableName)) {
      console.log(`Omitiendo (ya existe): ${tableName}`);
      continue;
    }

    const firstLine =
      statement.split("\n").find((line) => line.trim())?.trim() ?? "";
    console.log(`Ejecutando: ${firstLine.slice(0, 90)}`);
    await connection.query(statement);
  }

  const [createdRows] = await connection.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE 'inm_%' ORDER BY table_name"
  );

  const [positionRows] = await connection.query(
    "SELECT COUNT(*) AS total FROM inm_posiciones"
  );

  console.log("\nInstalación/verificación completada.");
  console.log(`Tablas inm_* disponibles: ${createdRows.length}`);
  console.log(`Posiciones cargadas: ${positionRows[0]?.total ?? 0}`);

  for (const row of createdRows) console.log(`- ${row.table_name}`);
} catch (error) {
  console.error("\nERROR durante la instalación:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
