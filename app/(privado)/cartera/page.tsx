"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Estado = "Activo" | "Histórico";
type FiltroActividad =
  | "Todas"
  | "Visita pendiente"
  | "Tasación pendiente"
  | "Material pendiente"
  | "Negociación";

type Actividades = {
  visita: {
    estado: string;
    pendiente: boolean;
    realizada: boolean;
    fecha: string | Date | null;
  };
  tasacion: {
    estado: string;
    pendiente: boolean;
    situacion: string | null;
    fecha: string | Date | null;
  };
  material: {
    pendiente: boolean;
    fotosPendientes: boolean;
    textoPendiente: boolean;
  };
  negociacion: {
    estado: string;
    enCurso: boolean;
  };
  publicacion: {
    existe: boolean;
    publicado: boolean;
    tieneTexto: boolean;
    fechaPublicacion: string | Date | null;
  };
};

type Inmueble = {
  id: string;
  inmuebleId: number;
  posicion?: number;
  tipo: string;
  nombre: string;
  ubicacion: string;
  direccion: string | null;
  estado: Estado;
  propietario: string;
  actividades: Actividades;
  visitaPendiente: boolean;
  tasacionPendiente: boolean;
  materialPendiente: boolean;
  fotosPendientes: boolean;
  textoPendiente: boolean;
  negociacionEnCurso: boolean;
  fechaRegistro?: string | Date;
  fechaSalida?: string | Date;
};

type Posicion = {
  numero: number;
  disponible: boolean;
};

type Resumen = {
  enCartera: number;
  disponibles: number;
  visitasPendientes: number;
  tasacionesPendientes: number;
  materialPendiente: number;
  negociaciones: number;
  capacidad: number;
};

