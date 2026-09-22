"use client";

import { useState } from "react";
import Link from "next/link";

type Inmueble = {
  posicion: string;
  nombre: string;
  estado: string;
  ubicacion: string;
  tipo: string;
};

const iniciales: Inmueble[] = [
  { posicion: "27", nombre: "Departamento Los Pinos", estado: "Publicado", ubicacion: "Nuevo Chimbote", tipo: "Departamento" },
  { posicion: "41", nombre: "Casa Centro", estado: "Publicado", ubicacion: "Chimbote", tipo: "Casa" },
];

const motivos = ["Vendido", "Propietario se retiró", "Cancelación", "Otro motivo"];

export default function Page() {
  const [items, setItems] = useState(iniciales);
  const [motivo, setMotivo] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState("");

  const liberar = (item: Inmueble) => {
    const seleccionado = motivo[item.posicion] ?? motivos[0];
    setItems((actuales) => actuales.filter((x) => x.posicion !== item.posicion));
    setMensaje(
      `La posición ${item.posicion} fue liberada por “${seleccionado}”. El inmueble se conserva en el histórico.`
    );
    setTimeout(() => setMensaje(""), 4500);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 6h10v12H9M13 12H3m0 0 4-4m-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-500">Fase 1 · Cierre</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Liberar inmueble</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Retira un inmueble de la cartera activa sin eliminar su registro. La posición queda disponible para un nuevo inmueble y el anterior permanece en histórico.
              </p>
            </div>
          </div>

          <Link
            href="/cartera"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
          >
            Ver cartera
          </Link>
        </header>

        {mensaje && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {mensaje}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Inmuebles activos</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{items.length}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Disponibles para cierre en esta vista</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Al liberar</p>
            <p className="mt-2 text-sm font-bold text-slate-900">Posición disponible</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">El número podrá reutilizarse en un nuevo registro.</p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Histórico</p>
            <p className="mt-2 text-sm font-bold text-slate-900">Registro conservado</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">No se elimina la información del inmueble anterior.</p>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Inmuebles disponibles para liberar</h2>
            <p className="mt-1 text-sm text-slate-500">
              Registra el motivo antes de liberar la posición.
            </p>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.posicion} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-sm font-bold text-rose-700">
                      {item.posicion}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900">{item.nombre}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.ubicacion} · {item.tipo}
                      </p>
                      <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        Estado: {item.estado}
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-[430px]">
                    <select
                      value={motivo[item.posicion] ?? motivos[0]}
                      onChange={(event) =>
                        setMotivo((actual) => ({
                          ...actual,
                          [item.posicion]: event.target.value,
                        }))
                      }
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    >
                      {motivos.map((opcion) => (
                        <option key={opcion}>{opcion}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => liberar(item)}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Liberar posición
                    </button>
                  </div>
                </div>
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
              <h3 className="mt-4 font-bold text-slate-900">No hay inmuebles pendientes de liberar</h3>
              <p className="mt-1 text-sm text-slate-500">La cartera activa no tiene registros en esta vista de demostración.</p>
              <Link
                href="/cartera"
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Revisar cartera
              </Link>
            </div>
          )}
        </section>

        <section className="mt-7 rounded-2xl border border-rose-100 bg-rose-50/70 p-5">
          <div className="flex gap-3">
            <div className="mt-0.5 text-rose-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 8v4l2.5 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Importante</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Liberar no significa borrar. La posición queda libre para reutilizarse, mientras que el inmueble anterior conserva su historial para futuras consultas y reportes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
