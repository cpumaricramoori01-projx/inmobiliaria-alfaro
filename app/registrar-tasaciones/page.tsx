"use client";

import { useState } from "react";
import Link from "next/link";

type Tasacion = {
  id: string;
  posicion: string;
  nombre: string;
  ubicacion: string;
  tipo: string;
  propietario: string;
  dni: string;
};

const iniciales: Tasacion[] = [
  { id: "INM-0058", posicion: "58", nombre: "Departamento Nuevo Chimbote", ubicacion: "Nuevo Chimbote", tipo: "Departamento", propietario: "Carlos Mendoza", dni: "43678125" },
  { id: "INM-0055", posicion: "55", nombre: "Terreno Los Álamos", ubicacion: "Chimbote", tipo: "Terreno", propietario: "Ana Torres", dni: "41756289" },
];

const situaciones = ["Pendiente de aprobación", "En negociación", "Aprobado", "Rechazado"];

export default function Page() {
  const [items, setItems] = useState(iniciales);
  const [situacionesActuales, setSituacionesActuales] = useState<Record<string, string>>({});
  const [fechas, setFechas] = useState<Record<string, string>>({});
  const [valores, setValores] = useState<Record<string, string>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const hoy = new Date().toISOString().slice(0, 10);
  const usuarioActual = "Usuario actual";

  const registrar = (item: Tasacion) => {
    setError("");

    if (!fechas[item.id]) {
      setError(`Registra la fecha de la tasación de “${item.nombre}”.`);
      return;
    }

    if (!situacionesActuales[item.id]) {
      setError(`Selecciona la situación frente al propietario para “${item.nombre}”.`);
      return;
    }

    setItems((actuales) => actuales.filter((actual) => actual.id !== item.id));
    setMensaje(
      `Tasación de “${item.nombre}” registrada. Se conserva como única tasación vigente y el estado actual es “${situacionesActuales[item.id]}”.`
    );
    window.setTimeout(() => setMensaje(""), 5000);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-5 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-orange-500">Fase 1 · Gestión comercial</p>
            <div className="mt-2 flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-5h6v5M8 9h.01M12 9h.01M16 9h.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950">Registrar tasaciones realizadas</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Registra la tasación vigente del inmueble y la situación actual frente al propietario. Si posteriormente cambia el resultado, se actualiza esta misma tasación.
                </p>
              </div>
            </div>
          </div>
          <Link href="/tasaciones-textos-pendientes" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            Ver tasaciones y textos pendientes
          </Link>
        </div>

        {mensaje && <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{mensaje}</div>}
        {error && <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</div>}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Por registrar</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{items.length}</p>
            <p className="mt-1 text-xs text-slate-500">inmuebles con tasación pendiente</p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Tasación</p>
            <p className="mt-2 text-lg font-bold text-orange-950">Una vigente</p>
            <p className="mt-1 text-xs text-orange-700/80">la nueva actualización reemplaza la anterior</p>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Trazabilidad</p>
            <p className="mt-2 text-lg font-bold text-cyan-950">{usuarioActual}</p>
            <p className="mt-1 text-xs text-cyan-700/80">usuario y fecha quedan registrados</p>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Tasaciones por registrar</h2>
              <p className="mt-1 text-sm text-slate-500">Completa la fecha, valor si corresponde, situación y observación.</p>
            </div>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{items.length} pendientes</span>
          </div>

          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="p-5 lg:p-6">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-base font-bold text-orange-700">{item.posicion}</div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{item.nombre}</h3>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{item.tipo}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{item.ubicacion} · {item.id}</p>
                            <p className="mt-1 text-xs text-slate-500">Propietario: {item.propietario} · DNI {item.dni}</p>
                          </div>
                        </div>
                        <span className="self-start rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">Tasación pendiente</span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="text-xs font-semibold text-slate-600">
                          Fecha de tasación *
                          <input type="date" max={hoy} value={fechas[item.id] ?? ""} onChange={(e) => setFechas((a) => ({ ...a, [item.id]: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100" />
                        </label>

                        <label className="text-xs font-semibold text-slate-600">
                          Valor / precio referencial (opcional)
                          <input type="text" inputMode="decimal" value={valores[item.id] ?? ""} onChange={(e) => setValores((a) => ({ ...a, [item.id]: e.target.value }))} placeholder="Ej.: S/ 320,000" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100" />
                        </label>

                        <label className="text-xs font-semibold text-slate-600">
                          Situación frente al propietario *
                          <select value={situacionesActuales[item.id] ?? ""} onChange={(e) => setSituacionesActuales((a) => ({ ...a, [item.id]: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100">
                            <option value="">Seleccionar situación</option>
                            {situaciones.map((situacion) => <option key={situacion}>{situacion}</option>)}
                          </select>
                        </label>
                      </div>

                      <label className="text-xs font-semibold text-slate-600">
                        Observación de la tasación (opcional)
                        <textarea rows={3} value={observaciones[item.id] ?? ""} onChange={(e) => setObservaciones((a) => ({ ...a, [item.id]: e.target.value }))} placeholder="Ej.: precio conversado, ajustes solicitados, condición de negociación o motivo del rechazo..." className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100" />
                      </label>

                      <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Al registrar</p>
                          <p className="mt-1 text-xs text-slate-500">Se guarda la tasación vigente, usuario, fecha y situación. No se conservan versiones anteriores de la tasación.</p>
                        </div>
                        <button type="button" onClick={() => registrar(item)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">✓</span>
                          Registrar tasación
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">✓</div>
              <h3 className="mt-4 font-bold text-emerald-950">Todas las tasaciones están registradas</h3>
              <p className="mt-1 text-sm text-emerald-800/80">La siguiente gestión es aprobación, negociación o preparación del texto de publicación.</p>
              <Link href="/tasaciones-textos-pendientes" className="mt-5 inline-flex rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Continuar con tasaciones y textos</Link>
            </div>
          )}
        </section>

        <section className="mt-7 rounded-2xl border border-orange-100 bg-orange-50/70 p-5">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600">i</span>
            <div>
              <p className="text-sm font-bold text-slate-900">Regla de tasación vigente</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                El sistema manejará una sola tasación vigente por inmueble. Si se modifica el precio o resultado, se actualiza el registro actual; no se crea un historial de intentos de tasación.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
