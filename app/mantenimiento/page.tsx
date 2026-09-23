"use client";

import { useState } from "react";

export default function MantenimientoPage() {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<string[]>([]);

  async function actualizarDatosPrueba() {
    if (!key.trim()) {
      setMessage("Ingresa la clave de mantenimiento configurada para este entorno.");
      return;
    }

    if (!window.confirm("Se revisarán las posiciones 01–30 y se crearán los datos de prueba que todavía no existan. ¿Continuar?")) {
      return;
    }

    setLoading(true);
    setMessage("");
    setDetails([]);

    try {
      const response = await fetch("/api/mantenimiento/datos-prueba", {
        method: "POST",
        headers: { "x-maintenance-key": key.trim() },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar.");
      }

      setMessage(data.message || "Actualización completada.");
      setDetails(data.results || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la actualización.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="px-6 py-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Mantenimiento</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Base de datos</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Herramientas de mantenimiento para preparar y actualizar datos de prueba. Estas acciones no eliminan el historial existente.
          </p>
        </div>
      </header>

      <div className="p-6 lg:p-8">
        <section className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">⚙</div>
            <div>
              <h2 className="text-base font-bold text-slate-950">Datos ficticios para pruebas</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Revisa las posiciones 01–30 y agrega únicamente los registros de prueba que aún no existan. Si una posición está ocupada, se conserva sin modificar.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
            <p className="text-xs font-semibold text-amber-900">Importante</p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              Esta herramienta está pensada para el entorno de pruebas. No reemplaza migraciones de esquema ni elimina datos.
            </p>
          </div>

          <div className="mt-6">
            <label className="text-xs font-semibold text-slate-700">Clave de mantenimiento</label>
            <input
              type="password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="DB_MAINTENANCE_KEY"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <button
            type="button"
            onClick={actualizarDatosPrueba}
            disabled={loading}
            className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Actualizar datos de prueba"}
          </button>

          {message && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">{message}</p>
              {details.length > 0 && (
                <div className="mt-3 max-h-72 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-600">
                  {details.map((detail, index) => <div key={index} className="py-1">{detail}</div>)}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
