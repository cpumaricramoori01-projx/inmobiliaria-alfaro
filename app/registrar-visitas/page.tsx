"use client";

import Link from "next/link";
import { useState } from "react";

type Visita = {
  posicion: string;
  nombre: string;
  ubicacion: string;
  tipo: string;
};

const iniciales: Visita[] = [
  { posicion: "61", nombre: "Casa Urbanización Buenos Aires", ubicacion: "Chimbote", tipo: "Casa" },
  { posicion: "64", nombre: "Terreno Los Álamos", ubicacion: "Nuevo Chimbote", tipo: "Terreno" },
];

export default function Page() {
  const [items, setItems] = useState(iniciales);
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);

  const marcarRealizada = (posicion: string, nombre: string) => {
    setItems((actuales) => actuales.filter((item) => item.posicion !== posicion));
    setMensaje(`Visita de “${nombre}” marcada como realizada.`);
    window.setTimeout(() => setMensaje(null), 3500);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-5 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                  <path d="M8 5h8M9 3h6v4H9z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m7 5-2 2v12h14V7l-2-2M8 12h8M8 16h5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Fase 1 · Registro de actividad</p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Registrar visitas realizadas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Confirma las visitas realizadas y registra una observación breve. La información detallada del inmueble puede completarse después.
            </p>
          </div>

          <Link href="/visitas-pendientes" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            ← Ver visitas pendientes
          </Link>
        </div>

        {mensaje && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">✓</span>
            {mensaje}
          </div>
        )}

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Por registrar</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{items.length}</p>
            <p className="mt-1 text-xs text-slate-500">visitas pendientes</p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Al completar</p>
            <p className="mt-2 text-lg font-bold text-violet-950">Tasación</p>
            <p className="mt-1 text-xs text-violet-700/80">siguiente etapa del flujo</p>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Información</p>
            <p className="mt-2 text-lg font-bold text-cyan-950">Fase 2</p>
            <p className="mt-1 text-xs text-cyan-700/80">puede completarse después</p>
          </div>
        </div>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Visitas por confirmar</h2>
              <p className="mt-1 text-xs text-slate-500">Marca la actividad solo cuando la visita haya sido realizada.</p>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{items.length} pendientes</span>
          </div>

          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.posicion} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="p-5 lg:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                      <div className="flex items-center gap-4 lg:min-w-72">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-base font-bold text-violet-700">
                          {item.posicion}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{item.nombre}</h3>
                          <p className="mt-1 text-xs text-slate-500">{item.ubicacion}</p>
                          <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{item.tipo}</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <label htmlFor={`obs-${item.posicion}`} className="text-xs font-semibold text-slate-600">Observación (opcional)</label>
                        <textarea
                          id={`obs-${item.posicion}`}
                          rows={3}
                          value={observaciones[item.posicion] ?? ""}
                          onChange={(e) => setObservaciones((actual) => ({ ...actual, [item.posicion]: e.target.value }))}
                          placeholder="Ej.: se realizó visita, se tomaron medidas y fotografías..."
                          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => marcarRealizada(item.posicion, item.nombre)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">✓</span>
                        Marcar realizada
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">✓</div>
              <h3 className="mt-4 font-bold text-emerald-950">Todas las visitas están registradas</h3>
              <p className="mt-1 text-sm text-emerald-800/80">El siguiente paso del flujo es gestionar la tasación.</p>
              <Link href="/tasaciones-textos-pendientes" className="mt-5 inline-flex rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
                Ver tasaciones pendientes
              </Link>
            </div>
          )}
        </section>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">i</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Nota sobre Fase 2</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Datos como propietario, DNI, medidas, documentación y otros detalles pueden completarse posteriormente sin bloquear este registro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
