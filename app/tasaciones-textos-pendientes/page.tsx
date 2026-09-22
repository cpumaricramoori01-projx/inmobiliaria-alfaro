"use client";

import Link from "next/link";
import { useState } from "react";

type Pendiente = {
  id: string;
  posicion: string;
  nombre: string;
  estado: string;
  ubicacion: string;
  tipo: string;
  propietario: string;
};

const tasacionesIniciales: Pendiente[] = [
  { id: "INM-0039", posicion: "39", nombre: "Terreno Plaza 28 de Julio", estado: "Visita realizada", ubicacion: "Chimbote", tipo: "Terreno", propietario: "Luis García" },
  { id: "INM-0045", posicion: "45", nombre: "Terreno La Campiña", estado: "Visita realizada", ubicacion: "Chimbote", tipo: "Terreno", propietario: "Rosa Mendoza" },
];

const textosIniciales: Pendiente[] = [
  { id: "INM-0052", posicion: "52", nombre: "Casa Los Pinos", estado: "Aprobado", ubicacion: "Nuevo Chimbote", tipo: "Casa", propietario: "Pedro Salazar" },
];

const situaciones = ["Pendiente de aprobación", "En negociación", "Aprobado", "Rechazado"];

export default function Page() {
  const [tasaciones, setTasaciones] = useState(tasacionesIniciales);
  const [textos, setTextos] = useState(textosIniciales);
  const [situacionesActuales, setSituacionesActuales] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState("");
  const [texto, setTexto] = useState<Record<string, string>>({});
  const [enlacesDrive, setEnlacesDrive] = useState<Record<string, string>>({});
  const [guardados, setGuardados] = useState<Record<string, boolean>>({});

  const guardarTexto = (item: Pendiente) => {
    if (!texto[item.id]?.trim()) {
      setMensaje(`Escribe el texto de publicación de “${item.nombre}” antes de guardar.`);
      return;
    }
    if (!enlacesDrive[item.id]?.trim()) {
      setMensaje(`Agrega el enlace de Google Drive del archivo de “${item.nombre}”.`);
      return;
    }
    setGuardados((actual) => ({ ...actual, [item.id]: true }));
    setMensaje(`El texto de “${item.nombre}” quedó listo para publicar. Se guardó el texto y el enlace de Google Drive.`);
    window.setTimeout(() => setMensaje(""), 4500);
  };

  const atenderTasacion = (item: Pendiente) => {
    setTasaciones((actuales) => actuales.filter((actual) => actual.id !== item.id));
    setMensaje(`“${item.nombre}” fue enviado a Registrar tasaciones. La situación y la tasación vigente se completarán en esa etapa.`);
    window.setTimeout(() => setMensaje(""), 4500);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-5 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 5h16v14H4zM8 9h8M8 13h5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-500">Fase 1 · Seguimiento</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Tasaciones y textos pendientes</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Bandeja de trabajo para detectar el siguiente paso: tasar, gestionar la aprobación o preparar el texto de publicación.
              </p>
            </div>
          </div>
          <Link href="/cartera" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">Ver cartera</Link>
        </div>

        {mensaje && <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{mensaje}</div>}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Tasaciones pendientes</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{tasaciones.length}</p>
            <p className="mt-1 text-xs text-amber-800/70">visita completada, falta registrar tasación</p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Gestión de aprobación</p>
            <p className="mt-2 text-lg font-bold text-violet-950">4 situaciones</p>
            <p className="mt-1 text-xs text-violet-700/80">pendiente · negociación · aprobado · rechazado</p>
          </div>
          <div className="rounded-2xl border border-pink-200 bg-pink-50/70 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">Textos pendientes</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{textos.length}</p>
            <p className="mt-1 text-xs text-pink-800/70">aprobados que requieren texto + archivo</p>
          </div>
        </section>

        <div className="mt-7 grid gap-5 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><h2 className="font-bold text-slate-900">Tasaciones pendientes</h2></div>
                <p className="mt-1 text-xs text-slate-500">Estos inmuebles ya tienen visita realizada.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">{tasaciones.length}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {tasaciones.map((item) => (
                <article key={item.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700">{item.posicion}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">{item.nombre}</h3>
                      <p className="mt-1 text-xs text-slate-500">{item.ubicacion} · {item.tipo} · {item.id}</p>
                      <p className="mt-1 text-xs text-slate-500">Propietario: {item.propietario}</p>
                    </div>
                  </div>
                  <Link href="/registrar-tasaciones" onClick={() => atenderTasacion(item)} className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Registrar tasación →</Link>
                </article>
              ))}
              {tasaciones.length === 0 && <div className="px-5 py-10 text-center"><p className="font-semibold text-slate-800">No hay tasaciones pendientes</p><p className="mt-1 text-sm text-slate-500">El siguiente foco estará en aprobación o textos.</p></div>}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-400" /><h2 className="font-bold text-slate-900">Aprobación y negociación</h2></div>
              <p className="mt-1 text-xs text-slate-500">La tasación vigente permanece hasta que el propietario defina su situación.</p>
            </div>
            <div className="p-5">
              <label className="text-xs font-semibold text-slate-600">
                Situación actual (ejemplo)
                <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                  <option>Pendiente de aprobación</option>
                  {situaciones.slice(1).map((situacion) => <option key={situacion}>{situacion}</option>)}
                </select>
              </label>
              <p className="mt-3 text-xs leading-5 text-slate-500">En la integración con la BD, este bloque mostrará los inmuebles cuya tasación ya fue registrada y permitirá actualizar su situación sin crear una nueva tasación.</p>
              <Link href="/registrar-tasaciones" className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Gestionar tasaciones y situación →</Link>
            </div>
          </section>
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-pink-400" /><h2 className="font-bold text-slate-900">Textos de publicación pendientes</h2></div>
              <p className="mt-1 text-xs text-slate-500">Solo se preparan cuando la situación del propietario es <strong>Aprobado</strong>.</p>
            </div>
            <span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-700">{textos.length}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {textos.map((item) => (
              <article key={item.id} className="p-5 lg:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="flex items-start gap-4 lg:min-w-[340px] lg:flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-sm font-bold text-pink-700">{item.posicion}</div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.nombre}</h3>
                      <p className="mt-1 text-xs text-slate-500">{item.ubicacion} · {item.tipo} · {item.id}</p>
                      <p className="mt-1 text-xs text-slate-500">Propietario: {item.propietario}</p>
                      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Aprobado</span>
                    </div>
                  </div>

                  <div className="w-full lg:max-w-2xl">
                    <label className="text-xs font-semibold text-slate-600">Texto de publicación *</label>
                    <textarea rows={5} value={texto[item.id] ?? ""} onChange={(e) => { setTexto((a) => ({ ...a, [item.id]: e.target.value })); setGuardados((a) => ({ ...a, [item.id]: false })); }} placeholder="Pega aquí el texto preparado para la publicación. La aplicación no lo genera automáticamente." className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100" />
                    <label className="mt-4 block text-xs font-semibold text-slate-600">Archivo del texto en Google Drive *</label>
                    <input type="url" value={enlacesDrive[item.id] ?? ""} onChange={(e) => { setEnlacesDrive((a) => ({ ...a, [item.id]: e.target.value })); setGuardados((a) => ({ ...a, [item.id]: false })); }} placeholder="https://drive.google.com/..." className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100" />
                    <p className="mt-1 text-[11px] text-slate-400">El archivo permanece en Google Drive; por ahora la aplicación solo conserva el enlace.</p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      {guardados[item.id] ? <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">✓ Listo para publicar</span> : <span className="text-xs text-slate-400">Pendiente de guardar</span>}
                      <button type="button" onClick={() => { guardarTexto(item); setTextos((actuales) => guardados[item.id] ? actuales.filter((actual) => actual.id !== item.id) : actuales); }} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                        Guardar y dejar listo para publicar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {textos.length === 0 && <div className="px-5 py-10 text-center"><p className="font-semibold text-slate-800">No hay textos pendientes</p><p className="mt-1 text-sm text-slate-500">Los textos aprobados quedarán listos para la etapa de publicación.</p></div>}
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
          <div className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600">i</span>
            <div>
              <p className="text-sm font-bold text-slate-900">Reglas de esta bandeja</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                <li>• Una visita completada → tasación pendiente.</li>
                <li>• Una tasación vigente → pendiente de aprobación, negociación, aprobado o rechazado.</li>
                <li>• Solo un inmueble <strong>Aprobado</strong> pasa a texto de publicación.</li>
                <li>• El texto se registra manualmente; el sistema no lo genera.</li>
                <li>• El texto y su archivo se conservan mediante enlace a Google Drive.</li>
                <li>• Al guardar ambos, el inmueble queda <strong>Listo para publicar</strong>.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
