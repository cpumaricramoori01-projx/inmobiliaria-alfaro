"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

type Seccion = { nombre: string; descripcion: string; color: string; icono: ReactNode };
const secciones: Seccion[] = [
  { nombre: "Propietario", descripcion: "DNI, nombres, teléfonos y datos de contacto.", color: "blue", icono: "◉" },
  { nombre: "Inmueble", descripcion: "Ubicación, metraje, características y referencias.", color: "emerald", icono: "⌂" },
  { nombre: "Tasación", descripcion: "Valoración, precio de referencia y situación.", color: "orange", icono: "▥" },
  { nombre: "Documentación", descripcion: "Documentos y referencias administrativas mediante Google Drive.", color: "violet", icono: "▤" },
];
const colores: Record<string, { box: string; text: string; badge: string }> = {
  blue: { box: "bg-blue-100", text: "text-blue-600", badge: "bg-blue-50 text-blue-700" },
  emerald: { box: "bg-emerald-100", text: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700" },
  orange: { box: "bg-orange-100", text: "text-orange-600", badge: "bg-orange-50 text-orange-700" },
  violet: { box: "bg-violet-100", text: "text-violet-600", badge: "bg-violet-50 text-violet-700" },
};

export default function Page() {
  const [seleccionada, setSeleccionada] = useState("Propietario");
  const [mensaje, setMensaje] = useState("");
  const [inmueble, setInmueble] = useState("INM-0027");
  const [driveLinks, setDriveLinks] = useState([""]);
  const [documentoNombre, setDocumentoNombre] = useState("");

  const seleccionar = (nombre: string) => {
    setSeleccionada(nombre);
    setMensaje("");
  };

  const agregarEnlace = () => setDriveLinks((actuales) => [...actuales, ""]);
  const actualizarEnlace = (index: number, value: string) =>
    setDriveLinks((actuales) => actuales.map((link, i) => (i === index ? value : link)));
  const quitarEnlace = (index: number) =>
    setDriveLinks((actuales) => actuales.filter((_, i) => i !== index));

  const guardarDocumento = () => {
    if (!documentoNombre.trim() || !driveLinks.some((link) => link.trim())) {
      setMensaje("Para registrar un documento se requiere nombre y enlace de Google Drive.");
      return;
    }
    setMensaje(`Documento “${documentoNombre}” preparado para ${inmueble}. En esta fase el enlace se guarda como referencia; el archivo permanece en Google Drive.`);
    setDocumentoNombre("");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 text-xl">▤</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-500">Fase 2 · Completar información</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Datos de inmuebles</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Completa la ficha del inmueble progresivamente. Esta información complementa la Fase 1 y no bloquea el flujo comercial.
              </p>
            </div>
          </div>
          <Link href="/cartera" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">Ver cartera</Link>
        </header>

        <section className="mt-7 rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="text-xs font-semibold text-slate-500">
              Inmueble a completar
              <select value={inmueble} onChange={(e) => setInmueble(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-400">
                <option>INM-0027</option><option>INM-0018</option><option>INM-0042</option>
              </select>
            </label>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <span className="font-bold text-slate-800">Fase 1:</span> registro, propietario, posición y seguimiento comercial.
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            ["Ficha progresiva", "Puedes completar datos cuando estén disponibles.", "cyan"],
            ["No bloqueante", "La Fase 1 continúa independientemente.", "emerald"],
            ["Google Drive", "Los archivos permanecen en Drive; aquí guardamos sus enlaces.", "violet"],
          ].map(([titulo, texto, color]) => (
            <div key={titulo} className={`rounded-2xl border p-5 ${color === "cyan" ? "border-cyan-100 bg-cyan-50" : color === "emerald" ? "border-emerald-100 bg-emerald-50" : "border-violet-100 bg-violet-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${color === "cyan" ? "text-cyan-600" : color === "emerald" ? "text-emerald-600" : "text-violet-600"}`}>{titulo}</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{texto}</p>
            </div>
          ))}
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Información complementaria</h2>
            <p className="mt-1 text-sm text-slate-500">Selecciona una sección. Los formularios completos se conectarán a la base de datos en la siguiente etapa.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {secciones.map((seccion) => {
              const c = colores[seccion.color];
              return (
                <button key={seccion.nombre} onClick={() => seleccionar(seccion.nombre)} className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${seleccionada === seccion.nombre ? "border-cyan-300 ring-2 ring-cyan-50" : "border-slate-200"}`}>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${c.box} ${c.text}`}>{seccion.icono}</div>
                  <h3 className="mt-4 font-bold text-slate-900">{seccion.nombre}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{seccion.descripcion}</p>
                  <span className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.badge}`}>Completable en cualquier momento</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sección seleccionada</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{seleccionada}</h2>

          {seleccionada === "Propietario" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="DNI" placeholder="Ej. 12345678" />
              <Field label="Teléfono / WhatsApp" placeholder="Ej. 999 999 999" />
              <Field label="Nombres" placeholder="Nombres del propietario" />
              <Field label="Apellidos" placeholder="Apellidos del propietario" />
              <Field label="Correo electrónico" placeholder="Opcional" />
              <Field label="Referencia de contacto" placeholder="Opcional" />
            </div>
          )}

          {seleccionada === "Inmueble" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Dirección" placeholder="Dirección del inmueble" />
              <Field label="Distrito / provincia" placeholder="Ubicación" />
              <Field label="Área de terreno (m²)" placeholder="Ej. 120" />
              <Field label="Área construida (m²)" placeholder="Ej. 95" />
              <Field label="Habitaciones" placeholder="Ej. 3" />
              <Field label="Baños" placeholder="Ej. 2" />
              <Field label="Referencia" placeholder="Referencia de ubicación" />
              <Field label="Características" placeholder="Descripción breve" />
              <Field label="Observaciones" placeholder="Información adicional" />
            </div>
          )}

          {seleccionada === "Tasación" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Fecha de tasación" type="date" />
              <Field label="Valor de referencia" placeholder="Ej. S/ 350,000" />
              <Field label="Precio acordado / objetivo" placeholder="Ej. S/ 380,000" />
              <div>
                <label className="text-xs font-semibold text-slate-500">Situación</label>
                <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><option>Pendiente de aprobación</option><option>En negociación</option><option>Aprobado</option><option>Rechazado</option></select>
              </div>
              <Field label="Observación" placeholder="Comentario de la tasación" />
            </div>
          )}

          {seleccionada === "Documentación" && (
            <div className="mt-5 space-y-5">
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-sm font-bold text-slate-900">Documentos mediante Google Drive</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  El sistema no almacena el archivo por ahora. Registra aquí el nombre y el enlace al documento que ya se encuentra en Google Drive.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre del documento" value={documentoNombre} onChange={setDocumentoNombre} placeholder="Ej. Copia de DNI / Minuta / Partida" />
                <Field label="Tipo de documento" placeholder="Ej. Legal, propiedad, identidad..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Enlaces de Google Drive</label>
                <div className="mt-2 space-y-2">
                  {driveLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <input value={link} onChange={(e) => actualizarEnlace(index, e.target.value)} placeholder="https://drive.google.com/..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400" />
                      {driveLinks.length > 1 && <button type="button" onClick={() => quitarEnlace(index)} className="rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-500 hover:bg-slate-50">Quitar</button>}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={agregarEnlace} className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100">+ Agregar otro enlace</button>
              </div>
              <button type="button" onClick={guardarDocumento} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Registrar documento</button>
            </div>
          )}

          {seleccionada !== "Documentación" && (
            <button onClick={() => setMensaje(`Sección “${seleccionada}” preparada. La persistencia real se conectará a la base de datos posteriormente.`)} className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Guardar cambios</button>
          )}
        </section>

        {mensaje && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{mensaje}</div>}

        <section className="mt-7 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-5">
          <p className="text-sm font-bold text-slate-900">Criterio de almacenamiento</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Por ahora, los documentos y evidencias se mantienen en Google Drive y el sistema registra sus enlaces. Más adelante podremos migrar el almacenamiento sin cambiar el concepto de la ficha documental.
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({ label, placeholder, type = "text", value, onChange }: { label: string; placeholder?: string; type?: string; value?: string; onChange?: (value: string) => void }) {
  return (
    <label className="text-xs font-semibold text-slate-500">
      {label}
      <input type={type} value={value} onChange={onChange ? (e) => onChange(e.target.value) : undefined} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-cyan-400" />
    </label>
  );
}
