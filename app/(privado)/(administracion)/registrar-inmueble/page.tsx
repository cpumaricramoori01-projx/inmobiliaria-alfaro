"use client";

import PageHeading from "@/app/components/PageHeading";



import { requestJson } from "@/lib/client-request";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Tipo =
  | "Casa"
  | "Departamento"
  | "Terreno"
  | "Local"
  | "Oficina"
  | "Otros";

type Posicion = {
  numero: number;
  disponible: boolean;
};

export default function RegistrarInmueblePage() {
  const [seleccionPosicion, setPosicion] = useState("");
  const [posicionSolicitada, setPosicionSolicitada] = useState<string | null>(
    null
  );
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [cargandoPosiciones, setCargandoPosiciones] = useState(true);
  const [tipo, setTipo] = useState<Tipo | "">("");
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [dni, setDni] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [propietarioEncontrado, setPropietarioEncontrado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarPosiciones = useCallback((signal?: AbortSignal) => {
    return requestJson<{ posiciones: Posicion[] }>("/api/posiciones", { signal }).then(data => {
      if (signal?.aborted) return;
      setPosicionSolicitada(new URLSearchParams(window.location.search).get("posicion"));
      setPosiciones(data.posiciones ?? []);
    }).catch(error => {
      if (!signal?.aborted) setError(error instanceof Error ? error.message : "No fue posible consultar las posiciones.");
    }).finally(() => {
      if (!signal?.aborted) setCargandoPosiciones(false);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void cargarPosiciones(controller.signal);
    return () => controller.abort();
  }, [cargarPosiciones]);

  async function buscarPropietario() {
    setError("");
    setMensaje("");
    setPropietarioEncontrado(false);

    if (!/^\d{8}$/.test(dni)) return;

    setBuscando(true);

    try {
      const response = await fetch(`/api/propietarios?dni=${dni}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No fue posible consultar el propietario."
        );
      }

      if (data.propietario) {
        setNombres(data.propietario.nombres);
        setApellidos(data.propietario.apellidos);
        setTelefono(data.propietario.telefono ?? "");
        setPropietarioEncontrado(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible consultar el propietario."
      );
    } finally {
      setBuscando(false);
    }
  }

  async function registrar() {
    setError("");
    setMensaje("");

    if (!posicion || !tipo || !nombre.trim()) {
      setError(
        "Completa posición, tipo y nombre o referencia del inmueble."
      );
      return;
    }

    setGuardando(true);

    try {
      const response = await fetch("/api/inmuebles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          posicion: Number(posicion),
          tipo,
          referencia: nombre,
          ubicacion,
          dni,
          nombres,
          apellidos,
          telefono,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No fue posible registrar el inmueble."
        );
      }

      setMensaje(
        `Inmueble ${data.codigo} registrado correctamente en la posición ${String(
          data.posicion
        ).padStart(2, "0")} y enviado a Visita pendiente.`
      );

      setPosicion("");
      setTipo("");
      setNombre("");
      setUbicacion("");
      setDni("");
      setNombres("");
      setApellidos("");
      setTelefono("");
      setPropietarioEncontrado(false);

      setCargandoPosiciones(true);
      await cargarPosiciones();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible registrar el inmueble."
      );

      setCargandoPosiciones(true);
      await cargarPosiciones();
    } finally {
      setGuardando(false);
    }
  }

  const disponibles = useMemo(
    () => posiciones.filter((p) => p.disponible),
    [posiciones]
  );

  const posicion = disponibles.some(p => String(p.numero) === seleccionPosicion)
    ? seleccionPosicion
    : disponibles.some(p => String(p.numero) === posicionSolicitada)
      ? posicionSolicitada ?? ""
      : String(disponibles[0]?.numero ?? "");

  const dniValido = /^\d{8}$/.test(dni);
  const propietarioCompleto =
    dniValido && Boolean(nombres.trim()) && Boolean(apellidos.trim());

  const puedeRegistrar = Boolean(
    posicion && tipo && nombre.trim() && !guardando
  );

  const pasoPosicion = Boolean(posicion);
  const pasoInmueble = Boolean(tipo && nombre.trim());
  const pasoPropietario = propietarioCompleto;

  return (
    <main className="min-h-screen bg-[#f7f7f5] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1380px]">
        {/* ENCABEZADO */}
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <PageHeading href="/registrar-inmueble" />

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Registra el inmueble con los datos mínimos para incorporarlo a
                la cartera. El resto puede completarse después.
              </p>
            </div>

            <Link
              href="/cartera"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span>←</span>
              Volver a cartera
            </Link>
          </div>
        </header>

        {/* PROGRESO */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Registro en preparación
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  Completa lo esencial. El resto puede hacerse después.
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-bold ${
                  puedeRegistrar
                    ? "bg-[#fff1f1] text-[#a90000]"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {puedeRegistrar
                  ? "Listo para registrar"
                  : "En preparación"}
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3">
            {[
              {
                numero: "01",
                titulo: "Posición",
                completo: pasoPosicion,
                detalle: pasoPosicion ? "Completo" : "Pendiente",
              },
              {
                numero: "02",
                titulo: "Inmueble",
                completo: pasoInmueble,
                detalle: pasoInmueble ? "Completo" : "Pendiente",
              },
              {
                numero: "03",
                titulo: "Propietario",
                completo: pasoPropietario,
                detalle: pasoPropietario ? "Registrado" : "Opcional",
              },
            ].map((paso, index) => (
              <div
                key={paso.numero}
                className={`flex items-center gap-3 px-5 py-4 ${
                  index > 0 ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    paso.completo
                      ? "bg-[#c80000] text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {paso.completo ? "✓" : paso.numero}
                </span>

                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold ${
                      paso.completo
                        ? "text-[#a90000]"
                        : "text-slate-700"
                    }`}
                  >
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* FORMULARIO PRINCIPAL */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1f1] text-lg font-bold text-[#c80000]">
                  +
                </span>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Datos de registro
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Estos datos permiten iniciar el flujo comercial.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-7 p-5 sm:p-6">
              {/* POSICIÓN */}
              <div>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-bold text-slate-700">
                    Posición en cartera{" "}
                    <span className="text-[#c80000]">*</span>
                  </label>

                  <span className="w-fit rounded-full bg-[#fff1f1] px-2.5 py-1 text-[10px] font-bold text-[#a90000]">
                    {cargandoPosiciones
                      ? "Consultando..."
                      : `${disponibles.length} disponibles`}
                  </span>
                </div>

                <select
                  value={posicion}
                  onChange={(e) => setPosicion(e.target.value)}
                  disabled={
                    cargandoPosiciones || disponibles.length === 0
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-[#c80000] focus:ring-2 focus:ring-[#f5dede] disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {cargandoPosiciones
                      ? "Consultando posiciones..."
                      : disponibles.length
                        ? "Seleccionar posición disponible"
                        : "No hay posiciones disponibles"}
                  </option>

                  {disponibles.map((p) => (
                    <option key={p.numero} value={p.numero}>
                      {String(p.numero).padStart(2, "0")} · Disponible
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  La primera posición disponible se selecciona
                  automáticamente. Puedes cambiarla antes de guardar.
                </p>
              </div>

              {/* DATOS DEL INMUEBLE */}
              <div className="border-t border-slate-100 pt-7">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Datos básicos del inmueble
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      Requeridos
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Solo información inicial. Los datos completos pertenecen
                    a la Fase 2.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tipo de inmueble{" "}
                      <span className="text-[#c80000]">*</span>
                    </label>

                    <select
                      value={tipo}
                      onChange={(e) =>
                        setTipo(e.target.value as Tipo)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-[#c80000] focus:ring-2 focus:ring-[#f5dede]"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option>Casa</option>
                      <option>Departamento</option>
                      <option>Terreno</option>
                      <option>Local</option>
                      <option>Oficina</option>
                      <option>Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Nombre o referencia{" "}
                      <span className="text-[#c80000]">*</span>
                    </label>

                    <input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Casa Los Pinos"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none placeholder:text-slate-400 transition focus:border-[#c80000] focus:ring-2 focus:ring-[#f5dede]"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Ubicación{" "}
                    <span className="font-normal text-slate-400">
                      (opcional)
                    </span>
                  </label>

                  <input
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Ej. Chimbote · Urbanización Buenos Aires"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none placeholder:text-slate-400 transition focus:border-[#c80000] focus:ring-2 focus:ring-[#f5dede]"
                  />
                </div>
              </div>

              {/* PROPIETARIO */}
              <div className="border-t border-slate-100 pt-7">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        Propietario
                      </h2>

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                        Opcional
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Puedes registrarlo ahora o completar sus datos
                      posteriormente.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-[#faf9f7] p-4 sm:p-5">
                  <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        DNI{" "}
                        <span className="font-normal text-slate-400">
                          (opcional)
                        </span>
                      </label>

                      <div className="flex gap-2">
                        <input
                          value={dni}
                          onChange={(e) => {
                            setDni(
                              e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 8)
                            );
                            setPropietarioEncontrado(false);
                          }}
                          onBlur={buscarPropietario}
                          placeholder="8 dígitos"
                          inputMode="numeric"
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#c80000] focus:ring-2 focus:ring-[#f5dede]"
                        />

                        <button
                          type="button"
                          onClick={buscarPropietario}
                          disabled={!dniValido || buscando}
                          className="rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {buscando ? "..." : "Buscar"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        Nombres{" "}
                        <span className="font-normal text-slate-400">
                          (opcional)
                        </span>
                      </label>

                      <input
                        value={nombres}
                        onChange={(e) => setNombres(e.target.value)}
                        placeholder="Nombres del propietario"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#c80000] focus:ring-2 focus:ring-[#f5dede]"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        Apellidos{" "}
                        <span className="font-normal text-slate-400">
                          (opcional)
                        </span>
                      </label>

                      <input
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        placeholder="Apellidos del propietario"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#c80000] focus:ring-2 focus:ring-[#f5dede]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        Teléfono / contacto{" "}
                        <span className="font-normal text-slate-400">
                          (opcional)
                        </span>
                      </label>

                      <input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Celular o teléfono de contacto"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#c80000] focus:ring-2 focus:ring-[#f5dede]"
                      />
                    </div>
                  </div>

                  {propietarioEncontrado && (
                    <div className="mt-4 rounded-xl border border-[#ead1d1] bg-[#fff5f5] px-4 py-3">
                      <p className="text-xs font-bold text-[#a90000]">
                        Propietario encontrado
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#a90000]">
                        Se reutilizará el propietario registrado y se
                        actualizarán sus datos de contacto.
                      </p>
                    </div>
                  )}

                  {!propietarioEncontrado && dniValido && (
                    <div className="mt-4 rounded-xl border border-[#e7e5e2] bg-white px-4 py-3">
                      <p className="text-xs font-bold text-slate-600">
                        Consulta de propietario
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Pulsa Buscar para comprobar si el DNI ya existe. Si no
                        existe, se creará al registrar el inmueble.
                      </p>
                    </div>
                  )}

                  {!dni && (
                    <div className="mt-4 flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <span className="mt-0.5 text-sm text-slate-400">ⓘ</span>

                      <div>
                        <p className="text-xs font-bold text-slate-600">
                          Propietario opcional
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Puedes registrar el inmueble sin propietario. Estos
                          datos podrán completarse posteriormente.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* MENSAJES */}
              {error && (
                <div className="rounded-xl border border-[#ead1d1] bg-[#fff7f7] p-4">
                  <p className="text-sm font-semibold text-[#a90000]">
                    No se pudo completar el registro
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#a90000]">
                    {error}
                  </p>
                </div>
              )}

              {mensaje && (
                <div className="rounded-xl border border-[#d9eadf] bg-[#f3faf5] p-4">
                  <p className="text-sm font-semibold text-[#18713b]">
                    Registro realizado
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#2f6f48]">
                    {mensaje}
                  </p>
                </div>
              )}

              {/* DESPUÉS DEL REGISTRO */}
              <div className="rounded-2xl border border-[#ead1d1] bg-[#fff7f7] p-4 sm:p-5">
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c80000] text-sm font-bold text-white">
                    ✓
                  </span>

                  <div>
                    <p className="text-sm font-bold text-[#333]">
                      Después del registro
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#666]">
                      El inmueble quedará incorporado a la{" "}
                      <strong>cartera activa</strong>, la posición quedará
                      ocupada y se generará automáticamente la{" "}
                      <strong>visita pendiente</strong> y el primer evento de
                      historial.
                    </p>
                  </div>
                </div>
              </div>

              {/* ACCIONES */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Link
                  href="/cartera"
                  className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancelar
                </Link>

                <button
                  onClick={registrar}
                  disabled={!puedeRegistrar}
                  className="rounded-xl bg-[#c80000] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#ad0000] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {guardando ? "Registrando..." : "Registrar inmueble"}
                </button>
              </div>
            </div>
          </section>

          {/* PANEL LATERAL */}
          <aside className="h-fit space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Flujo de ingreso
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c80000] text-xs font-bold text-white">
                    1
                  </span>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Registrar inmueble
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Posición + tipo + referencia. El propietario puede
                      completarse después.
                    </p>
                  </div>
                </div>

                <div className="ml-4 h-5 border-l border-dashed border-slate-200" />

                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff1f1] text-xs font-bold text-[#c80000]">
                    2
                  </span>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Visita pendiente
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Aparece automáticamente en la bandeja de visitas
                      pendientes.
                    </p>
                  </div>
                </div>

                <div className="ml-4 h-5 border-l border-dashed border-slate-200" />

                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    3
                  </span>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Tasación
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Se habilita después de completar la visita.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-700">
                  Capacidad de cartera
                </p>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                  Máx. 90
                </span>
              </div>

              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                90{" "}
                <span className="text-sm font-medium text-slate-400">
                  posiciones
                </span>
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#c80000] transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((90 - disponibles.length) / 90) * 100
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                Ocupadas:{" "}
                <strong className="text-slate-600">
                  {cargandoPosiciones ? "..." : 90 - disponibles.length}
                </strong>{" "}
                · Disponibles:{" "}
                <strong className="text-slate-600">
                  {cargandoPosiciones ? "..." : disponibles.length}
                </strong>
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-[#faf9f7] p-5">
              <p className="text-xs font-bold text-slate-700">
                Regla de registro
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Solo necesitas completar{" "}
                <strong className="text-slate-700">
                  posición, tipo y referencia
                </strong>
                . Los datos del propietario y la información detallada pueden
                completarse posteriormente.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
