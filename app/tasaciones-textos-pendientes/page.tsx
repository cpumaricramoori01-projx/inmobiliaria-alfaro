"use client";

import Link from "next/link";
import { useState } from "react";

type Pendiente = {
  posicion: string;
  nombre: string;
  estado: string;
  ubicacion: string;
  tipo: string;
};

const tasacionesIniciales: Pendiente[] = [
  { posicion: "39", nombre: "Terreno Plaza 28 de Julio", estado: "Visita realizada", ubicacion: "Chimbote", tipo: "Terreno" },
  { posicion: "45", nombre: "Terreno La Campiña", estado: "Visita realizada", ubicacion: "Chimbote", tipo: "Terreno" },
];

const textosIniciales: Pendiente[] = [
  { posicion: "52", nombre: "Casa Los Pinos", estado: "Tasación aprobada", ubicacion: "Nuevo Chimbote", tipo: "Casa" },
];

export default function Page() {
  const [tasaciones, setTasaciones] = useState(tasacionesIniciales);
  const [textos, setTextos] = useState(textosIniciales);
  const [mensaje, setMensaje] = useState("");

  const atenderTasacion = (nombre: string) => {
    setTasaciones((actuales) => actuales.filter((item) => item.nombre !== nombre));
    setMensaje(`“${nombre}” fue enviado al registro de tasación.`);
    setTimeout(() => setMensaje(""), 3500);
  };

  const atenderTexto = (nombre: string) => {
    setTextos((actuales) => actuales.filter((item) => item.nombre !== nombre));
    setMensaje(`“${nombre}” quedó marcado como texto atendido.`);
    setTimeout(() => setMensaje(""), 3500);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 5h16v14H4zM8 9h8M8 13h5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-500">
                Fase 1 · Seguimiento
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Tasaciones y textos pendientes
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Revisa qué inmuebles necesitan tasación y cuáles ya están aprobados y esperan su texto de publicación.
              </p>
            </div>
          </div>

          <Link
            href="/cartera"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
          >
            Ver cartera
          </Link>
        </div>

        {mensaje && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {mensaje}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Atención principal</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{tasaciones.length}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Inmuebles esperando tasación</p>
          </div>
          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Después de aprobar</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{textos.length}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Textos pendientes de preparación</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Flujo</p>
            <p className="mt-2 text-sm font-bold text-slate-900">Visita → Tasación → Texto</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Un tablero para detectar el siguiente trabajo.</p>
          </div>
        </section>

        <div className="mt-7 grid gap-5 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <h2 className="font-bold text-slate-900">Tasaciones pendientes</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Requieren estudio de mercado y coordinación del precio.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                {tasaciones.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {tasaciones.map((item) => (
                <article key={item.posicion} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700">
                      {item.posicion}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">{item.nombre}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.ubicacion} · {item.tipo} · {item.estado}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/registrar-tasaciones"
                    onClick={() => atenderTasacion(item.nombre)}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Registrar tasación →
                  </Link>
                </article>
              ))}

              {tasaciones.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <p className="font-semibold text-slate-800">No hay tasaciones pendientes</p>
                  <p className="mt-1 text-sm text-slate-500">El siguiente foco estará en los textos.</p>
                </div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-pink-400" />
                  <h2 className="font-bold text-slate-900">Textos pendientes</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Tasación aprobada; falta preparar el contenido de publicación.
                </p>
              </div>
              <span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-700">
                {textos.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {textos.map((item) => (
                <article key={item.posicion} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-sm font-bold text-pink-700">
                      {item.posicion}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">{item.nombre}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.ubicacion} · {item.tipo}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {item.estado}
                    </span>
                  </div>
                  <button
                    onClick={() => atenderTexto(item.nombre)}
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Marcar texto atendido
                  </button>
                </article>
              ))}

              {textos.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <p className="font-semibold text-slate-800">No hay textos pendientes</p>
                  <p className="mt-1 text-sm text-slate-500">No hay contenido esperando preparación.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 8v4l2.5 1.5M21 12a9 9 0 1 1-18 0Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Cómo usar este tablero</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Primero atiende las tasaciones. Cuando el propietario aprueba el precio, el inmueble pasa al grupo de textos pendientes. La información detallada de Fase 2 puede completarse en paralelo y no debe detener este flujo.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
