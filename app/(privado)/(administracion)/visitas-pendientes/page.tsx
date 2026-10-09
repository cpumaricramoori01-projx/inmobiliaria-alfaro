"use client";

import { propertyDisplayId } from "@/lib/property-display-id";

import PageHeading from "@/app/components/PageHeading";


import { Feedback, LoadingCards } from "@/app/components/InterfaceFeedback";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type VisitaPendiente = {
  vencida?:boolean;responsable?:string|null;fechaLimite?:string|null;dni:string;id: number; codigo: string; posicion: string; nombre: string; ubicacion: string; dias: number; tipo: string; propietario: string;
};

export default function Page() {
  const [items, setItems] = useState<VisitaPendiente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/visitas", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "No se pudieron cargar las visitas.");
        return body;
      })
      .then((body) => setItems(body.items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar las visitas."))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    return items.filter((item) => {
      const coincideTexto = !texto || item.codigo.toLowerCase().includes(texto) || item.nombre.toLowerCase().includes(texto) || item.ubicacion.toLowerCase().includes(texto) || item.posicion.includes(texto) || item.propietario.toLowerCase().includes(texto) || item.dni?.includes(texto);
      const coincideFiltro = filtro === "Todas" || (filtro === "Hoy" && item.dias === 0) || (filtro === "1-2 días" && item.dias >= 1 && item.dias <= 2) || (filtro === "Más de 2 días" && item.dias > 2);
      return coincideTexto && coincideFiltro;
    });
  }, [busqueda, filtro, items]);

  return (
    <main className="min-h-screen bg-[#f7f7f5] p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <PageHeading href="/visitas-pendientes" />
          <Link href="/registrar-visitas" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c80000] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#a90000]">Registrar visita realizada →</Link>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-[0_14px_40px_rgba(15,23,42,0.10)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Bandeja de trabajo</p><p className="mt-1 text-sm font-semibold">Primero atiende las visitas con mayor antigüedad.</p></div><span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-200">{items.filter(x => x.vencida).length} requieren atención</span></div></section>

        {error && <Feedback tone="error" className="mt-6">{error}</Feedback>}
        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pendientes</p><p className="mt-2 text-3xl font-bold text-amber-950">{items.length}</p><p className="mt-1 text-xs text-amber-800/70">procesos reales</p></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Requieren atención</p><p className="mt-2 text-3xl font-bold text-amber-950">{items.filter((x) => x.vencida).length}</p><p className="mt-1 text-xs text-amber-800/70">plazo de seguimiento vencido</p></div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Al completar</p><p className="mt-2 text-lg font-bold text-blue-950">Tasación pendiente</p><p className="mt-1 text-xs text-blue-700/80">transición automática</p></div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-bold text-slate-900">Visitas Pendientes</h2><p className="mt-1 text-xs text-slate-500">{filtrados.length} resultado{filtrados.length === 1 ? "" : "s"}</p></div><div className="flex flex-col gap-2 sm:flex-row"><input aria-label="Buscar inmueble, DNI o posición" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar inmueble, DNI, posición..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400 focus:bg-white sm:w-64" /><select aria-label="Filtrar antigüedad de visitas" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none"><option>Todas</option><option>Hoy</option><option>1-2 días</option><option>Más de 2 días</option></select></div></div>
          {cargando ? <LoadingCards label="Cargando visitas pendientes…" /> : filtrados.length > 0 ? <div className="divide-y divide-slate-100">{filtrados.map((item) => <div key={item.id} className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 hover:border-slate-300/70 sm:flex-row sm:items-center"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-bold text-amber-700">{item.posicion}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{item.nombre}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{item.tipo}</span></div><p className="mt-1 text-xs text-slate-500">{propertyDisplayId(item)} · {item.ubicacion} · Propietario: {item.propietario}</p><p className="mt-2 text-xs text-slate-600">Responsable: {item.responsable??"Sin asignar"}{item.fechaLimite?` · Fecha límite: ${item.fechaLimite}`:""}</p><p className={item.dias > 2 ? "mt-2 text-xs font-semibold text-amber-600" : "mt-2 text-xs font-semibold text-amber-600"}>{item.dias === 0 ? "Registrado hoy" : "Pendiente desde hace " + item.dias + " día" + (item.dias === 1 ? "" : "s")}</p></div><Link href={`/registrar-visitas?inmueble=${item.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Registrar visita</Link></div>)}</div> : <div className="px-5 py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">✓</div><p className="mt-3 font-semibold text-slate-900">{error?"No se pudo consultar la bandeja":items.length?"No hay resultados con estos filtros":"No hay visitas pendientes"}</p><p className="mt-1 text-sm text-slate-500">{error?"Vuelve a cargar la pantalla para consultar las visitas.":items.length?"Prueba otra búsqueda o cambia el filtro.":"La bandeja está sincronizada con la base de datos."}</p></div>}
        </section>
      </div>
    </main>
  );
}
