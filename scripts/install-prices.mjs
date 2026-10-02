import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";

try { loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [columns] = await connection.query("SHOW COLUMNS FROM inm_tasaciones LIKE 'precio_venta'");
  if (!columns.length) {
    await connection.query("ALTER TABLE inm_tasaciones ADD COLUMN precio_venta DECIMAL(15,2) NULL");
    console.log("Campo precio de venta agregado.");
  }
  await connection.beginTransaction();
  const [rows] = await connection.query("SELECT t.* FROM inm_tasaciones t INNER JOIN inm_inmuebles i ON i.id = t.inmueble_id WHERE i.estado = 'activo' AND t.situacion = 'aprobado' AND (t.precio_venta IS NULL OR t.precio_venta <= 0 OR t.precio_objetivo IS NULL OR t.precio_objetivo <= 0 OR t.valor_referencia IS NULL OR t.valor_referencia <= 0) FOR UPDATE");
  for (const row of rows) {
    const base = [row.precio_objetivo, row.valor_referencia, row.precio_venta].find(value => Number(value) > 0) ?? "100000.00";
    const tasacion = Number(row.valor_referencia) > 0 ? row.valor_referencia : base;
    const objetivo = Number(row.precio_objetivo) > 0 ? row.precio_objetivo : base;
    const venta = Number(row.precio_venta) > 0 ? row.precio_venta : objetivo;
    await connection.execute("UPDATE inm_tasaciones SET valor_referencia = ?, precio_objetivo = ?, precio_venta = ? WHERE id = ?", [tasacion, objetivo, venta, row.id]);
    await connection.execute("INSERT INTO inm_timeline (inmueble_id, evento, observacion, usuario_id) VALUES (?, 'precios_iniciales_simulados', ?, ?)", [row.inmueble_id, `Inicialización de precios faltantes con valores simulados. Tasación: S/ ${tasacion}; objetivo: S/ ${objetivo}; venta: S/ ${venta}. Se conservaron los precios existentes y la observación.`, row.usuario_id]);
    console.log(`Inmueble ${row.inmueble_id}: tasación ${tasacion}; objetivo ${objetivo}; venta ${venta} (faltantes simulados).`);
  }
  await connection.commit();
  console.log(`Precios inicializados: ${rows.length}.`);
} catch (error) {
  await connection.rollback();
  console.error("No se pudieron instalar los precios:", error.code || "ERROR");
  process.exitCode = 1;
} finally { await connection.end(); }
