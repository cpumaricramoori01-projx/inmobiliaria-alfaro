import PageHeading from "@/app/components/PageHeading";
import { desc } from 'drizzle-orm';
import { authorizeApi } from '@/lib/auth';
import { db } from '@/lib/db';
import { securityAudit } from '@/db/schema';
export default async function SecurityPage() {
  const auth=await authorizeApi();
  if(auth.response)return <p>Acceso restringido.</p>;
  const events=await db.select().from(securityAudit).orderBy(desc(securityAudit.id)).limit(100);
  return <main className="min-h-screen p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-5xl"><PageHeading href="/seguridad" /><p className="mt-2 text-sm text-slate-500">Últimos 100 eventos de acceso y cambios sensibles. Fechas en UTC.</p><div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-xs"><thead><tr>{['Fecha UTC','Usuario ID','Acción','Recurso','Resultado'].map(label=><th key={label} className="whitespace-nowrap p-3">{label}</th>)}</tr></thead><tbody>{events.map(event=><tr key={event.id} className="border-t border-slate-100"><td className="whitespace-nowrap p-3">{event.createdAt.toISOString().replace('T',' ').slice(0,19)}</td><td className="p-3">{event.actorId??'Sistema'}</td><td className="p-3">{event.action}</td><td className="p-3">{event.resource}</td><td className="p-3">{event.outcome==='success'?'Correcto':'Denegado'}</td></tr>)}</tbody></table></div></div></main>;
}
