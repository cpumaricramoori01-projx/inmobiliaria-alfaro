import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const envPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");

  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) process.env[key] = value;
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("ERROR: Falta configurar DATABASE_URL.");
  console.error("Crea .env.local en el Codespace y agrega tu URL de conexión de Aiven.");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(databaseUrl);

  try {
    const [databaseRows] = await connection.query(
      "SELECT DATABASE() AS database_name, VERSION() AS server_version"
    );

    const [tables] = await connection.query(
      "SELECT TABLE_NAME AS table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE 'inm\\_%' ORDER BY table_name"
    );

    const database = databaseRows[0];
    console.log("\n=== VERIFICACIÓN DE BASE DE DATOS ===");
    console.log(`Base de datos: ${database.database_name}`);
    console.log(`Versión MySQL/MariaDB: ${database.server_version}`);
    console.log(`Tablas inmobiliarias (inm_*): ${tables.length}`);

    if (tables.length === 0) {
      console.log("Estado: OK — no se encontraron tablas inm_* todavía.");
      console.log("No se ejecutó ninguna operación de escritura.");
    } else {
      console.log("Tablas encontradas:");
      for (const row of tables) console.log(`- ${row.table_name}`);
      console.log("No se ejecutó ninguna operación de escritura.");
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("\nERROR DE CONEXIÓN/VERIFICACIÓN:");
  console.error(error.message);
  process.exit(1);
});
