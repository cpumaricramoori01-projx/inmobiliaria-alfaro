"use client";

import { useState } from "react";
import Link from "next/link";

type Inmueble = {
  id: string;
  posicion: string;
  nombre: string;
  estado: string;
  ubicacion: string;
  tipo: string;
};

type Liberacion = {
  motivo: string;
  detalle: string;
  registrada: boolean;
  confirmada: boolean;
};

const iniciales: Inmueble[] = [
  { id: "INM-00027", posicion: "27", nombre: "Departamento Los Pinos", estado: "Publicado", ubicacion: "Nuevo Chimbote", tipo: "Departamento" },
  { id: "INM-00041", posicion: "41", nombre: "Casa Centro", estado: "En negociación", ubicacion: "Chimbote", tipo: "Casa" },
];

const motivos = ["Vendido", "Propietario se retiró", "Cancelación", "Otro motivo"];

export default function Page() {
  const [items, setItems] = useState(iniciales);
  const [liberaciones, setLiberaciones] = useState<Record<string, Liberacion>>({});
  const [mensaje, setMensaje] = useState("");

  function actualizar(id: string, cambios: Partial<Liberacion>) {
    setLiberaciones((actuales) => ({
      ...actuales,
      [id]: {
        motivo: actuales[id]?.motivo ?? motivos[0],
        detalle: actuales[id]?.detalle ?? "",
        registrada: actuales[id]?.registrada ?? false,
        confirmada: actuales[id]?.confirmada ?? false,
        ...cambios,
      },
    }));
  }

  function registrarLiberacion(item: Inmueble) {
    const actual = liberaciones[item.id] ?? { motivo: motivos[0], detalle: "", registrada: false, confirmada: false };
    if (actual.motivo === "Otro motivo" && !actual.detalle.trim()) {
      setMensaje("Para “Otro motivo” debes indicar una explicación.");
      return;
    }
    actualizar(item.id, { registrada: true, confirmada: false });
    setMensaje("Solicitud de liberación registrada para " + item.id + ". La posición " + item.posicion + " todavía NO queda disponible.");
    setTimeout(() => setMensaje(""), 4500);
  }

  function confirmarLiberacion(item: Inmueble) {
    const actual = liberaciones[item.id];
    if (!actual?.registrada) return;
    actualizar(item.id, { confirmada: true });
    setItems((actuales) => actuales.filter((x) => x.id !== item.id));
    setMensaje("Liberación confirmada. La posición " + item.posicion + " ya puede reutilizarse y " + item.id + " pasa al histórico.");
    setTimeout(() => setMensaje(""), 5000);
  }

  function cancelarSolicitud(item: Inmueble) {
    actualizar(item.id, { registrada: false, confirmada: false });
    setMensaje("La solicitud de liberación de " + item.id + " fue anulada. El inmueble continúa activo.");
    setTimeout(() => setMensaje(""), 4000);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 6h10v12H9M13 12H3m0 0 4-4m-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-500">Fase 1 · Cierre</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Liberar inmueble</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Registra primero la salida y confirma después. La posición solo queda disponible al confirmar la liberación.</p>
            </div>
          </div>
          <Link href="/cartera" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">Ver cartera</Link>
        </header>

        {mensaje && <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{mensaje}</div>}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Activos en esta vista</p><p className="mt-2 text-2xl font-bold text-slate-900">{items.length}</p><p className="mt-1 text-xs leading-5 text-slate-500">Inmuebles que todavía ocupan una posición.</p></div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-amber-600">En espera de confirmación</p><p className="mt-2 text-2xl font-bold text-slate-900">{Object.values(liberaciones).filter((x) => x.registrada && !x.confirmada).length}</p><p className="mt-1 text-xs leading-5 text-slate-500">Aún no liberan la posición.</p></div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Después de confirmar</p><p className="mt-2 text-sm font-bold text-slate-900">Histórico + posición disponible</p><p className="mt-1 text-xs leading-5 text-slate-500">El inmueble no vuelve a ser activo.</p></div>
        </section>

        <section className="mt-7">
          <div className="mb-4"><h2 className="text-base font-bold text-slate-900">Inmuebles activos</h2><p className="mt-1 text-sm text-slate-500">Selecciona el motivo, registra la liberación y realiza la confirmación final.</p></div>

          <div className="space-y-4">
            {items.map((item) => {
              const actual = liberaciones[item.id] ?? { motivo: motivos[0], detalle: "", registrada: false, confirmada: false };
              const esperandoConfirmacion = actual.registrada && !actual.confirmada;
              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-sm font-bold text-rose-700">{item.posicion}</div>
                        <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.id}</p><h3 className="font-bold text-slate-900">{item.nombre}</h3><p className="mt-1 text-xs text-slate-500">{item.ubicacion} · {item.tipo}</p><span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Estado: {item.estado}</span></div>
                      </div>
                      <span className={esperandoConfirmacion ? "rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700" : "rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700"}>{esperandoConfirmacion ? "Liberación registrada" : "Activo"}</span>
                    </div>

                    <div className="grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-[1fr_1fr]">
                      <div><label className="mb-2 block text-xs font-semibold text-slate-600">Motivo de liberación</label><select disabled={esperandoConfirmacion} value={actual.motivo} onChange={(e) => actualizar(item.id, { motivo: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-50">{motivos.map((opcion) => <option key={opcion}>{opcion}</option>)}</select></div>
                      <div><label className="mb-2 block text-xs font-semibold text-slate-600">Observación / explicación {actual.motivo === "Otro motivo" && <span className="text-rose-500">*</span>}</label><input disabled={esperandoConfirmacion} value={actual.detalle} onChange={(e) => actualizar(item.id, { detalle: e.target.value })} placeholder={actual.motivo === "Otro motivo" ? "Indica el motivo..." : "Observación opcional"} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-50" /></div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="text-xs font-bold text-slate-700">{esperandoConfirmacion ? "Paso 2 de 2 · Confirmación final" : "Paso 1 de 2 · Registrar liberación"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{esperandoConfirmacion ? "Confirma solo si la salida corresponde. Hasta este momento la posición sigue ocupada." : "Al registrar, se guarda la intención de salida pero el inmueble continúa activo."}</p></div>
                      <div className="flex gap-2">{esperandoConfirmacion ? <><button onClick={() => cancelarSolicitud(item)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Anular</button><button onClick={() => confirmarLiberacion(item)} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Confirmar liberación</button></> : <button onClick={() => registrarLiberacion(item)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Registrar liberación</button>}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {items.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</div><h3 className="mt-4 font-bold text-slate-900">No hay inmuebles pendientes de liberar</h3><p className="mt-1 text-sm text-slate-500">Todos los registros de esta vista continúan activos o ya fueron enviados al histórico.</p><Link href="/cartera" className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Revisar cartera</Link></div>}
        </section>

        <section className="mt-7 rounded-2xl border border-rose-100 bg-rose-50/70 p-5"><p className="text-sm font-bold text-slate-900">Regla del flujo</p><p className="mt-1 text-sm leading-6 text-slate-600"><strong>Registrar liberación ≠ liberar posición.</strong> Solo la confirmación final mueve el inmueble al histórico y hace reutilizable su posición. El registro anterior se conserva.</p></section>
      </div>
    </main>
  );
}
