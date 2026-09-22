"use client";

import { useState } from "react";
import Link from "next/link";

type Seccion = {
  nombre: string;
  descripcion: string;
  color: string;
  icono: React.ReactNode;
};

const secciones: Seccion[] = [
  {
    nombre: "Propietario",
    descripcion: "DNI, nombres, teléfonos y datos de contacto.",
    color: "blue",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    nombre: "Inmueble",
    descripcion: "Metraje, ubicación, características y referencias.",
    color: "emerald",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m3 10 9-6 9 6M5 9v11h14V9M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    nombre: "Tasación",
    descripcion: "Estudio de mercado, valoración y precio acordado.",
    color: "orange",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 20V10M12 20V4M18 20v-7M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    nombre: "Documentación",
    descripcion: "Minuta, documentos y referencias administrativas.",
    color: "violet",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3h8l4 4v14H7zM15 3v5h4M10 12h6M10 16h6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
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

  const seleccionar = (nombre: string) => {
    setSeleccionada(nombre);
    setMensaje(`Sección “${nombre}” seleccionada. La edición de datos se habilitará al conectar la base de datos.`);
    setTimeout(() => setMensaje(""), 3500);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 5h16v14H4zM8 9h8M8 13h5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-500">
                Fase 2 · Completar información
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Ingresar datos de inmuebles
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Completa la ficha progresivamente. La información puede incorporarse después del registro inicial y no debe detener el flujo comercial de la Fase 1.
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
          <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-700">
            {mensaje}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">Objetivo</p>
            <p className="mt-2 text-sm font-bold text-slate-900">Completar la ficha</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Agrega información conforme esté disponible.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Flexibilidad</p>
            <p className="mt-2 text-sm font-bold text-slate-900">Sin bloquear Fase 1</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">La operación comercial puede continuar.</p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Organización</p>
            <p className="mt-2 text-sm font-bold text-slate-900">Una ficha por inmueble</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">La posición identifica el registro dentro de la cartera.</p>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Información que se completa en esta fase</h2>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona una sección para preparar su futura edición.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {secciones.map((seccion) => {
              const color = colores[seccion.color];
              const activa = seleccionada === seccion.nombre;

              return (
                <button
                  key={seccion.nombre}
                  onClick={() => seleccionar(seccion.nombre)}
                  className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    activa ? "border-cyan-200 ring-2 ring-cyan-50" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color.box} ${color.text}`}>
                      {seccion.icono}
                    </div>
                    {activa && (
                      <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700">
                        Seleccionada
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900">{seccion.nombre}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{seccion.descripcion}</p>
                  <span className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${color.badge}`}>
                    Completable en cualquier momento
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sección seleccionada</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{seleccionada}</h2>
              <p className="mt-1 text-sm text-slate-500">
                El formulario detallado de esta sección se implementará junto con la estructura de datos.
              </p>
            </div>
            <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">
              Edición próximamente
            </span>
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-5">
          <div className="flex gap-3">
            <div className="mt-0.5 text-cyan-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 8v4l2.5 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Criterio de trabajo</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Primero se asegura el flujo operativo de la cartera. Los datos complementarios se van incorporando sin obligar a detener una visita, una tasación o una publicación.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
