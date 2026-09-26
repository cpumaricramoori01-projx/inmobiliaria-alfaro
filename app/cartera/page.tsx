"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Estado = "Activo" | "Histórico";

type Etapa =
  | "Visita pendiente"
  | "Visita realizada"
  | "Tasación pendiente"
  | "Pendiente de aprobación"
  | "En negociación"
  | "Listo para publicar"
  | "Publicado";

type Inmueble = {
  id: string;
  posicion?: number;
  tipo: "Casa" | "Departamento" | "Terreno" | "Local" | "Oficina" | "Otros";
  nombre: string;
  ubicacion: string;
  estado: Estado;
  etapa?: Etapa;
  etapaKey?: string;
  progreso?: number;
  siguienteAccion?: string;
  propietario: string;
  motivoLiberacion?: string;
  fechaRegistro?: string | Date;
  fechaSalida?: string | Date;
};

type Posicion = {
  numero: number;
  disponible: boolean;
  codigo?: string | null;
  nombre?: string | null;
  tipo?: string | null;
  etapa?: string | null;
  propietario?: string | null;
};

const etapaTone: Record<Etapa, string> = {
  "Visita pendiente": "bg-[#fff5f5] text-[#a90000]",
  "Visita realizada": "bg-slate-100 text-slate-600",
  "Tasación pendiente": "bg-[#fff8f0] text-[#9a5a00]",
  "Pendiente de aprobación": "bg-[#fff5f5] text-[#a90000]",
  "En negociación": "bg-slate-100 text-slate-700",
  "Listo para publicar": "bg-[#f4f4f2] text-slate-700",
  "Publicado": "bg-[#f1f5f2] text-[#3f684c]",
};