function Icon({
  name,
}: {
  name:
    | "home"
    | "search"
    | "map"
    | "close"
    | "history"
    | "clock"
    | "chart"
    | "camera"
    | "handshake"
    | "check";
}) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === "map") {
    return (
      <svg {...common}>
        <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg {...common}>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </svg>
    );
  }

  if (name === "history") {
    return (
      <svg {...common}>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-5 3 3 5-7" />
      </svg>
    );
  }

  if (name === "camera") {
    return (
      <svg {...common}>
        <path d="M4 7h4l1.5-2h5L16 7h4v12H4V7Z" />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
    );
  }

  if (name === "handshake") {
    return (
      <svg {...common}>
        <path d="m4 11 3-3 4 2 2-2 7 3-3 6-5-2-3 2-5-6Z" />
        <path d="m7 8 3 3" />
        <path d="m14 8-3 3" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function EstadoActividad({
  estado,
  pendiente,
  icon,
}: {
  estado: string;
  pendiente: boolean;
  icon: "clock" | "chart" | "camera" | "handshake" | "check";
}) {
  const etiqueta =
    estado === "realizada"
      ? "Realizada"
      : estado === "registrada"
        ? "Registrada"
        : estado === "sin_negociacion"
          ? "Sin negociación"
          : estado === "en_curso"
            ? "En curso"
            : estado === "pendiente_aprobacion"
              ? "Pendiente aprobación"
              : pendiente
                ? "Pendiente"
                : estado;

  const clase = pendiente
    ? "border-[#eadede] bg-[#fff5f5] text-[#a90000]"
    : estado === "en_curso"
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : "border-slate-200 bg-white text-slate-500";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${clase}`}
    >
      <Icon name={icon} />
      {etiqueta}
    </span>
  );
}

export default function CarteraPage() {
  const [estado, setEstado] = useState<"Todos" | Estado>("Activo");
  const [tipo, setTipo] = useState("Todos");
  const [actividad, setActividad] =
    useState<FiltroActividad>("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] =
    useState<"posiciones" | "lista">("posiciones");

  const [seleccionado, setSeleccionado] =
    useState<Inmueble | null>(null);
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [resumen, setResumen] = useState<Resumen>({
    enCartera: 0,
    disponibles: 90,
    visitasPendientes: 0,
    tasacionesPendientes: 0,
    materialPendiente: 0,
    negociaciones: 0,
    capacidad: 90,
  });

  const [cargando, setCargando] = useState(true);
  const [cargandoPosiciones, setCargandoPosiciones] =
    useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    try {
      setError("");

      const [carteraResponse, posicionesResponse] =
        await Promise.all([
          fetch("/api/cartera", { cache: "no-store" }),
          fetch("/api/posiciones", { cache: "no-store" }),
        ]);

      const carteraData = await carteraResponse.json();
      const posicionesData = await posicionesResponse.json();

      if (!carteraResponse.ok) {
        throw new Error(
          carteraData.error ||
            "No se pudo cargar la cartera."
        );
      }

      if (!posicionesResponse.ok) {
        throw new Error(
          posicionesData.error ||
            "No se pudieron cargar las posiciones."
        );
      }

      setInmuebles(carteraData.inmuebles ?? []);
      setResumen(
        carteraData.resumen ?? {
          enCartera: 0,
          disponibles: 90,
          visitasPendientes: 0,
          tasacionesPendientes: 0,
          materialPendiente: 0,
          negociaciones: 0,
          capacidad: 90,
        }
      );
      setPosiciones(posicionesData.posiciones ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la información."
      );
    } finally {
      setCargando(false);
      setCargandoPosiciones(false);
    }
  }

  useEffect(() => {
    cargarDatos();

    const intervalo = window.setInterval(
      cargarDatos,
      30000
    );

    return () => window.clearInterval(intervalo);
  }, []);

  const activos = useMemo(
    () =>
      inmuebles.filter((x) => x.estado === "Activo"),
    [inmuebles]
  );

  const historicos = useMemo(
    () =>
      inmuebles.filter((x) => x.estado === "Histórico"),
    [inmuebles]
  );

  const filtrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return inmuebles.filter((x) => {
      const coincideTexto =
        !texto ||
        `${x.id} ${x.posicion ?? ""} ${x.nombre} ${x.ubicacion} ${x.propietario}`
          .toLowerCase()
          .includes(texto);

      const coincideActividad =
        actividad === "Todas" ||
        (actividad === "Visita pendiente" &&
          x.visitaPendiente) ||
        (actividad === "Tasación pendiente" &&
          x.tasacionPendiente) ||
        (actividad === "Material pendiente" &&
          x.materialPendiente) ||
        (actividad === "Negociación" &&
          x.negociacionEnCurso);

      return (
        (estado === "Todos" || x.estado === estado) &&
        (tipo === "Todos" || x.tipo === tipo) &&
        coincideActividad &&
        coincideTexto
      );
    });
  }, [
    inmuebles,
    estado,
    tipo,
    actividad,
    busqueda,
  ]);

  const posicionesOcupadas = useMemo(
    () =>
      posiciones.filter((x) => !x.disponible).length,
    [posiciones]
  );

  const porcentajeOcupacion =
    resumen.capacidad > 0
      ? Math.min(
          100,
          (resumen.enCartera / resumen.capacidad) * 100
        )
      : 0;

  const inmueblePorPosicion = useMemo(() => {
    const mapa = new Map<number, Inmueble>();

    activos.forEach((inmueble) => {
      if (inmueble.posicion != null) {
        mapa.set(inmueble.posicion, inmueble);
      }
    });

    return mapa;
  }, [activos]);

  const totalPendientes =
    resumen.visitasPendientes +
    resumen.tasacionesPendientes +
    resumen.materialPendiente +
    resumen.negociaciones;

  const limpiarFiltros = () => {
    setEstado("Activo");
    setTipo("Todos");
    setActividad("Todas");
    setBusqueda("");
  };

  const tieneFiltros =
    Boolean(busqueda) ||
    estado !== "Activo" ||
    tipo !== "Todos" ||
    actividad !== "Todas";

  return (
    <main className="min-h-screen bg-[#f5f7fa] p-6 lg:p-8">
      <div className="mx-auto max-w-[1550px]">
        {/* CABECERA */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-slate-400">
              <span>Fase 1</span>
              <span className="text-slate-300">/</span>
              <span>Cartera</span>
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Cartera de inmuebles
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Control operativo de los inmuebles activos,
              sus posiciones y las actividades que requieren
              atención.
            </p>
          </div>

          <Link
            href="/registrar-inmueble"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Registrar inmueble
          </Link>
        </div>

        {/* INDICADORES */}
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            {
              label: "En cartera",
              value: resumen.enCartera,
              detail: `de ${resumen.capacidad}`,
              icon: "home" as const,
            },
            {
              label: "Disponibles",
              value: resumen.disponibles,
              detail: "posiciones libres",
              icon: "map" as const,
            },
            {
              label: "Visitas",
              value: resumen.visitasPendientes,
              detail: "pendientes",
              icon: "clock" as const,
            },
            {
              label: "Tasaciones",
              value: resumen.tasacionesPendientes,
              detail: "pendientes",
              icon: "chart" as const,
            },
            {
              label: "Material",
              value: resumen.materialPendiente,
              detail: "pendiente",
              icon: "camera" as const,
            },
            {
              label: "Negociación",
              value: resumen.negociaciones,
              detail: "en curso",
              icon: "handshake" as const,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon name={item.icon} />
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {item.detail}
                </span>
              </div>

              <p className="mt-4 text-2xl font-bold text-slate-950">
                {item.value}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* ATENCIÓN OPERATIVA */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Atención operativa
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {totalPendientes === 0
                  ? "La cartera no tiene actividades pendientes."
                  : `${totalPendientes} actividad${
                      totalPendientes === 1 ? "" : "es"
                    } requiere${
                      totalPendientes === 1 ? "" : "n"
                    } atención.`}
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Las actividades son independientes. Un inmueble
                puede tener más de una tarea pendiente al mismo
                tiempo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setActividad("Visita pendiente")
                }
                className="rounded-xl border border-slate-200 bg-[#fafafa] px-4 py-2 text-left transition hover:border-slate-300"
              >
                <p className="text-[10px] font-semibold text-slate-400">
                  Visitas
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {resumen.visitasPendientes}
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActividad("Tasación pendiente")
                }
                className="rounded-xl border border-slate-200 bg-[#fafafa] px-4 py-2 text-left transition hover:border-slate-300"
              >
                <p className="text-[10px] font-semibold text-slate-400">
                  Tasaciones
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {resumen.tasacionesPendientes}
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActividad("Material pendiente")
                }
                className="rounded-xl border border-slate-200 bg-[#fafafa] px-4 py-2 text-left transition hover:border-slate-300"
              >
                <p className="text-[10px] font-semibold text-slate-400">
                  Material
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {resumen.materialPendiente}
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActividad("Negociación")
                }
                className="rounded-xl border border-slate-200 bg-[#fafafa] px-4 py-2 text-left transition hover:border-slate-300"
              >
                <p className="text-[10px] font-semibold text-slate-400">
                  Negociación
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {resumen.negociaciones}
                </p>
              </button>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mt-5 rounded-2xl border border-[#eadede] bg-[#fff5f5] p-4 text-sm text-[#a90000]">
            {error}
          </div>
        )}

        {cargando && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
            Cargando cartera desde la base de datos…
          </div>
        )}

        {/* FILTROS */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" />
              </span>

              <input
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
                placeholder="Buscar por posición, ID, inmueble, ubicación o propietario..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <select
              value={estado}
              onChange={(e) =>
                setEstado(
                  e.target.value as "Todos" | Estado
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
            >
              <option>Activo</option>
              <option>Todos</option>
              <option>Histórico</option>
            </select>

            <select
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
            >
              <option>Todos</option>
              <option>Casa</option>
              <option>Departamento</option>
              <option>Terreno</option>
              <option>Local</option>
              <option>Oficina</option>
              <option>Otros</option>
            </select>

            <select
              value={actividad}
              onChange={(e) =>
                setActividad(
                  e.target.value as FiltroActividad
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
            >
              <option>Todas</option>
              <option>Visita pendiente</option>
              <option>Tasación pendiente</option>
              <option>Material pendiente</option>
              <option>Negociación</option>
            </select>

            <div className="flex rounded-xl border border-slate-200 p-1">
              <button
                type="button"
                onClick={() =>
                  setVista("posiciones")
                }
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  vista === "posiciones"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500"
                }`}
              >
                Posiciones
              </button>

              <button
                type="button"
                onClick={() => setVista("lista")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  vista === "lista"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500"
                }`}
              >
                Lista
              </button>
            </div>

            {tieneFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Limpiar
              </button>
            )}
          </div>
        </section>

        {/* RESULTADOS */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              {estado === "Histórico"
                ? "Histórico de inmuebles"
                : "Cartera operativa"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Mostrando {filtrados.length} registro
              {filtrados.length === 1 ? "" : "s"} con los
              filtros actuales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-slate-800" />
              Ocupada
            </span>

            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-slate-300" />
              Disponible
            </span>

            <span>
              {cargandoPosiciones
                ? "Consultando posiciones…"
                : `${posiciones.length || resumen.capacidad} posiciones administradas`}
            </span>
          </div>
        </div>

        {/* POSICIONES */}
        {vista === "posiciones" &&
        estado !== "Histórico" ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
            {cargandoPosiciones ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                Consultando posiciones reales de la cartera…
              </div>
            ) : posiciones.length > 0 ? (
              posiciones.map((pos) => {
                const x = inmueblePorPosicion.get(
                  pos.numero
                );

                const visible =
                  !x ||
                  filtrados.some(
                    (item) =>
                      item.inmuebleId === x.inmuebleId
                  );

                if (!visible) {
                  return null;
                }

                return (
                  <button
                    key={pos.numero}
                    type="button"
                    onClick={() =>
                      x && setSeleccionado(x)
                    }
                    disabled={!x}
                    className={`group min-h-[155px] rounded-2xl border p-3 text-left transition ${
                      x
                        ? "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                        : "border-dashed border-slate-200 bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`font-mono text-sm font-bold ${
                          x
                            ? "text-slate-800"
                            : "text-slate-300"
                        }`}
                      >
                        {String(pos.numero).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      {x ? (
                        <span className="h-2 w-2 rounded-full bg-slate-800" />
                      ) : (
                        <span className="text-lg font-light text-slate-300">
                          +
                        </span>
                      )}
                    </div>

                    {x ? (
                      <>
                        <div className="mt-3 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon name="home" />
                        </div>

                        <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-700">
                          {x.nombre}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {x.visitaPendiente && (
                            <span className="rounded-full bg-[#fff5f5] px-1.5 py-0.5 text-[8px] font-bold text-[#a90000]">
                              Visita
                            </span>
                          )}

                          {x.tasacionPendiente && (
                            <span className="rounded-full bg-[#fff8f0] px-1.5 py-0.5 text-[8px] font-bold text-[#9a5a00]">
                              Tasación
                            </span>
                          )}

                          {x.materialPendiente && (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-600">
                              Material
                            </span>
                          )}

                          {x.negociacionEnCurso && (
                            <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[8px] font-bold text-white">
                              Negociación
                            </span>
                          )}
                        </div>

                        {!x.visitaPendiente &&
                          !x.tasacionPendiente &&
                          !x.materialPendiente &&
                          !x.negociacionEnCurso && (
                            <p className="mt-2 text-[9px] font-semibold text-slate-400">
                              Sin pendientes operativos
                            </p>
                          )}
                      </>
                    ) : (
                      <div className="mt-7">
                        <p className="text-[10px] font-medium text-slate-400">
                          Disponible
                        </p>
                        <p className="mt-1 text-[9px] text-slate-300">
                          Lista para reutilizar
                        </p>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="col-span-full rounded-2xl border border-[#eadede] bg-[#fff5f5] p-6 text-sm text-[#a90000]">
                No se encontraron posiciones administradas.
              </div>
            )}
          </div>
        ) : (
          /* LISTA */
          <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">
                      Pos.
                    </th>
                    <th className="px-5 py-3">
                      Inmueble
                    </th>
                    <th className="px-5 py-3">
                      Ubicación
                    </th>
                    <th className="px-5 py-3">
                      Propietario
                    </th>
                    <th className="px-5 py-3">
                      Visita
                    </th>
                    <th className="px-5 py-3">
                      Tasación
                    </th>
                    <th className="px-5 py-3">
                      Material
                    </th>
                    <th className="px-5 py-3">
                      Negociación
                    </th>
                    <th className="px-5 py-3">
                      Estado
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtrados.map((x) => (
                    <tr
                      key={`${x.id}-${x.posicion ?? "sin-posicion"}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-mono text-sm font-bold text-slate-700">
                        {x.posicion
                          ? String(x.posicion).padStart(
                              2,
                              "0"
                            )
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {x.nombre}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {x.id} · {x.tipo}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {x.ubicacion}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {x.propietario}
                      </td>

                      <td className="px-5 py-4">
                        <EstadoActividad
                          estado={
                            x.actividades.visita.estado
                          }
                          pendiente={
                            x.visitaPendiente
                          }
                          icon={
                            x.visitaPendiente
                              ? "clock"
                              : "check"
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <EstadoActividad
                          estado={
                            x.actividades.tasacion
                              .estado
                          }
                          pendiente={
                            x.tasacionPendiente
                          }
                          icon="chart"
                        />
                      </td>

   <td className="px-5 py-4">
  <div className="flex flex-col gap-1">
    {x.actividades.tasacion.estado !== "aprobado" ? (
      <span className="text-[10px] font-semibold text-slate-400">
        Aún no corresponde
      </span>
    ) : (
      <>
        {x.fotosPendientes && (
          <span className="text-[10px] font-semibold text-slate-500">
            📷 Fotos pendientes
          </span>
        )}

        {x.textoPendiente && (
          <span className="text-[10px] font-semibold text-slate-500">
            Texto pendiente
          </span>
        )}

        {!x.materialPendiente && (
          <span className="text-[10px] font-semibold text-slate-500">
            Completo
          </span>
        )}
      </>
    )}
  </div>
</td>

                      <td className="px-5 py-4">
                        <EstadoActividad
                          estado={
                            x.actividades.negociacion
                              .estado
                          }
                          pendiente={
                            x.negociacionEnCurso
                          }
                          icon="handshake"
                        />
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                        {x.estado}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSeleccionado(x)
                          }
                          className="text-xs font-semibold text-slate-600 hover:text-slate-950"
                        >
                          Ver detalle →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {filtrados.length === 0 && !cargando && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              No encontramos inmuebles
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Prueba cambiando los filtros o la búsqueda.
            </p>
          </div>
        )}

        {/* CAPACIDAD */}
        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Icon name="map" />
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Capacidad de cartera
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {resumen.enCartera} de{" "}
                  {resumen.capacidad} posiciones ocupadas ·{" "}
                  {resumen.disponibles} disponibles para
                  reutilización.
                </p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-800 transition-all duration-500"
                style={{
                  width: `${porcentajeOcupacion}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span>
                {porcentajeOcupacion.toFixed(0)}% ocupación
              </span>
              <span>100%</span>
            </div>
          </div>

          <Link
            href="/liberar-inmuebles"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Icon name="history" />
            Gestionar liberaciones
          </Link>
        </div>

        {/* MODAL */}
        {seleccionado && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/30 p-4"
            onClick={() => setSeleccionado(null)}
          >
            <div
              className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                      {seleccionado.posicion
                        ? `Posición ${String(
                            seleccionado.posicion
                          ).padStart(2, "0")}`
                        : "Sin posición activa"}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        seleccionado.estado === "Activo"
                          ? "bg-[#f1f5f2] text-[#3f684c]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {seleccionado.estado}
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-bold text-slate-950">
                    {seleccionado.nombre}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {seleccionado.tipo} ·{" "}
                    {seleccionado.ubicacion}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSeleccionado(null)
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <Icon name="close" />
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f5f7fa] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ID del inmueble
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-700">
                    {seleccionado.id}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f5f7fa] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Propietario
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {seleccionado.propietario}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Seguimiento operativo
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Visita
                      </span>
                      <EstadoActividad
                        estado={
                          seleccionado.actividades.visita
                            .estado
                        }
                        pendiente={
                          seleccionado.visitaPendiente
                        }
                        icon={
                          seleccionado.visitaPendiente
                            ? "clock"
                            : "check"
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Tasación
                      </span>
                      <EstadoActividad
                        estado={
                          seleccionado.actividades
                            .tasacion.estado
                        }
                        pendiente={
                          seleccionado.tasacionPendiente
                        }
                        icon="chart"
                      />
                    </div>
                  </div>

<div className="rounded-2xl border border-slate-200 p-4">
  <p className="text-sm font-semibold text-slate-700">
    Material
  </p>

  {seleccionado.actividades.tasacion.estado !==
  "aprobado" ? (
    <p className="mt-2 text-xs font-medium text-slate-400">
      Aún no corresponde
    </p>
  ) : (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span
        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
          seleccionado.fotosPendientes
            ? "bg-[#fff5f5] text-[#a90000]"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {seleccionado.fotosPendientes
          ? "Fotos pendientes"
          : "Fotos completas"}
      </span>

      <span
        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
          seleccionado.textoPendiente
            ? "bg-[#fff5f5] text-[#a90000]"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {seleccionado.textoPendiente
          ? "Texto pendiente"
          : "Texto registrado"}
      </span>
    </div>
  )}
</div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Negociación
                      </span>

                      <EstadoActividad
                        estado={
                          seleccionado.actividades
                            .negociacion.estado
                        }
                        pendiente={
                          seleccionado.negociacionEnCurso
                        }
                        icon="handshake"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-[#f5f7fa] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Publicación
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {!seleccionado.actividades.publicacion
                    .existe
                    ? "Sin publicación registrada"
                    : seleccionado.actividades.publicacion
                          .publicado
                      ? "Publicación realizada"
                      : "Texto registrado, pendiente de publicación"}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link
                  href={
                    "/datos-inmuebles?codigo=" +
                    encodeURIComponent(
                      seleccionado.id
                    )
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  Ver ficha
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setSeleccionado(null)
                  }
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
