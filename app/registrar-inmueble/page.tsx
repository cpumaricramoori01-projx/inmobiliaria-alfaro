"use client";

import { useState } from "react";
import Link from "next/link";

const posiciones = Array.from({ length: 90 }, (_, i) => i + 1).filter((n) => ![1, 27, 39, 45, 54].includes(n));

export default function RegistrarInmueblePage() {
  const [posicion, setPosicion] = useState("");
  const [tipo, setTipo] = useState("");
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [guardado, setGuardado] = useState(false);

  function registrar() {
    if (!posicion || !tipo || !nombre.trim()) return;
    setGuardado(true);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-600">Fase 1 · Nuevo registro</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Registrar inmueble</h1>
            <p className="mt-2 text-sm text-slate-500">Registra lo indispensable para incorporar el inmueble a la cartera.</p>
          </div>
          <Link href="/cartera" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Volver a cartera</Link>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><span className="text-xl font-bold">+</span></span>
                <div><h2 className="font-bold text-slate-900">Datos iniciales</h2><p className="mt-0.5 text-xs text-slate-500">La ficha detallada se completa posteriormente.</p></div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Posición en cartera <span className="text-rose-500">*</span></label>
                <select value={posicion} onChange={(e) => setPosicion(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                  <option value="">Seleccionar posición disponible</option>
                  {posiciones.map((n) => <option key={n} value={n}>{String(n).padStart(2, "0")} · Disponible</option>)}
                </select>
                <p className="mt-1.5 text-xs text-slate-400">Solo se muestran posiciones libres de la cartera.</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div><label className="mb-2 block text-sm font-semibold text-slate-700">Tipo de inmueble <span className="text-rose-500">*</span></label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"><option value="">Seleccionar tipo</option><option>Casa</option><option>Departamento</option><option>Terreno</option><option>Local</option><option>Oficina</option><option>Otros</option></select></div>
                <div><label className="mb-2 block text-sm font-semibold text-slate-700">Nombre o referencia <span className="text-rose-500">*</span></label><input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Casa Los Pinos" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"/></div>
              </div>

              <div><label className="mb-2 block text-sm font-semibold text-slate-700">Ubicación <span className="text-slate-400">(opcional)</span></label><input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej. Chimbote · Urbanización Buenos Aires" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"/></div>

              <div className="rounded-xl bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-800">Después del registro</p><p className="mt-1 text-xs leading-5 text-amber-700">El inmueble ingresará automáticamente como <strong>Visita pendiente</strong>. Los datos detallados de la Fase 2 pueden completarse más adelante.</p></div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Link href="/cartera" className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</Link>
                <button onClick={registrar} disabled={!posicion || !tipo || !nombre.trim()} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200">Registrar inmueble</button>
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Flujo inicial</p>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-600">1</span><div><p className="text-sm font-semibold text-slate-800">Registrar</p><p className="mt-0.5 text-xs text-slate-500">Posición + datos mínimos.</p></div></div>
              <div className="ml-4 h-5 border-l border-dashed border-slate-200"/>
              <div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-bold text-amber-600">2</span><div><p className="text-sm font-semibold text-slate-800">Visita pendiente</p><p className="mt-0.5 text-xs text-slate-500">Aparecerá en la bandeja de visitas.</p></div></div>
              <div className="ml-4 h-5 border-l border-dashed border-slate-200"/>
              <div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-600">3</span><div><p className="text-sm font-semibold text-slate-800">Completar información</p><p className="mt-0.5 text-xs text-slate-500">La Fase 2 puede hacerse después.</p></div></div>
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-700">Capacidad actual</p><p className="mt-1 text-lg font-bold text-slate-950">42 <span className="text-sm font-medium text-slate-400">/ 90 ocupadas</span></p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[47%] rounded-full bg-emerald-500"/></div><p className="mt-2 text-[11px] text-slate-400">48 posiciones disponibles.</p></div>
          </aside>
        </div>

        {guardado && <div className="fixed bottom-5 right-5 max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl"><p className="text-sm font-bold text-emerald-700">Registro preparado correctamente</p><p className="mt-1 text-xs text-slate-500">En la versión con base de datos, la posición {String(posicion).padStart(2, "0")} pasará a estado ocupado y el inmueble quedará como visita pendiente.</p></div>}
      </div>
    </main>
  );
}
