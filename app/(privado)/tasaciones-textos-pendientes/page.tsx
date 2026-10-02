"use client";

import { useEffect, useState } from "react";

type Item = {
  inmuebleId: number;
  codigo: string;
  posicion: string;
  nombre: string;
  ubicacion: string;
  tipo: string;
  propietario: string;
  valorReferencia?: string | null;
  precioObjetivo?: string | null;
  situacion?: string | null;
  observacion?: string | null;
  fechaTasacion?: string | null;
};

type Publicada = {
  inmuebleId: number;
  codigo: string;
  tipo: string;
  referencia: string;
  posicion: number | null;
  publicado: boolean;
  fechaPublicacion: string | null;
  texto: string | null;
  driveLink: string | null;
};

function situacionLabel(value?: string | null) {
  switch (value) {
    case "pendiente_aprobacion":
      return "Pendiente de aprobación";
    case "en_negociacion":
      return "En negociación";
    case "aprobado":
      return "Aprobado";
    case "rechazado":
      return "Rechazado";
    default:
      return "Sin situación";
  }
}

function situacionClass(value?: string | null) {
  switch (value) {
    case "pendiente_aprobacion":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "en_negociacion":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "aprobado":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "rechazado":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function money(value?: string | null) {
  if (!value) return "—";

  const number = Number(value);

  if (!Number.isFinite(number)) return value;

  return `S/ ${number.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TasacionesTextosPendientesPage() {
  const [pendientes, setPendientes] = useState<Item[]>([]);
  const [registradas, setRegistradas] = useState<Item[]>([]);
  const [aprobadas, setAprobadas] = useState<Item[]>([]);

  const [textos, setTextos] = useState<Record<number, string>>({});
  const [enlaces, setEnlaces] = useState<Record<number, string>>({});

  const [textosListos, setTextosListos] = useState<
    Record<number, string>
  >({});

  const [enlacesListos, setEnlacesListos] = useState<
    Record<number, string>
  >({});

  const [situaciones, setSituaciones] = useState<
    Record<number, string>
  >({});

  const [observaciones, setObservaciones] = useState<
    Record<number, string>
  >({});

  /*
   * Controla qué tasaciones están en modo edición.
   * Si no está aquí, solamente se muestra el estado.
   */
  const [editandoSituacion, setEditandoSituacion] =
    useState<Record<number, boolean>>({});

  const [listos, setListos] = useState<Publicada[]>([]);

  const [publicadas, setPublicadas] = useState<Publicada[]>(
  []
);

  const [cargando, setCargando] = useState(true);

  const [guardando, setGuardando] = useState<number | null>(
    null
  );

  const [actualizando, setActualizando] = useState<
    number | null
  >(null);

  const [actualizandoMaterial, setActualizandoMaterial] =
    useState<number | null>(null);

  const [publicando, setPublicando] = useState<number | null>(
    null
  );

  /*
   * Inmueble seleccionado para confirmar publicación.
   */
  const [confirmarPublicacion, setConfirmarPublicacion] =
    useState<Publicada | null>(null);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setCargando(true);
      setError("");

      const [
        tasacionesResponse,
        publicacionesResponse,
      ] = await Promise.all([
        fetch("/api/tasaciones", {
          cache: "no-store",
        }),

        fetch("/api/publicaciones", {
          cache: "no-store",
        }),
      ]);

      const tasacionesData =
        await tasacionesResponse.json();

      const publicacionesData =
        await publicacionesResponse.json();

      if (!tasacionesResponse.ok || !tasacionesData.ok) {
        throw new Error(
          tasacionesData.error ||
            "No se pudieron cargar las tasaciones."
        );
      }

      if (
        !publicacionesResponse.ok ||
        !publicacionesData.ok
      ) {
        throw new Error(
          publicacionesData.error ||
            "No se pudieron cargar las publicaciones."
        );
      }

      const registradasData: Item[] =
        tasacionesData.registradas ?? [];

      const pendientesPublicacion: Item[] =
        publicacionesData.pendientes ?? [];

      const listosData: Publicada[] =
        publicacionesData.listos ?? [];

        const publicadasData: Publicada[] =
  publicacionesData.publicadas ?? [];

      setPendientes(tasacionesData.pendientes ?? []);
      setRegistradas(registradasData);
      setAprobadas(pendientesPublicacion);
      setListos(listosData);
setPublicadas(publicadasData);

      const nextSituaciones: Record<number, string> = {};
      const nextObservaciones: Record<number, string> = {};

      for (const item of registradasData) {
        if (item.situacion) {
          nextSituaciones[item.inmuebleId] =
            item.situacion;
        }

        nextObservaciones[item.inmuebleId] =
          item.observacion ?? "";
      }

      setSituaciones(nextSituaciones);
      setObservaciones(nextObservaciones);

      const nextTextosListos: Record<number, string> = {};
      const nextEnlacesListos: Record<number, string> = {};

      for (const item of listosData) {
        nextTextosListos[item.inmuebleId] =
          item.texto ?? "";

        nextEnlacesListos[item.inmuebleId] =
          item.driveLink ?? "";
      }

      setTextosListos(nextTextosListos);
      setEnlacesListos(nextEnlacesListos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la bandeja."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const pendientesAprobacion = registradas.filter(
    (item) =>
      item.situacion === "pendiente_aprobacion"
  );

  const enNegociacion = registradas.filter(
    (item) =>
      item.situacion === "en_negociacion"
  );

  const rechazadas = registradas.filter(
    (item) => item.situacion === "rechazado"
  );

  function comenzarEdicionSituacion(item: Item) {
    setEditandoSituacion((current) => ({
      ...current,
      [item.inmuebleId]: true,
    }));

    setMensaje("");
    setError("");
  }

  function cancelarEdicionSituacion(item: Item) {
    setSituaciones((current) => ({
      ...current,
      [item.inmuebleId]:
        item.situacion ?? "",
    }));

    setObservaciones((current) => ({
      ...current,
      [item.inmuebleId]:
        item.observacion ?? "",
    }));

    setEditandoSituacion((current) => ({
      ...current,
      [item.inmuebleId]: false,
    }));
  }

  async function actualizarSituacion(item: Item) {
    const situacion =
      situaciones[item.inmuebleId] ||
      item.situacion;

    if (!situacion) return;

    try {
      setActualizando(item.inmuebleId);
      setMensaje("");
      setError("");

      const response = await fetch(
        "/api/tasaciones",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inmuebleId: item.inmuebleId,
            situacion,
            observacion:
              observaciones[item.inmuebleId] ?? "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "No se pudo actualizar la situación."
        );
      }

      setEditandoSituacion((current) => ({
        ...current,
        [item.inmuebleId]: false,
      }));

      setMensaje(
        `${item.codigo} actualizado correctamente.`
      );

      await cargar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la situación."
      );
    } finally {
      setActualizando(null);
    }
  }

  async function guardarTexto(item: Item) {
    const texto = (
      textos[item.inmuebleId] || ""
    ).trim();

    const driveLink = (
      enlaces[item.inmuebleId] || ""
    ).trim();

    if (!texto) {
      setError(
        "Ingresa el texto de publicación."
      );
      return;
    }

    if (!/^https?:\/\//i.test(driveLink)) {
      setError(
        "El enlace de Google Drive debe ser una URL HTTP o HTTPS."
      );
      return;
    }

    try {
      setGuardando(item.inmuebleId);
      setMensaje("");
      setError("");

      const response = await fetch(
        "/api/publicaciones",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inmuebleId: item.inmuebleId,
            texto,
            driveLink,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "No se pudo registrar la publicación."
        );
      }

      setMensaje(
        `${item.codigo} quedó listo para publicar.`
      );

      await cargar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el texto."
      );
    } finally {
      setGuardando(null);
    }
  }

  async function actualizarMaterial(item: Publicada) {
    const texto = (
      textosListos[item.inmuebleId] ??
      item.texto ??
      ""
    ).trim();

    const driveLink = (
      enlacesListos[item.inmuebleId] ??
      item.driveLink ??
      ""
    ).trim();

    if (!texto) {
      setError(
        "El texto de publicación es obligatorio."
      );
      return;
    }

    if (!/^https?:\/\//i.test(driveLink)) {
      setError(
        "El enlace de Google Drive debe ser una URL HTTP o HTTPS."
      );
      return;
    }

    try {
      setActualizandoMaterial(
        item.inmuebleId
      );

      setMensaje("");
      setError("");

      const response = await fetch(
        "/api/publicaciones",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inmuebleId: item.inmuebleId,
            texto,
            driveLink,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "No se pudo actualizar el material."
        );
      }

      setMensaje(
        `${item.codigo} fue actualizado correctamente.`
      );

      await cargar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el material."
      );
    } finally {
      setActualizandoMaterial(null);
    }
  }

  function solicitarPublicacion(item: Publicada) {
    setMensaje("");
    setError("");
    setConfirmarPublicacion(item);
  }

  async function confirmarMarcarPublicado() {
    if (!confirmarPublicacion) return;

    const item = confirmarPublicacion;

    try {
      setPublicando(item.inmuebleId);
      setMensaje("");
      setError("");

      const response = await fetch(
        "/api/publicaciones",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inmuebleId: item.inmuebleId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "No se pudo marcar la publicación."
        );
      }

      setConfirmarPublicacion(null);

      setMensaje(
        `${item.codigo} fue marcado como publicado.`
      );

      await cargar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo marcar como publicado."
      );
    } finally {
      setPublicando(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ENCABEZADO */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c80000]">
              Fase 1 · Seguimiento
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Tasaciones y textos pendientes
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Bandeja central para continuar el inmueble
              después de la visita: tasación, aprobación,
              texto, material, publicación y seguimiento
              comercial.
            </p>
          </div>

          <a
            href="/registrar-tasaciones"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-black"
          >
            Registrar tasaciones
          </a>
        </div>

        {/* MENSAJES */}

        {mensaje && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* RESUMEN */}

        <section className="mb-7 rounded-3xl bg-[#171717] p-5 text-white shadow-sm sm:p-6">
          <div className="mb-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              Bandeja de seguimiento
            </div>

            <h2 className="mt-1 text-lg font-bold">
              Qué necesita atención ahora
            </h2>

            <p className="mt-1 text-sm text-white/55">
              El inmueble avanza por actividades reales,
              no por una etapa artificial.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-white/[0.07] p-4">
              <div className="text-xs text-white/45">
                Por tasar
              </div>

              <div className="mt-2 text-2xl font-bold">
                {pendientes.length}
              </div>

              <div className="mt-1 text-[11px] text-white/40">
                Visita realizada
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.07] p-4">
              <div className="text-xs text-white/45">
                Aprobación
              </div>

              <div className="mt-2 text-2xl font-bold">
                {pendientesAprobacion.length}
              </div>

              <div className="mt-1 text-[11px] text-white/40">
                Tasación registrada
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.07] p-4">
              <div className="text-xs text-white/45">
                Texto
              </div>

              <div className="mt-2 text-2xl font-bold">
                {aprobadas.length}
              </div>

              <div className="mt-1 text-[11px] text-white/40">
                Tasación aprobada
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.07] p-4">
              <div className="text-xs text-white/45">
                Negociación
              </div>

              <div className="mt-2 text-2xl font-bold">
                {enNegociacion.length}
              </div>

              <div className="mt-1 text-[11px] text-white/40">
                Seguimiento comercial
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.07] p-4">
              <div className="text-xs text-white/45">
                Listos
              </div>

              <div className="mt-2 text-2xl font-bold">
                {listos.length}
              </div>

              <div className="mt-1 text-[11px] text-white/40">
                Para publicar
              </div>
            </div>
          </div>
        </section>

        {cargando ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Cargando bandeja de seguimiento...
          </div>
        ) : (
          <div className="space-y-7">
            {/* =====================================================
                01 · POR REGISTRAR TASACIÓN
               ===================================================== */}

            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    01 · Por registrar tasación
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Inmuebles con visita realizada que
                    todavía no tienen tasación registrada.
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
                  {pendientes.length}
                </span>
              </div>

              {pendientes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  No hay inmuebles pendientes de registrar
                  tasación.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendientes.map((item) => (
                    <div
                      key={item.inmuebleId}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-[#fff1f1] px-2.5 py-1 text-[11px] font-bold text-[#c80000]">
                              Pos. {item.posicion}
                            </span>

                            <span className="text-xs font-semibold text-slate-400">
                              {item.codigo}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900">
                            {item.nombre}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.tipo} · {item.ubicacion}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            Propietario: {item.propietario}
                          </p>
                        </div>

                        <a
                          href="/registrar-tasaciones"
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Registrar tasación
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* =====================================================
                02 · TASACIONES REGISTRADAS
               ===================================================== */}

            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    02 · Tasaciones registradas
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Aquí se consulta la situación actual de
                    cada tasación y se modifica solo cuando
                    sea necesario.
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
                  {registradas.length}
                </span>
              </div>

              {registradas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Todavía no hay tasaciones registradas.
                </div>
              ) : (
                <div className="space-y-3">
                  {registradas.map((item) => {
                    const estaEditando =
                      editandoSituacion[
                        item.inmuebleId
                      ] === true;

                    const situacionActual =
                      situaciones[
                        item.inmuebleId
                      ] ??
                      item.situacion ??
                      "";

                    const observacionActual =
                      observaciones[
                        item.inmuebleId
                      ] ??
                      item.observacion ??
                      "";

                    return (
                      <div
                        key={item.inmuebleId}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          {/* INFORMACIÓN DEL INMUEBLE */}

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-lg bg-[#fff1f1] px-2.5 py-1 text-[11px] font-bold text-[#c80000]">
                                Pos. {item.posicion}
                              </span>

                              <span className="text-xs font-semibold text-slate-400">
                                {item.codigo}
                              </span>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${situacionClass(
                                  item.situacion
                                )}`}
                              >
                                {situacionLabel(
                                  item.situacion
                                )}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-slate-900">
                              {item.nombre}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {item.tipo} · {item.ubicacion}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                              Propietario: {item.propietario}
                            </p>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl bg-slate-50 p-3">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  Valor de referencia
                                </div>

                                <div className="mt-1 text-sm font-bold text-slate-800">
                                  {money(
                                    item.valorReferencia
                                  )}
                                </div>
                              </div>

                              <div className="rounded-xl bg-slate-50 p-3">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  Precio objetivo
                                </div>

                                <div className="mt-1 text-sm font-bold text-slate-800">
                                  {money(
                                    item.precioObjetivo
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ESTADO / EDICIÓN */}

                          <div className="w-full lg:max-w-sm">
                            {!estaEditando ? (
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                  Situación actual
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${situacionClass(
                                      item.situacion
                                    )}`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        item.situacion ===
                                        "aprobado"
                                          ? "bg-emerald-500"
                                          : item.situacion ===
                                            "rechazado"
                                          ? "bg-red-500"
                                          : item.situacion ===
                                            "en_negociacion"
                                          ? "bg-blue-500"
                                          : "bg-amber-500"
                                      }`}
                                    />

                                    {situacionLabel(
                                      item.situacion
                                    )}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      comenzarEdicionSituacion(
                                        item
                                      )
                                    }
                                    className="text-xs font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-[#c80000]"
                                  >
                                    Modificar situación
                                  </button>
                                </div>

                                <div className="mt-4">
                                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                    Observación
                                  </div>

                                  <p className="mt-1 text-sm leading-5 text-slate-600">
                                    {item.observacion?.trim()
                                      ? item.observacion
                                      : "Sin observaciones registradas."}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-slate-200 bg-white">
                                <div className="border-b border-slate-100 px-4 py-3">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                    Modificar situación
                                  </div>

                                  <p className="mt-1 text-xs text-slate-500">
                                    Cambia el estado solo si
                                    la situación comercial ha
                                    variado.
                                  </p>
                                </div>

                                <div className="p-4">
                                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                                    Situación
                                  </label>

                                  <select
                                    value={
                                      situacionActual
                                    }
                                    onChange={(event) =>
                                      setSituaciones(
                                        (current) => ({
                                          ...current,
                                          [item.inmuebleId]:
                                            event.target
                                              .value,
                                        })
                                      )
                                    }
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#c80000]"
                                  >
                                    <option value="pendiente_aprobacion">
                                      Pendiente de aprobación
                                    </option>

                                    <option value="aprobado">
                                      Aprobado
                                    </option>

                                    <option value="en_negociacion">
                                      En negociación
                                    </option>

                                    <option value="rechazado">
                                      Rechazado
                                    </option>
                                  </select>

                                  <label className="mt-3 mb-1.5 block text-xs font-bold text-slate-600">
                                    Observación
                                  </label>

                                  <textarea
                                    value={
                                      observacionActual
                                    }
                                    onChange={(event) =>
                                      setObservaciones(
                                        (current) => ({
                                          ...current,
                                          [item.inmuebleId]:
                                            event.target
                                              .value,
                                        })
                                      )
                                    }
                                    rows={3}
                                    placeholder="Anota la situación comercial o decisión del propietario..."
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#c80000]"
                                  />

                                  <div className="mt-3 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        cancelarEdicionSituacion(
                                          item
                                        )
                                      }
                                      disabled={
                                        actualizando ===
                                        item.inmuebleId
                                      }
                                      className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                    >
                                      Cancelar
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        actualizarSituacion(
                                          item
                                        )
                                      }
                                      disabled={
                                        actualizando ===
                                        item.inmuebleId
                                      }
                                      className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[#171717] px-3 text-xs font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {actualizando ===
                                      item.inmuebleId
                                        ? "Guardando..."
                                        : "Guardar cambios"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* =====================================================
                03 · TEXTO Y MATERIAL
               ===================================================== */}

            <section>
              <div className="mb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  03 · Texto y material
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Solo aparecen inmuebles cuya tasación ya
                  fue aprobada y todavía no tienen una
                  publicación registrada.
                </p>
              </div>

              {aprobadas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  No hay tasaciones aprobadas pendientes de
                  preparar texto.
                </div>
              ) : (
                <div className="space-y-4">
                  {aprobadas.map((item) => (
                    <div
                      key={item.inmuebleId}
                      className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            Pos. {item.posicion}
                          </span>

                          <span className="text-xs font-semibold text-slate-400">
                            {item.codigo}
                          </span>
                        </div>

                        <h3 className="mt-2 text-base font-bold text-slate-900">
                          {item.nombre}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.tipo} · {item.ubicacion}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          Propietario: {item.propietario}
                        </p>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-slate-600">
                            Texto de publicación
                          </label>

                          <textarea
                            value={
                              textos[
                                item.inmuebleId
                              ] ?? ""
                            }
                            onChange={(event) =>
                              setTextos(
                                (current) => ({
                                  ...current,
                                  [item.inmuebleId]:
                                    event.target.value,
                                })
                              )
                            }
                            rows={7}
                            placeholder="Redacta aquí el texto comercial del inmueble..."
                            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#c80000]"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-slate-600">
                            Material / Google Drive
                          </label>

                          <input
                            type="url"
                            value={
                              enlaces[
                                item.inmuebleId
                              ] ?? ""
                            }
                            onChange={(event) =>
                              setEnlaces(
                                (current) => ({
                                  ...current,
                                  [item.inmuebleId]:
                                    event.target.value,
                                })
                              )
                            }
                            placeholder="https://drive.google.com/..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#c80000]"
                          />

                          <div className="mt-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                            Coloca aquí el enlace donde se
                            encuentra el material preparado
                            para la publicación.
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              guardarTexto(item)
                            }
                            disabled={
                              guardando ===
                              item.inmuebleId
                            }
                            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#c80000] px-4 text-xs font-bold text-white transition hover:bg-[#a90000] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {guardando ===
                            item.inmuebleId
                              ? "Guardando..."
                              : "Guardar y dejar listo para publicar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* =====================================================
                04 · LISTOS PARA PUBLICAR
               ===================================================== */}

            <section>
              <div className="mb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  04 · Listos para publicar
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Material y texto registrados. Puedes
                  revisarlos o modificarlos antes de confirmar
                  que la publicación fue realizada.
                </p>
              </div>

              {listos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  No hay inmuebles listos para publicar.
                </div>
              ) : (
                <div className="space-y-4">
                  {listos.map((item) => {
                    const textoActual =
                      textosListos[item.inmuebleId] ??
                      item.texto ??
                      "";

                    const enlaceActual =
                      enlacesListos[item.inmuebleId] ??
                      item.driveLink ??
                      "";

                    return (
                      <div
                        key={item.inmuebleId}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-lg bg-[#fff1f1] px-2.5 py-1 text-[11px] font-bold text-[#c80000]">
                                Pos.{" "}
                                {item.posicion
                                  ? String(
                                      item.posicion
                                    ).padStart(2, "0")
                                  : "—"}
                              </span>

                              <span className="text-xs font-semibold text-slate-400">
                                {item.codigo}
                              </span>

                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                Listo para publicar
                              </span>
                            </div>

                            <h3 className="mt-2 text-base font-bold text-slate-900">
                              {item.referencia}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {item.tipo}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-600">
                              Texto de publicación
                            </label>

                            <textarea
                              value={textoActual}
                              onChange={(event) =>
                                setTextosListos(
                                  (current) => ({
                                    ...current,
                                    [item.inmuebleId]:
                                      event.target.value,
                                  })
                                )
                              }
                              rows={7}
                              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#c80000]"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-600">
                              Material / Google Drive
                            </label>

                            <input
                              type="url"
                              value={enlaceActual}
                              onChange={(event) =>
                                setEnlacesListos(
                                  (current) => ({
                                    ...current,
                                    [item.inmuebleId]:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder="https://drive.google.com/..."
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#c80000]"
                            />

                            {enlaceActual &&
                              /^https?:\/\//i.test(
                                enlaceActual
                              ) && (
                                <a
                                  href={enlaceActual}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:underline"
                                >
                                  Abrir material en Google Drive ↗
                                </a>
                              )}

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                onClick={() =>
                                  actualizarMaterial(
                                    item
                                  )
                                }
                                disabled={
                                  actualizandoMaterial ===
                                  item.inmuebleId
                                }
                                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[#c80000] px-4 text-xs font-bold text-white transition hover:bg-[#a90000] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actualizandoMaterial ===
                                item.inmuebleId
                                  ? "Guardando..."
                                  : "Guardar cambios"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  solicitarPublicacion(
                                    item
                                  )
                                }
                                disabled={
                                  publicando ===
                                  item.inmuebleId
                                }
                                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[#171717] px-4 text-xs font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Marcar como publicado
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>




{/* =====================================================
    05 · PUBLICADOS
   ===================================================== */}

<section>
  <div className="mb-3 flex items-end justify-between">
    <div>
      <h2 className="text-lg font-bold text-slate-900">
        05 · Publicados
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Inmuebles cuya publicación ya fue realizada.
      </p>
    </div>

    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
      {publicadas.length}
    </span>
  </div>

  {publicadas.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
      Todavía no hay publicaciones realizadas.
    </div>
  ) : (
    <div className="space-y-4">
      {publicadas.map((item) => {
        const fecha = item.fechaPublicacion
          ? new Date(
              item.fechaPublicacion
            ).toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "Fecha no registrada";

        return (
          <div
            key={item.inmuebleId}
            className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-[#fff1f1] px-2.5 py-1 text-[11px] font-bold text-[#c80000]">
                    Pos.{" "}
                    {item.posicion
                      ? String(item.posicion).padStart(
                          2,
                          "0"
                        )
                      : "—"}
                  </span>

                  <span className="text-xs font-semibold text-slate-400">
                    {item.codigo}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Publicado
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900">
                  {item.referencia}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {item.tipo}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50/60 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      Fecha de publicación
                    </div>

                    <div className="mt-1 text-sm font-bold text-slate-800">
                      {fecha}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Estado
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-sm font-bold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Publicación realizada
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:max-w-xs">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Material publicado
                  </div>

                  {item.driveLink ? (
                    <a
                      href={item.driveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-white px-4 text-xs font-bold text-blue-600 ring-1 ring-slate-200 transition hover:bg-blue-50"
                    >
                      Abrir material en Google Drive ↗
                    </a>
                  ) : (
                    <div className="mt-3 text-xs text-slate-400">
                      No hay enlace de material registrado.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {item.texto && (
              <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50">
                <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-slate-600">
                  Ver texto de publicación
                </summary>

                <div className="border-t border-slate-200 px-4 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {item.texto}
                  </p>
                </div>
              </details>
            )}
          </div>
        );
      })}
    </div>
  )}
</section>





            {/* =====================================================
                06 · EN NEGOCIACIÓN
               ===================================================== */}

            {enNegociacion.length > 0 && (
              <section>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-slate-900">
                    05 · En negociación
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Inmuebles que ya pasaron a seguimiento
                    comercial.
                  </p>
                </div>

                <div className="space-y-3">
                  {enNegociacion.map((item) => (
                    <div
                      key={item.inmuebleId}
                      className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                              Pos. {item.posicion}
                            </span>

                            <span className="text-xs font-semibold text-slate-400">
                              {item.codigo}
                            </span>
                          </div>

                          <h3 className="mt-2 text-base font-bold text-slate-900">
                            {item.nombre}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.tipo} · {item.ubicacion}
                          </p>
                        </div>

                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                          En negociación
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* =====================================================
                RECHAZADAS
               ===================================================== */}

            {rechazadas.length > 0 && (
              <section>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-slate-900">
                    Tasaciones rechazadas
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Se conservan aquí para trazabilidad y
                    seguimiento.
                  </p>
                </div>

                <div className="space-y-3">
                  {rechazadas.map((item) => (
                    <div
                      key={item.inmuebleId}
                      className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
                              Pos. {item.posicion}
                            </span>

                            <span className="text-xs font-semibold text-slate-400">
                              {item.codigo}
                            </span>
                          </div>

                          <h3 className="mt-2 text-base font-bold text-slate-900">
                            {item.nombre}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.observacion ||
                              "Sin observación registrada."}
                          </p>
                        </div>

                        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                          Rechazado
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          MODAL DE CONFIRMACIÓN DE PUBLICACIÓN
         ========================================================= */}

      {confirmarPublicacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmarPublicacion(null);
            }
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-publicacion-title"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12.5 9.5 17 19 7.5"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h2
                    id="modal-publicacion-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    Confirmar publicación
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Estás a punto de marcar este inmueble
                    como publicado.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-[#fff1f1] px-2.5 py-1 text-[11px] font-bold text-[#c80000]">
                    Pos.{" "}
                    {confirmarPublicacion.posicion
                      ? String(
                          confirmarPublicacion.posicion
                        ).padStart(2, "0")
                      : "—"}
                  </span>

                  <span className="text-xs font-semibold text-slate-400">
                    {confirmarPublicacion.codigo}
                  </span>
                </div>

                <div className="mt-2 text-sm font-bold text-slate-900">
                  {confirmarPublicacion.referencia}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {confirmarPublicacion.tipo}
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-400">
                Esta acción registrará la fecha de publicación
                y moverá el inmueble fuera de la bandeja
                “Listos para publicar”.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setConfirmarPublicacion(null)
                }
                disabled={publicando !== null}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarMarcarPublicado}
                disabled={publicando !== null}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#171717] px-5 text-xs font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publicando !== null
                  ? "Confirmando..."
                  : "Sí, marcar como publicado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}