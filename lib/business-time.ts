import { sql, type SQLWrapper } from 'drizzle-orm';

// Database-generated timestamps follow the connection's time zone; application
// Date writes already contain a UTC wall-clock value in this legacy database.
// Normalize database-generated dates without changing authentication or data.
export function databaseBusinessDay(column:SQLWrapper){
  return sql`DATE(DATE_SUB(${column}, INTERVAL (TIMESTAMPDIFF(SECOND,UTC_TIMESTAMP(),NOW()) + 18000) SECOND))`;
}
export function databaseInstant(column:SQLWrapper){
  return sql<string>`DATE_FORMAT(DATE_SUB(${column}, INTERVAL TIMESTAMPDIFF(SECOND,UTC_TIMESTAMP(),NOW()) SECOND),'%Y-%m-%dT%H:%i:%s.000Z')`;
}
