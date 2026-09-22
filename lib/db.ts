import "server-only";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Falta configurar DATABASE_URL en las variables de entorno.");
}

const pool = mysql.createPool(databaseUrl);

export const db = drizzle(pool, { schema, mode: "default" });
