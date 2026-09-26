"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  resumen: {
    activos: number;
    posicionesDisponibles: number;
    visitasPendientes: number;
    tasacionesPendientes: number;
    aprobaciones: number;
    negociaciones: number;
    textosPendientes: number;
    listosParaPublicar: number;
  };
  pendientes: {
    etapa: string;
    total: number;
    tone: string;
  }[];
  recientes: {
    numero: string;
    nombre: string;
    etapa: string;
    fecha: string | Date | null;
  }[];
};

const dotStyles: Record<string, string> = {
  amber: "bg-[#c80000]",
  orange: "bg-[#c80000]",
  violet: "bg-[#c80000]",
  rose: "bg-[#c80000]",
  emerald: "bg-[#c80000]",
};

function formatDate(value: string | Date | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (response) => {
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error || "No se pudo cargar el dashboard.");
        }

        return body;
      })
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el dashboard.",
        ),
      )
      .finally(() => setCargando(false));
  }, []);

  const resumen = data
    ? [
        {
          titulo: "Inmuebles activos",
          valor: data.resumen.activos,
          detalle: "de 90 posiciones",
          attention: false,
        },
        {
          titulo: "Posiciones disponibles",
          valor: data.resumen.posicionesDisponibles,
          detalle: "listas para nuevos inmuebles",
          attention: false,
        },
        {
          titulo: "Visitas pendientes",
          valor: data.resumen.visitasPendientes,
          detalle: "requieren atención",
          attention: data.resumen.visitasPendientes > 0,
        },
        {
          titulo: "Tasaciones pendientes",
          valor: data.resumen.tasacionesPendientes,
          detalle: "requieren atención",
          attention: data.resumen.tasacionesPendientes > 0,
        },
      ]
    : [];

  const metricas = data
    ? [
        {
          titulo: "Aprobaciones",
          valor: data.resumen.aprobaciones,
          detalle: "pendientes de decisión",
        },
        {
          titulo: "En negociación",
          valor: data.resumen.negociaciones,
          detalle: "con el propietario",
        },
        {
          titulo: "Textos pendientes",
          valor: data.resumen.textosPendientes,
          detalle: "requiere completar",
        },
        {
          titulo: "Listos para publicar",
          valor: data.resumen.listosParaPublicar,
          detalle: "esperando publicación",
        },
      ]
    : [];

  const actualizarCabeceraDashboard = () => {
    const ahora = new Date();
    const hora = ahora.getHours();

    let saludo = "Buenos días";
    let icono = "☀️";

    if (hora >= 12 && hora < 18) {
      saludo = "Buenas tardes";
      icono = "🌤️";
    } else if (hora >= 18 && hora < 23) {
      saludo = "Buenas noches";
      icono = "🌅";
    } else if (hora >= 23 || hora < 5) {
      saludo = "Buenas noches";
      icono = "🌙";
    }

    const fecha = ahora.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const horaActual = ahora.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const pendientesVisita = data?.resumen.visitasPendientes ?? 0;
    const pendientesTasacion = data?.resumen.tasacionesPendientes ?? 0;
    const listosPublicar = data?.resumen.listosParaPublicar ?? 0;
    const activos = data?.resumen.activos ?? 0;

    let resumen = "La cartera está al día. Puedes revisar el estado general o consultar reportes.";

    if (pendientesVisita > 0 && pendientesTasacion > 0 && listosPublicar > 0) {
      resumen = `Tienes ${pendientesVisita} visita${pendientesVisita === 1 ? "" : "s"} pendiente${pendientesVisita === 1 ? "" : "s"}, ${pendientesTasacion} tasación${pendientesTasacion === 1 ? "" : "es"} pendiente${pendientesTasacion === 1 ? "" : "s"} y ${listosPublicar} inmueble${listosPublicar === 1 ? "" : "s"} listo${listosPublicar === 1 ? "" : "s"} para publicar.`;
    } else if (pendientesVisita > 0) {
      resumen = `Tienes ${pendientesVisita} visita${pendientesVisita === 1 ? "" : "s"} pendiente${pendientesVisita === 1 ? "" : "s"} por atender en la cartera.`;
    } else if (pendientesTasacion > 0) {
      resumen = `Hay ${pendientesTasacion} tasación${pendientesTasacion === 1 ? "" : "es"} pendiente${pendientesTasacion === 1 ? "" : "s"} para continuar el proceso.`;
    } else if (listosPublicar > 0) {
      resumen = `Hay ${listosPublicar} inmueble${listosPublicar === 1 ? "" : "s"} listo${listosPublicar === 1 ? "" : "s"} para publicación.`;
    } else if (activos > 0) {
      resumen = `Tienes ${activos} inmueble${activos === 1 ? "" : "s"} activo${activos === 1 ? "" : "s"} en cartera.`;
    }

    const greeting = document.getElementById("dashboard-greeting");
    const date = document.getElementById("dashboard-date");
    const clock = document.getElementById("dashboard-clock");
    const summary = document.getElementById("dashboard-summary");
    const contextIcon = document.getElementById("dashboard-context-icon");

    if (greeting) greeting.textContent = `${saludo}, Alberto.`;
    if (date) date.textContent = fecha;
    if (clock) clock.textContent = horaActual;
    if (summary) summary.textContent = resumen;
    if (contextIcon) contextIcon.textContent = icono;
  };

  useEffect(() => {
    actualizarCabeceraDashboard();
    const intervalo = window.setInterval(actualizarCabeceraDashboard, 60000);

    return () => window.clearInterval(intervalo);
  }, [data]);

  return (
    <main className="min-h-screen bg-[#f7f7f5] p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
      {/* Encabezado */}
      <header className="sticky top-0 z-20 border-b border-[#e7e5e2] bg-[#f7f7f5]/95 backdrop-blur">
        <div className="flex min-h-[76px] items-center justify-between px-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c80000]">
              Secretaría virtual
            </p>

            <h1 className="mt-1 text-[24px] font-bold tracking-[-0.02em] text-[#171717]">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#171717]">
                Alberto Alfaro
              </p>
              <p className="mt-0.5 text-[11px] text-[#777]">
                Administrador
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7e5e2] bg-white text-[10px] font-bold text-[#c80000]">
              AA
            </div>
          </div>
        </div>
      </header>

      <div className="p-5 sm:p-6 lg:p-8">
        {/* Entrada principal */}
        <section className="relative mb-7 overflow-hidden rounded-[22px] border border-[#e7e5e2] bg-white px-6 py-7 shadow-[0_8px_30px_rgba(23,23,23,0.04)] sm:px-8 sm:py-8">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#c80000]" />

          <div className="relative max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#c80000]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
                <span id="dashboard-context-icon" className="mr-2">☀️</span>
                <span id="dashboard-context-label">Hoy · Resumen de cartera</span>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 id="dashboard-greeting" className="text-[28px] font-bold tracking-[-0.025em] text-[#171717] sm:text-[32px]">
                Buenos días, Alberto.
              </h2>

              <span id="dashboard-date" className="rounded-full border border-[#e7e5e2] bg-[#faf9f7] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777]">
                Cargando fecha...
              </span>
            </div>

            <p id="dashboard-summary" className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6b6b]">
              Aquí tienes lo importante de la cartera: qué está pendiente,
              qué avanzó y dónde puedes continuar trabajando.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777]">
              <span id="dashboard-clock">--:--</span>
              <span className="h-1 w-1 rounded-full bg-[#c80000]" />
              <span>Secretaría virtual</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <a
                href="/cartera"
                className="rounded-lg bg-[#c80000] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#a90000]"
              >
                Ver cartera →
              </a>

              <a
                href="/reportes"
                className="rounded-lg border border-[#e1dfdc] bg-white px-4 py-2.5 text-xs font-semibold text-[#444] transition hover:border-[#c80000] hover:text-[#c80000]"
              >
                Ver reportes
              </a>
            </div>
          </div>
        </section>

        {/* Estados de carga */}
        {cargando && (
          <div className="mb-6 rounded-xl border border-[#e7e5e2] bg-white px-5 py-4 text-sm text-[#777]">
            Cargando información real de la cartera...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-[#f0caca] bg-[#fff7f7] px-5 py-4 text-sm text-[#a90000]">
            {error}
          </div>
        )}

        {/* Indicadores principales */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c80000]">
                Situación actual
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-[#171717]">
                Estado de la cartera
              </h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {resumen.map((x) => (
              <div
                key={x.titulo}
                className={`rounded-xl border bg-white p-5 transition ${
                  x.attention
                    ? "border-[#ead1d1] shadow-[0_5px_20px_rgba(200,0,0,0.04)]"
                    : "border-[#e7e5e2]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777]">
                    {x.titulo}
                  </p>

                  <span
                    className={`h-2 w-2 rounded-full ${
                      x.attention ? "bg-[#c80000]" : "bg-[#b9b7b3]"
                    }`}
                  />
                </div>

                <p className="mt-4 text-[34px] font-bold leading-none tracking-[-0.03em] text-[#171717]">
                  {x.valor}
                </p>

                <p
                  className={`mt-2 text-xs ${
                    x.attention ? "text-[#a90000]" : "text-[#777]"
                  }`}
                >
                  {x.detalle}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Indicadores secundarios */}
        <section className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricas.map((x) => (
              <div
                key={x.titulo}
                className="rounded-xl border border-[#e7e5e2] bg-white px-5 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888]">
                  {x.titulo}
                </p>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-2xl font-bold tracking-tight text-[#171717]">
                    {x.valor}
                  </p>

                  <span className="pb-0.5 text-right text-[10px] leading-4 text-[#999]">
                    {x.detalle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Atención + recientes */}
        <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <section className="overflow-hidden rounded-xl border border-[#e7e5e2] bg-white">
            <div className="flex items-center justify-between border-b border-[#eee] px-5 py-5 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c80000]" />

                  <h3 className="text-sm font-bold text-[#171717]">
                    Requieren atención
                  </h3>
                </div>

                <p className="mt-1.5 text-xs text-[#777]">
                  Trabajo pendiente que puede mover el flujo hacia la siguiente
                  etapa.
                </p>
              </div>

              <a
                href="/visitas-pendientes"
                className="hidden text-xs font-semibold text-[#777] transition hover:text-[#c80000] sm:block"
              >
                Ver pendientes →
              </a>
            </div>

            <div className="divide-y divide-[#f0efed]">
              {data?.pendientes.map((x) => (
                <div
                  key={x.etapa}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#faf9f7] sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        x.total > 0
                          ? "bg-[#fff1f1] text-[#c80000]"
                          : "bg-[#f5f5f3] text-[#777]"
                      }`}
                    >
                      {x.total}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#333]">
                        {x.etapa}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#888]">
                        Inmuebles en esta etapa del flujo
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      x.total > 0
                        ? "bg-[#fff5f5] text-[#a90000]"
                        : "bg-[#f5f5f3] text-[#888]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        x.total > 0
                          ? dotStyles[x.tone] || "bg-[#c80000]"
                          : "bg-[#aaa]"
                      }`}
                    />

                    {x.total > 0 ? "Pendiente" : "Sin pendientes"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#e7e5e2] bg-white">
            <div className="border-b border-[#eee] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#171717]" />

                <h3 className="text-sm font-bold text-[#171717]">
                  Avances recientes
                </h3>
              </div>

              <p className="mt-1.5 text-xs text-[#777]">
                Últimos movimientos registrados en la cartera.
              </p>
            </div>

            <div className="divide-y divide-[#f0efed]">
              {data?.recientes.map((x, index) => (
                <div
                  key={`${x.numero}-${index}`}
                  className="flex items-center gap-3 px-5 py-4 sm:px-6"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e7e5e2] bg-[#faf9f7] text-[10px] font-bold text-[#666]">
                    {x.numero}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#333]">
                      {x.nombre}
                    </p>

                    <p className="mt-1 text-xs text-[#888]">{x.etapa}</p>
                  </div>

                  <span className="text-[10px] text-[#999]">
                    {formatDate(x.fecha)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Acciones rápidas */}
        <section className="mt-7 rounded-xl border border-[#e7e5e2] bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c80000]">
                Operación
              </p>

              <h3 className="mt-1 text-base font-bold text-[#171717]">
                Acciones rápidas
              </h3>

              <p className="mt-1 text-xs text-[#777]">
                Accesos directos al trabajo operativo.
              </p>
            </div>

            <a
              href="/cartera"
              className="rounded-lg border border-[#e1dfdc] px-3 py-2 text-xs font-semibold text-[#555] transition hover:border-[#c80000] hover:text-[#c80000]"
            >
              Abrir cartera →
            </a>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "/registrar-inmueble",
                "Registrar inmueble",
                "Asignar una posición disponible.",
              ],
              [
                "/registrar-visitas",
                "Registrar visita",
                "Completar el proceso de visita.",
              ],
              [
                "/registrar-tasaciones",
                "Registrar tasación",
                "Actualizar la tasación actual.",
              ],
              [
                "/liberar-inmuebles",
                "Liberar inmueble",
                "Registrar y confirmar una salida.",
              ],
            ].map((x) => (
              <a
                key={x[0]}
                href={x[0]}
                className="group rounded-lg border border-[#e7e5e2] p-4 transition hover:border-[#d8baba] hover:bg-[#fffafa]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#333] group-hover:text-[#c80000]">
                    {x[1]}
                  </p>

                  <span className="text-xs text-[#aaa] transition group-hover:text-[#c80000]">
                    →
                  </span>
                </div>

                <p className="mt-1.5 text-xs leading-5 text-[#888]">
                  {x[2]}
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* Flujo operativo */}
        <section className="mt-5 flex flex-col gap-4 rounded-xl border border-[#e7e5e2] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#888]">
              Flujo operativo
            </p>

            <p className="mt-1.5 text-xs text-[#666]">
              Registro → visita → tasación → aprobación → texto → publicación
              → liberación.
            </p>
          </div>

          <a
            href="/reportes"
            className="shrink-0 rounded-lg border border-[#e1dfdc] px-3 py-2 text-xs font-semibold text-[#555] transition hover:border-[#c80000] hover:text-[#c80000]"
          >
            Ver reportes
          </a>
        </section>
      </div>
      </div>
    </main>
  );
}
