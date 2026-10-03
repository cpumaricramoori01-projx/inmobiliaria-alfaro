"use client";

import type { ReportRow, ReportSummary, ReportValue } from "@/lib/report-types";
import { useEffect, useMemo, useState } from "react";

type Reporte = {
  nombre: string;
  descripcion: string;
  categoria: string;
  icono: string;
};

type Row = ReportRow;

const reportes: Reporte[] = [
  {
    nombre: "Cartera activa",
    descripcion:
      "Inmuebles actualmente ocupando posiciones 01–90.",
    categoria: "Cartera",
    icono: "⌂",
  },
  {
    nombre: "Posiciones disponibles",
    descripcion:
      "Posiciones libres para nuevos registros.",
    categoria: "Cartera",
    icono: "▦",
  },
  {
    nombre: "Situación de cartera",
    descripcion:
      "Vista de las actividades pendientes y situaciones actuales.",
    categoria: "Cartera",
    icono: "◫",
  },
  {
    nombre: "Inmuebles por estado",
    descripcion:
      "Situación actual de los registros activos e históricos.",
    categoria: "Cartera",
    icono: "✓",
  },

  {
    nombre: "Visitas realizadas",
    descripcion:
      "Visitas efectivamente completadas y registradas.",
    categoria: "Gestión",
    icono: "◉",
  },
  {
    nombre: "Visitas pendientes",
    descripcion:
      "Inmuebles activos que todavía requieren visita.",
    categoria: "Gestión",
    icono: "◌",
  },
  {
    nombre: "Tasaciones realizadas",
    descripcion:
      "Tasaciones registradas en el sistema.",
    categoria: "Gestión",
    icono: "⌁",
  },
  {
    nombre: "Tasaciones pendientes",
    descripcion:
      "Inmuebles con visita realizada que aún requieren tasación.",
    categoria: "Gestión",
    icono: "⌁",
  },
  {
    nombre: "Aprobaciones pendientes",
    descripcion:
      "Tasaciones pendientes de decisión del propietario.",
    categoria: "Gestión",
    icono: "◇",
  },
  {
    nombre: "Negociaciones",
    descripcion:
      "Inmuebles que actualmente tienen una negociación en curso.",
    categoria: "Gestión",
    icono: "⇄",
  },
  {
    nombre: "Aprobaciones y negociación",
    descripcion:
      "Seguimiento de aprobaciones, decisiones y negociaciones.",
    categoria: "Gestión",
    icono: "◇",
  },
  {
    nombre: "Material pendiente",
    descripcion:
      "Inmuebles aprobados que aún requieren registrar material de publicación.",
    categoria: "Gestión",
    icono: "≡",
  },
  {
    nombre: "Listos para publicar",
    descripcion:
      "Publicaciones registradas que esperan ser publicadas.",
    categoria: "Gestión",
    icono: "↗",
  },
  {
    nombre: "Publicados",
    descripcion:
      "Inmuebles cuya publicación ya fue registrada como publicada.",
    categoria: "Gestión",
    icono: "●",
  },

  {
    nombre: "Vendidos",
    descripcion:
      "Inmuebles liberados por venta.",
    categoria: "Salidas",
    icono: "✓",
  },
  {
    nombre: "Retirados / cancelados",
    descripcion:
      "Salidas por cancelación u otros motivos.",
    categoria: "Salidas",
    icono: "↩",
  },
  {
    nombre: "Motivos de liberación",
    descripcion:
      "Detalle de las causas de salida de cartera.",
    categoria: "Salidas",
    icono: "!",
  },

  {
    nombre: "Histórico de inmuebles",
    descripcion:
      "Registros que ya no están activos.",
    categoria: "Histórico",
    icono: "◷",
  },
  {
    nombre: "Tiempo de permanencia",
    descripcion:
      "Días desde el registro hasta la salida o actualidad.",
    categoria: "Histórico",
    icono: "◌",
  },
  {
    nombre: "Posición ocupada",
    descripcion:
      "Historial de uso de cada posición reutilizable.",
    categoria: "Histórico",
    icono: "01",
  },

  {
    nombre: "Registro → visita",
    descripcion:
      "Tiempo desde el alta hasta la visita.",
    categoria: "Flujo",
    icono: "→",
  },
  {
    nombre: "Visita → tasación",
    descripcion:
      "Tiempo entre visita y tasación.",
    categoria: "Flujo",
    icono: "→",
  },
  {
    nombre: "Tasación → aprobación",
    descripcion:
      "Seguimiento entre tasación y decisión.",
    categoria: "Flujo",
    icono: "→",
  },
  {
    nombre: "Aprobación → publicación",
    descripcion:
      "Tiempo desde aprobación hasta registro de publicación.",
    categoria: "Flujo",
    icono: "→",
  },
];