function Icon({
  name,
}: {
  name:
    | "home"
    | "search"
    | "filter"
    | "map"
    | "close"
    | "arrow"
    | "history"
    | "check"
    | "clock";
}) {
  const common = {
    className: "h-[17px] w-[17px]",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const shapes = {
    home: (
      <path d="m3 10 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    map: (
      <>
        <path d="M4 6.5 9 4l6 3 5-2.5v13L15 20l-6-3-5 2.5v-13Z" />
        <path d="M9 4v13M15 7v13" />
      </>
    ),
    close: (
      <>
        <path d="m7 7 10 10M17 7 7 17" />
      </>
    ),
    arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return <svg {...common}>{shapes[name]}</svg>;
}

export default function CarteraPage() {
  const [estado, setEstado] = useState<"Todos" | Estado>("Activo");
  const [etapa, setEtapa] = useState("Todas");
  const [tipo, setTipo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<"posiciones" | "lista">("posiciones");

  const [seleccionado, setSeleccionado] = useState<Inmueble | null>(null);
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);

  const [cargando, setCargando] = useState(true);
  const [cargandoPosiciones, setCargandoPosiciones] = useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    try {
      setError("");

      const [carteraResponse, posicionesResponse] = await Promise.all([
        fetch("/api/cartera", { cache: "no-store" }),
        fetch("/api/posiciones", { cache: "no-store" }),
      ]);

      const carteraData = await carteraResponse.json();
      const posicionesData = await posicionesResponse.json();

      if (!carteraResponse.ok) {
        throw new Error(
          carteraData.error || "No se pudo cargar la cartera."
        );
      }

      if (!posicionesResponse.ok) {
        throw new Error(
          posicionesData.error || "No se pudieron cargar las posiciones."
        );
      }

      setInmuebles(carteraData.inmuebles ?? []);
      setPosiciones(posicionesData.posiciones ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la información de cartera."
      );
    } finally {
      setCargando(false);
      setCargandoPosiciones(false);
    }
  }

  useEffect(() => {
    cargarDatos();

    const intervalo = window.setInterval(cargarDatos, 30000);

    return () => window.clearInterval(intervalo);
  }, []);

  const activos = useMemo(
    () => inmuebles.filter((x) => x.estado === "Activo"),
    [inmuebles]
  );

  const historicos = useMemo(
    () => inmuebles.filter((x) => x.estado === "Histórico"),
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

      return (
        (estado === "Todos" || x.estado === estado) &&
        (etapa === "Todas" || x.etapa === etapa) &&
        (tipo === "Todos" || x.tipo === tipo) &&
        coincideTexto
      );
    });
  }, [inmuebles, estado, etapa, tipo, busqueda]);

  const posicionesActivas = posiciones.filter((p) => !p.disponible);
  const posicionesDisponibles = posiciones.filter((p) => p.disponible);

  const activosCount = activos.length;
  const disponibles = posicionesDisponibles.length;

  const visitasPendientes = activos.filter(
    (x) => x.etapa === "Visita pendiente"
  ).length;

  const tasacionesPendientes = activos.filter(
    (x) => x.etapa === "Tasación pendiente"
  ).length;

  const aprobaciones = activos.filter(
    (x) => x.etapa === "Pendiente de aprobación"
  ).length;

  const negociacion = activos.filter(
    (x) => x.etapa === "En negociación"
  ).length;

  const listos = activos.filter(
    (x) => x.etapa === "Listo para publicar"
  ).length;

  const publicados = activos.filter(
    (x) => x.etapa === "Publicado"
  ).length;

  const capacidad = posiciones.length || 90;
  const porcentajeOcupacion =
    capacidad > 0 ? Math.min(100, (activosCount / capacidad) * 100) : 0;

  const limpiarFiltros = () => {
    setEstado("Activo");
    setEtapa("Todas");
    setTipo("Todos");
    setBusqueda("");
  };

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
    visitasPendientes +
    tasacionesPendientes +
    aprobaciones +
    negociacion;

  return (
    <main className="min-h-screen bg-[#f5f7fa] p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
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

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Control de las posiciones activas, seguimiento del flujo
              comercial y consulta separada del histórico.
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
          {([
            [
              "En cartera",
              activosCount,
              `de ${capacidad}`,
              "home" as const,
            ],
            [
              "Disponibles",
              disponibles,
              "posiciones libres",
              "map",
            ],
            [
              "Visitas",
              visitasPendientes,
              "pendientes",
              "clock",
            ],
            [
              "Tasaciones",
              tasacionesPendientes,
              "pendientes",
              "filter",
            ],
            [
              "Negociación",
              negociacion,
              "en seguimiento",
              "arrow",
            ],
            [
              "Publicados",
              publicados,
              "en seguimiento",
              "check",
            ],
          ] as const).map(([label, value, detail, icon]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {label}
                </span>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Icon name={icon} />
                </span>
              </div>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-950">
                  {value}
                </span>

                <span className="pb-0.5 text-[11px] text-slate-400">
                  {detail}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* FLUJO */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Flujo de trabajo
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Dónde está cada inmueble
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                El estado se actualiza desde la base de datos y representa la
                etapa actual del proceso comercial.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                ["01", "Visita", visitasPendientes],
                ["02", "Tasación", tasacionesPendientes],
                ["03", "Aprobación", aprobaciones],
                ["04", "Negociación", negociacion],
                ["05", "Publicación", listos],
              ].map(([number, label, value]) => (
                <div
                  key={String(number)}
                  className="rounded-xl border border-slate-200 bg-[#fafafa] px-3 py-2.5"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {number} · {label}
                  </p>

                  <p className="mt-0.5 text-lg font-bold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ATENCIÓN */}
        <section className="mt-3 rounded-2xl border border-[#eadede] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a90000]">
                Atención operativa
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {totalPendientes === 0
                  ? "No hay trabajo pendiente en las etapas iniciales."
                  : `${totalPendientes} inmueble${totalPendientes === 1 ? "" : "s"} requiere${totalPendientes === 1 ? "" : "n"} seguimiento.`}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Las cifras se calculan directamente desde las etapas actuales
                de la cartera.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["Visitas", visitasPendientes],
                ["Tasaciones", tasacionesPendientes],
                ["Aprobaciones", aprobaciones],
                ["Negociación", negociacion],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-slate-200 bg-[#fafafa] px-3 py-2.5"
                >
                  <p className="text-[10px] font-semibold text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

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
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por posición, ID, inmueble, ubicación o propietario..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <select
              value={estado}
              onChange={(e) =>
                setEstado(e.target.value as "Todos" | Estado)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
            >
              <option>Activo</option>
              <option>Todos</option>
              <option>Histórico</option>
            </select>

            <select
              value={etapa}
              onChange={(e) => setEtapa(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
            >
              <option>Todas</option>
              {Object.keys(etapaTone).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
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

            <div className="flex rounded-xl border border-slate-200 p-1">
              <button
                type="button"
                onClick={() => setVista("posiciones")}
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

            {(busqueda ||
              estado !== "Activo" ||
              etapa !== "Todas" ||
              tipo !== "Todos") && (
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

        {/* ENCABEZADO DE RESULTADOS */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              {estado === "Histórico"
                ? "Histórico de inmuebles"
                : "Posiciones de cartera"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Mostrando {filtrados.length} registro
              {filtrados.length === 1 ? "" : "s"} con los filtros actuales.
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
                : `${posiciones.length} posiciones administradas`}
            </span>
          </div>
        </div>

        {/* POSICIONES */}
        {vista === "posiciones" && estado !== "Histórico" ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
            {cargandoPosiciones ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                Consultando posiciones reales de la cartera…
              </div>
            ) : posiciones.length > 0 ? (
              posiciones.map((pos) => {
                const x = inmueblePorPosicion.get(pos.numero);

                return (
                  <button
                      key={pos.numero}
                      type="button"
                      onClick={() => x && setSeleccionado(x)}
                      disabled={!x}
                      className={`group min-h-[128px] rounded-2xl border p-3 text-left transition ${
                        x
                          ? "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                          : "border-dashed border-slate-200 bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className={`font-mono text-sm font-bold ${
                            x ? "text-slate-800" : "text-slate-300"
                          }`}
                        >
                          {String(pos.numero).padStart(2, "0")}
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

                          {x.etapa && (
                            <span
                              className={`mt-2 inline-block max-w-full truncate rounded-full px-2 py-1 text-[9px] font-semibold ${
                                etapaTone[x.etapa]
                              }`}
                            >
                              {x.etapa}
                            </span>
                          )}

                          {typeof x.progreso === "number" && (
                            <div className="mt-2">
                              <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-slate-800 transition-all"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, x.progreso)
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="mt-5">
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
                No se encontraron posiciones administradas en la base de datos.
              </div>
            )}
          </div>
        ) : (
          /* LISTA */
          <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Pos.</th>
                    <th className="px-5 py-3">Inmueble</th>
                    <th className="px-5 py-3">Ubicación</th>
                    <th className="px-5 py-3">Etapa</th>
                    <th className="px-5 py-3">Progreso</th>
                    <th className="px-5 py-3">Siguiente acción</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtrados.map((x) => (
                    <tr key={`${x.id}-${x.posicion ?? "sin-posicion"}`} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-[11px] font-semibold text-slate-400">
                        {x.id}
                      </td>

                      <td className="px-5 py-4 font-mono text-sm font-bold text-slate-700">
                        {x.posicion
                          ? String(x.posicion).padStart(2, "0")
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {x.nombre}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {x.tipo}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {x.ubicacion}
                      </td>

                      <td className="px-5 py-4">
                        {x.etapa ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${etapaTone[x.etapa]}`}
                          >
                            {x.etapa}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="w-28">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Avance</span>
                            <span>{x.progreso ?? 0}%</span>
                          </div>

                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-slate-800"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, x.progreso ?? 0)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {x.siguienteAccion ?? "Revisar inmueble"}
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                        {x.estado}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSeleccionado(x)}
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

        {filtrados.length === 0 && (
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
                  {activosCount} de {capacidad} posiciones ocupadas ·{" "}
                  {disponibles} disponibles para reutilización.
                </p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-800 transition-all duration-500"
                style={{ width: `${porcentajeOcupacion}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span>{porcentajeOcupacion.toFixed(0)}% ocupación</span>
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
              className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
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
                    {seleccionado.tipo} · {seleccionado.ubicacion}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSeleccionado(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <Icon name="close" />
                </button>
              </div>

              <div className="mt-6 space-y-4 rounded-2xl bg-[#f5f7fa] p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ID del inmueble
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-700">
                    {seleccionado.id}
                  </p>
                </div>

                {seleccionado.etapa && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Etapa actual
                      </p>
                      <span className="text-xs font-bold text-slate-600">
                        {seleccionado.progreso ?? 0}%
                      </span>
                    </div>

                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${etapaTone[seleccionado.etapa]}`}
                    >
                      {seleccionado.etapa}
                    </span>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-slate-800"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, seleccionado.progreso ?? 0)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Siguiente acción
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {seleccionado.siguienteAccion ?? "Revisar inmueble"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Propietario
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {seleccionado.propietario}
                  </p>
                </div>

                {seleccionado.motivoLiberacion && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Motivo de liberación
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {seleccionado.motivoLiberacion}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link
                  href={
                    "/datos-inmuebles?codigo=" +
                    encodeURIComponent(seleccionado.id)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  Ver ficha
                </Link>

                <button
                  type="button"
                  onClick={() => setSeleccionado(null)}
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
