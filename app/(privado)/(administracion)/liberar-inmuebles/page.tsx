"use client";

import PageHeading from "@/app/components/PageHeading";

import { requestJson } from "@/lib/client-request";

import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useCallback, useEffect, useMemo, useState } from "react";

type Item = {
  inmuebleId: number;
  codigo: string;
  posicion: string;
  nombre: string;
  ubicacion: string;
  tipo: string;
  propietario: string;
  dni: string;
  etapa: string;
};

const motivos = [
  { value: "vendido", label: "Vendido" },
  {
    value: "cancelacion_propietario",
    label: "Cancelación del propietario",
  },
  {
    value: "cancelacion_externa",
    label: "Cancelación externa",
  },
  { value: "otro", label: "Otro" },
];

export default function Page() {
  const [confirmation, setConfirmation] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [selecciones, setSelecciones] = useState<Record<number, string>>({});
  const [detalles, setDetalles] = useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback((signal?: AbortSignal) => {
    return requestJson<{ items: Item[] }>("/api/liberaciones", { signal }).then(data => {
      if (signal?.aborted) return;
      setItems(data.items ?? []);
    }).catch(error => {
      if (!signal?.aborted) setError(error instanceof Error ? error.message : "No se pudieron cargar los inmuebles.");
    }).finally(() => {
      if (!signal?.aborted) setCargando(false);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void cargar(controller.signal);
    return () => controller.abort();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (!q) return items;

    return items.filter((x) =>
      [
        x.codigo,
        x.nombre,
        x.ubicacion,
        x.propietario,
        x.dni,
        x.posicion,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, busqueda]);

  const liberar = async (item: Item, confirmed = false) => {
    if (guardando !== null) return;
    setError("");
    setMensaje("");

    const motivo = selecciones[item.inmuebleId] ?? "";
    const detalleOtro = detalles[item.inmuebleId]?.trim() ?? "";

    if (!motivo) {
      setError(`Selecciona el motivo para “${item.nombre}”.`);
      return;
    }

    if (motivo === "otro" && !detalleOtro) {
      setError(
        `Indica el detalle del motivo para “${item.nombre}”.`
      );
      return;
    }

    if (!confirmed) { setConfirmation(item); return; }

    try {
      setGuardando(item.inmuebleId);

      const response = await fetch("/api/liberaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inmuebleId: item.inmuebleId,
          motivo,
          detalleOtro,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || "No fue posible liberar el inmueble."
        );
      }

      setMensaje(
        `“${item.nombre}” fue liberado correctamente. La posición ${item.posicion} queda disponible.`
      );

      setConfirmation(null);
      setCargando(true);
      await cargar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible liberar el inmueble."
      );
    } finally {
      setGuardando(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] p-4 sm:p-6 lg:p-8">
      {confirmation && <ConfirmDialog title="Confirmar liberación" confirmLabel="Liberar inmueble" busy={guardando !== null} onCancel={() => setConfirmation(null)} onConfirm={() => { void liberar(confirmation, true); }}>
        <p className="break-words font-semibold">{confirmation.nombre} · Posición {confirmation.posicion}</p>
        <p>El inmueble saldrá de la cartera activa y su posición quedará disponible. Su ficha, archivos e historial se conservarán.</p>
        {error && <p role="alert" className="text-red-700">{error}</p>}
      </ConfirmDialog>}
      <div className="mx-auto max-w-[1380px]">
        {/* ENCABEZADO */}
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <PageHeading href="/liberar-inmuebles" />

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Registra la salida de un inmueble de la cartera activa. La
                posición quedará disponible y el histórico del inmueble se
                conservará.
              </p>
            </div>

            <div className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Cartera activa
              </p>

              <p className="mt-1 text-lg font-bold text-slate-950">
                {items.length}
                <span className="ml-1 text-xs font-medium text-slate-400">
                  inmuebles
                </span>
              </p>
            </div>
          </div>
        </header>

        {/* PROCESO */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Antes de liberar
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  Selecciona el inmueble, registra el motivo y confirma la
                  salida.
                </p>
              </div>

              <span className="w-fit rounded-full bg-[#fff1f1] px-3 py-1.5 text-[10px] font-bold text-[#a90000]">
                La posición será reutilizable
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3">
            {[
              {
                numero: "01",
                titulo: "Seleccionar",
                detalle: "Inmueble activo",
              },
              {
                numero: "02",
                titulo: "Registrar motivo",
                detalle: "Causa de salida",
              },
              {
                numero: "03",
                titulo: "Confirmar",
                detalle: "Posición disponible",
              },
            ].map((paso, index) => (
              <div
                key={paso.numero}
                className={`flex items-center gap-3 px-5 py-4 ${
                  index > 0
                    ? "border-t border-slate-100 sm:border-l sm:border-t-0"
                    : ""
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    index === 0
                      ? "bg-[#c80000] text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {paso.numero}
                </span>

                <div>
                  <p className="text-xs font-bold text-slate-700">
                    {paso.titulo}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {paso.detalle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AVISOS */}
        {mensaje && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-[#d9eadf] bg-[#f3faf5] p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#18713b] text-sm font-bold text-white">
              ✓
            </span>

            <div>
              <p className="text-sm font-bold text-[#18713b]">
                Liberación realizada
              </p>

              <p className="mt-1 text-xs leading-5 text-[#2f6f48]">
                {mensaje}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-[#ead1d1] bg-[#fff7f7] p-4">
            <p className="text-sm font-bold text-[#a90000]">
              No se pudo completar la operación
            </p>

            <p className="mt-1 text-xs leading-5 text-[#a90000]">
              {error}
            </p>
          </div>
        )}

        {/* BUSCADOR */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Inmuebles activos
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Busca el inmueble que deseas retirar de la cartera.
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">
              {filtrados.length} resultado
              {filtrados.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-600">
              Buscar inmueble

              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Código, nombre, propietario, DNI, ubicación o posición..."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafafa] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#c80000] focus:bg-white focus:ring-2 focus:ring-[#f5dede]"
              />
            </label>
          </div>
        </section>

        {/* LISTADO */}
        <section>
          {cargando ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
              Cargando cartera activa...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                {items.length === 0 ? "✓" : "⌕"}
              </div>

              <h2 className="mt-4 font-bold text-slate-900">
                {items.length === 0
                  ? "No hay inmuebles activos"
                  : "No hay coincidencias"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {items.length === 0
                  ? "Cuando existan inmuebles activos aparecerán aquí para registrar su salida."
                  : "Prueba con otro término de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filtrados.map((item) => {
                const motivo = selecciones[item.inmuebleId] ?? "";

                return (
                  <article
                    key={item.inmuebleId}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* IDENTIDAD */}
                    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff1f1] text-sm font-bold text-[#a90000]">
                            {item.posicion}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900">
                                {item.nombre}
                              </h3>

                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                {item.tipo}
                              </span>

                              <span className="rounded-full bg-[#edf8f1] px-2.5 py-1 text-[10px] font-bold text-[#18713b]">
                                Activo
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.ubicacion || "Ubicación pendiente"} ·{" "}
                              {item.codigo}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Propietario:{" "}
                              <span className="font-medium text-slate-700">
                                {item.propietario || "Pendiente"}
                              </span>

                              {item.dni && (
                                <>
                                  {" "}
                                  · DNI {item.dni}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Posición {item.posicion}
                          </span>
                          <br />
                          quedará disponible
                        </div>
                      </div>
                    </div>

                    {/* MOTIVO */}
                    <div className="p-5 sm:p-6">
                      <div className="grid gap-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
                        <div>
                          <label className="text-xs font-bold text-slate-600">
                            Motivo de liberación{" "}
                            <span className="text-[#c80000]">*</span>

                            <select
                              value={motivo}
                              onChange={(e) =>
                                setSelecciones((c) => ({
                                  ...c,
                                  [item.inmuebleId]: e.target.value,
                                }))
                              }
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-[#c80000] focus:ring-2 focus:ring-[#f5dede]"
                            >
                              <option value="">
                                Seleccionar motivo
                              </option>

                              {motivos.map((m) => (
                                <option key={m.value} value={m.value}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        {motivo === "otro" ? (
                          <div>
                            <label className="text-xs font-bold text-slate-600">
                              Detalle del motivo{" "}
                              <span className="text-[#c80000]">*</span>

                              <input
                                value={
                                  detalles[item.inmuebleId] ?? ""
                                }
                                onChange={(e) =>
                                  setDetalles((c) => ({
                                    ...c,
                                    [item.inmuebleId]: e.target.value,
                                  }))
                                }
                                placeholder="Describe brevemente el motivo..."
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#c80000] focus:ring-2 focus:ring-[#f5dede]"
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-[#faf9f7] p-4">
                            <span className="mt-0.5 text-sm text-slate-400">
                              ⓘ
                            </span>

                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                Registro de salida
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                La liberación conservará la fecha, el motivo
                                y la trazabilidad del usuario. El inmueble no
                                será eliminado del histórico.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CONFIRMACIÓN */}
                      <div className="mt-5 rounded-2xl border border-[#ead1d1] bg-[#fff7f7] p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff1f1] text-sm font-bold text-[#c80000]">
                              !
                            </span>

                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                ¿Retirar este inmueble de la cartera?
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Al confirmar, dejará de estar activo y la
                                posición{" "}
                                <strong className="text-slate-700">
                                  {item.posicion}
                                </strong>{" "}
                                podrá utilizarse para otro inmueble.
                              </p>
                            </div>
                          </div>

                          <button
                            disabled={guardando !== null}
                            onClick={() => liberar(item)}
                            className="shrink-0 rounded-xl bg-[#c80000] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#ad0000] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                          >
                            {guardando === item.inmuebleId
                              ? "Liberando..."
                              : "Confirmar liberación"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}