"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type VisitaPendiente = {
  posicion: string;
  nombre: string;
  ubicacion: string;
  espera: string;
  dias: number;
  tipo: string;
};

const items: VisitaPendiente[] = [
  { posicion: "54", nombre: "Terreno Los Pinos", ubicacion: "Chimbote", espera: "Registrado recientemente", dias: 0, tipo: "Terreno" },
  { posicion: "63", nombre: "Casa Villa María", ubicacion: "Nuevo Chimbote", espera: "Pendiente desde ayer", dias: 1, tipo: "Casa" },
  { posicion: "68", nombre: "Departamento El Carmen", ubicacion: "Chimbote", espera: "Nuevo registro", dias: 0, tipo: "Departamento" },
];

export default function Page() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todas");

  const filtrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return items.filter((item) => {
      const coincideTexto =
        !texto ||
        item.nombre.toLowerCase().includes(texto) ||
        item.ubicacion.toLowerCase().includes(texto) ||
        item.posicion.includes(texto);

      const coincideFiltro =
        filtro === "Todas" ||
        (filtro === "Hoy" && item.dias === 0) ||
        (filtro === "Más de 1 día" && item.dias > 0);

      return coincideTexto && coincideFiltro;
    });
  }, [busqueda, filtro]);

  return (
    <main className="min-h-screen bg-slate-50 p-5 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="8.5" />
                </svg>
              </span>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Fase 1 · Cuello de botella</p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Visitas pendientes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Controla los inmuebles que ya fueron registrados y todavía necesitan visita y fotografías.
            </p>
          </div>

          <Link
            href="/registrar-visitas"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Registrar visita realizada
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pendientes</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{items.length}</p>
            <p className="mt-1 text-xs text-slate-500">requieren atención</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Nuevos</p>
            <p className="mt-2 text-3xl font-bold text-amber-900">{items.filter((x) => x.dias === 0).length}</p>
            <p className="mt-1 text-xs text-amber-700/80">recién registrados</p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Siguiente paso</p>
            <p className="mt-2 text-lg font-bold text-violet-950">Visita + fotos</p>
            <p className="mt-1 text-xs text-violet-700/80">antes de la tasación</p>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Inmuebles por visitar</h2>
              <p className="mt-1 text-xs text-slate-500">{filtrados.length} resultado{filtrados.length === 1 ? "" : "s"}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" strokeLinecap="round" />
                </svg>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar inmueble..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:w-56"
                />
              </div>
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option>Todas</option>
                <option>Hoy</option>
                <option>Más de 1 día</option>
              </select>
            </div>
          </div>

          {filtrados.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filtrados.map((item) => (
                <div key={item.posicion} className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-bold text-amber-700">
                    {item.posicion}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{item.nombre}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{item.tipo}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.ubicacion} · {item.espera}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/registrar-visitas"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Ver / registrar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">✓</div>
              <p className="mt-3 font-semibold text-slate-900">No hay resultados</p>
              <p className="mt-1 text-sm text-slate-500">Prueba con otro criterio de búsqueda.</p>
            </div>
          )}
        </section>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <span className="mt-0.5 text-amber-700">●</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">¿Por qué este módulo es importante?</p>
            <p className="mt-1 text-xs leading-5 text-amber-800/80">
              Cada nuevo inmueble entra automáticamente a este flujo. Registrar la visita libera el siguiente paso: tasación y preparación del texto de publicación.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
