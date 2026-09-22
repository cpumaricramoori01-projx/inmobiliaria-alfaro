"use client";

import { useState } from "react";

type Grupo = {
  nombre: string;
  descripcion: string;
  tono: string;
  icono: React.ReactNode;
  reportes: string[];
};

const grupos: Grupo[] = [
  {
    nombre: "Cartera",
    descripcion: "Estado actual de los inmuebles y posiciones.",
    tono: "blue",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10.5 12 4l9 6.5M5 9v11h14V9M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    reportes: ["Cartera activa", "Posiciones disponibles", "Inmuebles por etapa", "Inmuebles por estado"],
  },
  {
    nombre: "Gestión",
    descripcion: "Seguimiento del trabajo comercial realizado.",
    tono: "violet",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    reportes: ["Visitas realizadas", "Tasaciones realizadas", "Pendientes", "Listos para publicar"],
  },
  {
    nombre: "Salidas",
    descripcion: "Inmuebles que dejaron la cartera activa.",
    tono: "rose",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 6h10v12H9M13 12H3m0 0 4-4m-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    reportes: ["Vendidos", "Retirados / cancelados", "Motivos de liberación"],
  },
  {
    nombre: "Histórico",
    descripcion: "Consulta de movimientos y permanencia.",
    tono: "slate",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12a9 9 0 1 0 3-6.7M3 4v6h6M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    reportes: ["Histórico de inmuebles", "Tiempo de permanencia", "Posición ocupada"],
  },
  {
    nombre: "Flujo",
    descripcion: "Tiempos y avance entre etapas.",
    tono: "cyan",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7h16M4 12h10M4 17h16M17 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    reportes: ["Registro → visita", "Visita → tasación", "Tasación → aprobación", "Aprobación → publicación"],
  },
];

const toneClasses: Record<string, { box: string; text: string; badge: string }> = {
  blue: { box: "bg-blue-100", text: "text-blue-600", badge: "bg-blue-50 text-blue-700" },
  violet: { box: "bg-violet-100", text: "text-violet-600", badge: "bg-violet-50 text-violet-700" },
  rose: { box: "bg-rose-100", text: "text-rose-600", badge: "bg-rose-50 text-rose-700" },
  slate: { box: "bg-slate-100", text: "text-slate-600", badge: "bg-slate-100 text-slate-700" },
  cyan: { box: "bg-cyan-100", text: "text-cyan-600", badge: "bg-cyan-50 text-cyan-700" },
};

const resumen = [
  ["Cartera activa", "42", "de 90 posiciones"],
  ["Disponibles", "48", "posiciones libres"],
  ["Visitas pendientes", "6", "por atender"],
  ["Tasaciones pendientes", "4", "por atender"],
];

export default function Page() {
  const [seleccionado, setSeleccionado] = useState("Cartera activa");
  const [mensaje, setMensaje] = useState("");

  const generar = (reporte: string) => {
    setSeleccionado(reporte);
    setMensaje(`Reporte “${reporte}” seleccionado. La generación real se conectará a los datos del sistema en la siguiente etapa.`);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 19V5h14v14M8 16v-4M12 16V8M16 16v-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Fase 1 · Información</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Reportes</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Consulta la cartera, el avance comercial, las salidas y el histórico. Los reportes se podrán imprimir o exportar cuando conectemos la base de datos.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            <p className="font-bold">Vista de demostración</p>
            <p className="mt-0.5 text-xs text-indigo-600">Datos actuales de ejemplo</p>
          </div>
        </header>

        {mensaje && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {mensaje}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {resumen.map(([titulo, valor, detalle]) => (
            <div key={titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
              <p className="mt-1 text-xs text-slate-500">{detalle}</p>
            </div>
          ))}
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Reportes disponibles</h2>
            <p className="mt-1 text-sm text-slate-500">Selecciona el informe que quieras consultar.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {grupos.map((grupo) => {
              const tone = toneClasses[grupo.tono];

              return (
                <section key={grupo.nombre} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.box} ${tone.text}`}>
                      {grupo.icono}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{grupo.nombre}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{grupo.descripcion}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {grupo.reportes.map((reporte) => (
                      <button
                        key={reporte}
                        onClick={() => generar(reporte)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm transition ${
                          seleccionado === reporte
                            ? "border-indigo-200 bg-indigo-50 font-semibold text-indigo-800"
                            : "border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>{reporte}</span>
                        <span className="text-slate-400">→</span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reporte seleccionado</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{seleccionado}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Aquí se mostrará el detalle del reporte cuando se conecten los datos reales.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMensaje(`Vista previa de “${seleccionado}” preparada para la siguiente etapa.`)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Vista previa
              </button>
              <button
                onClick={() => setMensaje("La impresión y exportación se habilitarán al conectar los datos reales.")}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Imprimir / exportar
              </button>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
          <p className="text-sm font-bold text-slate-900">Siguiente evolución del módulo</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Cuando conectemos la base de datos, cada reporte podrá trabajar con filtros por fecha, estado, posición y etapa, además de generar una vista imprimible y archivos Excel o PDF según corresponda.
          </p>
        </section>
      </div>
    </main>
  );
}
