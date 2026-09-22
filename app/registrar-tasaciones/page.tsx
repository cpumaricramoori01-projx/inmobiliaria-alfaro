"use client";

import { useState } from "react";
import Link from "next/link";

type Tasacion = {
  posicion: string;
  nombre: string;
  ubicacion: string;
  tipo: string;
};

const iniciales: Tasacion[] = [
  {
    posicion: "58",
    nombre: "Departamento Nuevo Chimbote",
    ubicacion: "Nuevo Chimbote",
    tipo: "Departamento",
  },
  {
    posicion: "55",
    nombre: "Terreno Los Álamos",
    ubicacion: "Chimbote",
    tipo: "Terreno",
  },
];

export default function Page() {
  const [items, setItems] = useState(iniciales);
  const [estados, setEstados] = useState<Record<string, string>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState("");

  const registrar = (posicion: string, nombre: string) => {
    setItems((actuales) => actuales.filter((item) => item.posicion !== posicion));
    setMensaje(
      `Tasación de “${nombre}” registrada correctamente. El siguiente paso es gestionar la aprobación y preparar el texto de publicación.`
    );
    setTimeout(() => setMensaje(""), 4500);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">
              Fase 1 · Gestión comercial
            </p>
            <div className="mt-2 flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-5h6v5M8 9h.01M12 9h.01M16 9h.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Registrar tasaciones realizadas
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Registra la tasación realizada, su situación frente al propietario y las observaciones necesarias para continuar hacia el texto y la publicación.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/tasaciones-textos-pendientes"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Ver pendientes
          </Link>
        </div>

        {mensaje && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {mensaje}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Por registrar</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{items.length}</p>
            <p className="mt-1 text-xs text-slate-500">Tasaciones pendientes de cierre</p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Siguiente paso</p>
            <p className="mt-2 text-sm font-bold text-slate-900">Aprobación del propietario</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Luego se prepara el texto para publicación.</p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">Fase 2</p>
            <p className="mt-2 text-sm font-bold text-slate-900">Completar datos</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">La información documental puede completarse después.</p>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Tasaciones por registrar</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cierra cada tasación y deja registrada la observación comercial.
              </p>
            </div>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
              {items.length} pendientes
            </span>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.posicion}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="flex items-center gap-4 lg:min-w-[320px] lg:flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-700">
                      {item.posicion}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.nombre}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{item.ubicacion}</span>
                        <span className="text-slate-300">•</span>
                        <span>{item.tipo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[440px]">
                    <label className="text-xs font-semibold text-slate-600">
                      Situación
                      <select
                        value={estados[item.posicion] ?? "Pendiente de aprobación"}
                        onChange={(event) =>
                          setEstados((actuales) => ({
                            ...actuales,
                            [item.posicion]: event.target.value,
                          }))
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                      >
                        <option>Pendiente de aprobación</option>
                        <option>Aprobada por propietario</option>
                      </select>
                    </label>

                    <div className="flex items-end">
                      <button
                        onClick={() => registrar(item.posicion, item.nombre)}
                        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Registrar tasación
                      </button>
                    </div>
                  </div>
                </div>

                <label className="mt-4 block text-xs font-semibold text-slate-600">
                  Observación opcional
                  <textarea
                    rows={2}
                    value={observaciones[item.posicion] ?? ""}
                    onChange={(event) =>
                      setObservaciones((actuales) => ({
                        ...actuales,
                        [item.posicion]: event.target.value,
                      }))
                    }
                    placeholder="Ej.: precio coordinado, pendiente de confirmación, referencia del mercado..."
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </article>
            ))}
          </div>

          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-slate-900">Todas las tasaciones están registradas</h3>
              <p className="mt-1 text-sm text-slate-500">
                Puedes revisar los pendientes para continuar con aprobación y textos.
              </p>
              <Link
                href="/tasaciones-textos-pendientes"
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Ver siguiente etapa
              </Link>
            </div>
          )}
        </section>

        <section className="mt-7 rounded-2xl border border-orange-100 bg-orange-50/70 p-5">
          <div className="flex gap-3">
            <div className="mt-0.5 text-orange-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 8v4l2.5 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Flujo de esta etapa</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Tasación realizada → aprobación del propietario → texto de publicación → publicación en redes y colocación del aviso.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
