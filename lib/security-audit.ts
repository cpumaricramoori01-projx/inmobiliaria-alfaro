import 'server-only';
import { db } from '@/lib/db';
import { securityAudit } from '@/db/schema';
export function auditValues(actorId: number | null, action: string, resource: string, outcome = 'success') {
  return { actorId, action, resource, outcome };
}
export async function audit(actorId: number | null, action: string, resource: string, outcome = 'success') {
  await db.insert(securityAudit).values(auditValues(actorId, action, resource, outcome));
}