const grupos = [
  "Todos",
  "Cartera",
  "Gestión",
  "Salidas",
  "Histórico",
  "Flujo",
];

const tone: Record<string, string> = {
  Cartera:
    "bg-blue-100 text-blue-700",
  Gestión:
    "bg-violet-100 text-violet-700",
  Salidas:
    "bg-rose-100 text-rose-700",
  Histórico:
    "bg-slate-100 text-slate-700",
  Flujo:
    "bg-cyan-100 text-cyan-700",
};

function fecha(value: unknown) {
  if (!(typeof value === "string" || typeof value === "number" || value instanceof Date) || !value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("es-PE");
}

function exportarCSV(
  rows: Row[],
  reporte: string,
) {
  if (!rows.length) return;

  const keys = Array.from(
    new Set(
      rows.flatMap((row) =>
        Object.keys(row),
      ),
    ),
  ).filter(
    (key) => !["inmuebleId"].includes(key),
  );

  const csv = [
    keys.join(";"),
    ...rows.map((row) =>
      keys
        .map((key) => {
          const value = row[key] ?? "";

          return (
            '"' +
            String(value).replace(
              /"/g,
              '""',
            ) +
            '"'
          );
        })
        .join(";"),
    ),
  ].join("\n");

  const blob = new Blob(
    ["\ufeff" + csv],
    {
      type: "text/csv;charset=utf-8;",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = `reporte-${reporte
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )}.csv`;

  a.click();

  URL.revokeObjectURL(url);
}

export default function Page() {
  const [categoria, setCategoria] =
    useState("Todos");

  const [consulta, setConsulta] = useState({
    reporte: "Cartera activa", desde: "", hasta: "", situacion: "Todas", estado: "Todos", posicion: "", tipo: "Todos",
  });
  const seleccionado = consulta.reporte;

  const [fechaDesde, setFechaDesde] =
    useState("");

  const [fechaHasta, setFechaHasta] =
    useState("");

  const [situacion, setSituacion] =
    useState("Todas");

  const [estado, setEstado] =
    useState("Todos");

  const [posicion, setPosicion] =
    useState("");

  const [tipo, setTipo] =
    useState("Todos");

  const [rows, setRows] =
    useState<Row[]>([]);

  const [resumen, setResumen] =
    useState<ReportSummary | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const visibles = useMemo(
    () =>
      reportes.filter(
        (reporte) =>
          categoria === "Todos" ||
          reporte.categoria ===
            categoria,
      ),
    [categoria],
  );

  const reporteInfo =
    reportes.find(
      (reporte) =>
        reporte.nombre ===
        seleccionado,
    )!;

  function solicitarReporte(reporte: string) {
    setCargando(true);
    setError("");
    setConsulta({ reporte, desde: fechaDesde, hasta: fechaHasta, situacion, estado, posicion, tipo });
  }

  function cargar() { solicitarReporte(seleccionado); }

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const params = new URLSearchParams(consulta);
        const response = await fetch(`/api/reportes?${params.toString()}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo generar el reporte.");
        if (controller.signal.aborted) return;
        setRows(data.rows ?? []);
        setResumen(data.resumen ?? null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "No se pudo generar el reporte.");
        setRows([]);
        setResumen(null);
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [consulta]);

  const limpiar = () => {
    setFechaDesde("");
    setFechaHasta("");
    setSituacion("Todas");
    setEstado("Todos");
    setPosicion("");
    setTipo("Todos");
  };

  const columnas =
    useMemo(() => {
      if (!rows.length) return [];

      const preferred = [
        "codigo",
        "posicion",
        "nombre",
        "propietario",
        "ubicacion",
        "tipo",
        "estado",
        "situaciones",
        "fechaRegistro",
        "fechaVisita",
        "fechaTasacion",
        "tasacion",
        "situacionTasacion",
        "estadoNegociacion",
        "fechaPublicacion",
        "motivoLiberacion",
        "dias",
        "fechaInicioPosicion",
        "fechaFinPosicion",
        "fechaInicioFlujo",
        "fechaFinFlujo",
      ];

      return preferred.filter(
        (key) =>
          rows.some(
            (row) =>
              row[key] !==
              undefined,
          ),
      );
    }, [rows]);

  const etiqueta: Record<
    string,
    string
  > = {
    codigo: "Código",
    posicion: "Pos.",
    nombre: "Inmueble",
    propietario: "Propietario",
    ubicacion: "Ubicación",
    tipo: "Tipo",
    estado: "Estado",
    situaciones:
      "Situación / actividades",
    fechaRegistro: "Registro",
    fechaVisita: "Visita",
    fechaTasacion: "Tasación",
    tasacion: "Precio objetivo",
    situacionTasacion:
      "Situación tasación",
    estadoNegociacion:
      "Negociación",
    fechaPublicacion:
      "Publicación",
    motivoLiberacion:
      "Motivo",
    dias: "Días",
    fechaInicioPosicion:
      "Inicio posición",
    fechaFinPosicion:
      "Fin posición",
    fechaInicioFlujo:
      "Inicio",
    fechaFinFlujo:
      "Fin",
  };

  function renderValor(
    key: string,
    value: ReportValue,
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    if (
      key === "situaciones" &&
      Array.isArray(value)
    ) {
      return value.length
        ? value.join(" · ")
        : "—";
    }

    if (
      key.toLowerCase().includes(
        "fecha",
      ) ||
      key === "fechaVisita" ||
      key ===
        "fechaInicioFlujo" ||
      key ===
        "fechaFinFlujo" ||
      key ===
        "fechaInicioPosicion" ||
      key ===
        "fechaFinPosicion"
    ) {
      return fecha(value);
    }

    if (
      key === "tasacion" &&
      typeof value === "number"
    ) {
      return value > 0
        ? `S/ ${value.toLocaleString(
            "es-PE",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}`
        : "—";
    }

    return String(value);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] p-6 lg:p-8">
      <div className="mx-auto max-w-7xl print:max-w-none">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between print:mb-4">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl text-indigo-600">
              ▥
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
                Fase 1 · Información
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Reportes
              </h1>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Consulta datos reales de la cartera, gestión, salidas, histórico y tiempos del flujo.
              </p>
            </div>
          </div>

          <div className="flex gap-2 print:hidden">
            <button
              onClick={() =>
                window.print()
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              Imprimir / PDF
            </button>

            <button
              onClick={() =>
                exportarCSV(
                  rows,
                  seleccionado,
                )
              }
              disabled={!rows.length}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Exportar Excel/CSV
            </button>
          </div>
        </header>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)] print:hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Filtros
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Los filtros se aplican directamente sobre los datos de la base de datos.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={cargar}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Aplicar filtros
              </button>

              <button
                onClick={() => {
                  limpiar();
                  setTimeout(
                    cargar,
                    0,
                  );
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <label className="text-xs font-semibold text-slate-500">
              Desde
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) =>
                  setFechaDesde(
                    e.target.value,
                  )
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </label>

            <label className="text-xs font-semibold text-slate-500">
              Hasta
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) =>
                  setFechaHasta(
                    e.target.value,
                  )
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </label>

            <label className="text-xs font-semibold text-slate-500">
              Actividad / situación
              <select
                value={situacion}
                onChange={(e) =>
                  setSituacion(
                    e.target.value,
                  )
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option>
                  Todas
                </option>
                <option>
                  Visita pendiente
                </option>
                <option>
                  Tasación pendiente
                </option>
                <option>
                  Pendiente de aprobación
                </option>
                <option>
                  Material pendiente
                </option>
                <option>
                  En negociación
                </option>
                <option>
                  Listo para publicar
                </option>
                <option>
                  Publicado
                </option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-500">
              Estado
              <select
                value={estado}
                onChange={(e) =>
                  setEstado(
                    e.target.value,
                  )
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option>
                  Todos
                </option>
                <option>
                  Activo
                </option>
                <option>
                  Histórico
                </option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-500">
              Posición
              <input
                value={posicion}
                onChange={(e) =>
                  setPosicion(
                    e.target.value
                      .replace(
                        /\D/g,
                        "",
                      )
                      .slice(0, 2),
                  )
                }
                placeholder="01–90"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </label>

            <label className="text-xs font-semibold text-slate-500">
              Tipo
              <select
                value={tipo}
                onChange={(e) =>
                  setTipo(
                    e.target.value,
                  )
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option>
                  Todos
                </option>
                <option>
                  Casa
                </option>
                <option>
                  Departamento
                </option>
                <option>
                  Terreno
                </option>
                <option>
                  Local
                </option>
                <option>
                  Oficina
                </option>
                <option>
                  Otros
                </option>
              </select>
            </label>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {resumen && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-900 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.10)]">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Lectura rápida
                </p>

                <h2 className="mt-1 text-base font-bold text-white">
                  Resumen del reporte seleccionado
                </h2>
              </div>

              <span className="text-xs text-slate-400">
                {resumen.total}{" "}
                resultado
                {resumen.total === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
              {[
                [
                  "Resultado",
                  resumen.total,
                ],
                [
                  "Activos",
                  resumen.activos,
                ],
                [
                  "Históricos",
                  resumen.historicos,
                ],
                [
                  "Disponibles",
                  resumen.disponibles,
                ],
                [
                  "Visitas pendientes",
                  resumen.visitasPendientes,
                ],
                [
                  "Tasaciones pendientes",
                  resumen.tasacionesPendientes,
                ],
                [
                  "Material pendiente",
                  resumen.materialPendiente,
                ],
                [
                  "Publicados",
                  resumen.publicados,
                ],
              ].map(
                ([titulo, valor]) => (
                  <div
                    key={String(
                      titulo,
                    )}
                    className="rounded-xl border border-white/10 bg-white/[0.06] p-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {titulo}
                    </p>

                    <p className="mt-1.5 text-xl font-bold text-white">
                      {valor}
                    </p>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)] print:hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                ¿Qué necesitas revisar?
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Elige una vista y te mostramos el detalle.
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Empieza por la situación actual y luego entra al detalle que necesites.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [
                  "Cartera",
                  "¿Qué tenemos?",
                  "Cartera",
                ],
                [
                  "Gestión",
                  "¿Qué falta?",
                  "Gestión",
                ],
                [
                  "Salidas",
                  "¿Qué salió?",
                  "Salidas",
                ],
                [
                  "Flujo",
                  "¿Cuánto demora?",
                  "Flujo",
                ],
              ].map(
                ([
                  label,
                  question,
                  value,
                ]) => (
                  <button
                    key={String(
                      label,
                    )}
                    onClick={() =>
                      setCategoria(
                        String(
                          value,
                        ),
                      )
                    }
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${
                      categoria ===
                      value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide opacity-60">
                      {label}
                    </p>

                    <p className="mt-1 text-xs font-semibold">
                      {question}
                    </p>
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 print:hidden">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Reportes disponibles
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Selecciona el informe que quieres consultar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {grupos.map(
                (grupo) => (
                  <button
                    key={grupo}
                    onClick={() =>
                      setCategoria(
                        grupo,
                      )
                    }
                    className={`rounded-full px-3.5 py-2 text-xs font-bold ${
                      categoria ===
                      grupo
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {grupo}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map(
              (reporte) => (
                <button
                  key={
                    reporte.nombre
                  }
                  onClick={() =>
                    solicitarReporte(reporte.nombre)
                  }
                  className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    seleccionado ===
                    reporte.nombre
                      ? "border-indigo-300 ring-2 ring-indigo-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${tone[reporte.categoria]}`}
                    >
                      {
                        reporte.icono
                      }
                    </span>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {
                          reporte.nombre
                        }
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {
                          reporte.descripcion
                        }
                      </p>
                    </div>
                  </div>
                </button>
              ),
            )}
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.045)] print:mt-0 print:border-0 print:shadow-none">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                {
                  reporteInfo.categoria
                }
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                {seleccionado}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {
                  reporteInfo.descripcion
                }
              </p>
            </div>

            {cargando && (
              <span className="text-xs font-semibold text-slate-400">
                Consultando…
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            {rows.length ? (
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    {columnas.map(
                      (key) => (
                        <th
                          key={key}
                          className="px-4 py-3"
                        >
                          {
                            etiqueta[
                              key
                            ] ||
                              key
                          }
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map(
                    (
                      row,
                      index,
                    ) => (
                      <tr
                        key={`${row.codigo || row.posicion || index}-${index}`}
                        className="hover:bg-slate-50"
                      >
                        {columnas.map(
                          (key) => (
                            <td
                              key={key}
                              className="px-4 py-3 text-xs text-slate-600"
                            >
                              {renderValor(
                                key,
                                row[
                                  key
                                ],
                              )}
                            </td>
                          ),
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <p className="font-semibold text-slate-700">
                  {cargando
                    ? "Generando reporte…"
                    : "No hay registros para esta consulta"}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Prueba con otros filtros o selecciona otro reporte.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}