"use client";

import { useMemo, useState, type ReactNode } from "react";

type Reporte = {
  nombre: string;
  descripcion: string;
  categoria: string;
  icono: ReactNode;
};

const reportes: Reporte[] = [
  { nombre: "Cartera activa", descripcion: "Inmuebles actualmente ocupando posiciones 01–90.", categoria: "Cartera", icono: "⌂" },
  { nombre: "Posiciones disponibles", descripcion: "Posiciones libres para nuevos registros.", categoria: "Cartera", icono: "▦" },
  { nombre: "Inmuebles por etapa", descripcion: "Distribución entre visita, tasación, aprobación y publicación.", categoria: "Cartera", icono: "◫" },
  { nombre: "Inmuebles por estado", descripcion: "Situación actual de los inmuebles activos.", categoria: "Cartera", icono: "✓" },
  { nombre: "Visitas realizadas", descripcion: "Visitas efectivamente completadas y registradas.", categoria: "Gestión", icono: "◉" },
  { nombre: "Tasaciones realizadas", descripcion: "Tasaciones vigentes registradas en el sistema.", categoria: "Gestión", icono: "⌁" },
  { nombre: "Aprobaciones y negociación", descripcion: "Inmuebles pendientes, aprobados, rechazados o en negociación.", categoria: "Gestión", icono: "◇" },
  { nombre: "Textos pendientes", descripcion: "Inmuebles aprobados que aún requieren texto y enlace documental.", categoria: "Gestión", icono: "≡" },
  { nombre: "Listos para publicar", descripcion: "Textos registrados y listos para que otro usuario publique.", categoria: "Gestión", icono: "↗" },
  { nombre: "Publicados", descripcion: "Inmuebles cuya publicación ya fue registrada.", categoria: "Gestión", icono: "●" },
  { nombre: "Vendidos", descripcion: "Inmuebles liberados por venta.", categoria: "Salidas", icono: "✓" },
  { nombre: "Retirados / cancelados", descripcion: "Inmuebles que dejaron la cartera por otras causas.", categoria: "Salidas", icono: "↩" },
  { nombre: "Motivos de liberación", descripcion: "Detalle de las causas de salida de la cartera activa.", categoria: "Salidas", icono: "!" },
  { nombre: "Histórico de inmuebles", descripcion: "Consulta de registros que ya no están activos.", categoria: "Histórico", icono: "◷" },
  { nombre: "Tiempo de permanencia", descripcion: "Tiempo desde el registro hasta la salida o estado actual.", categoria: "Histórico", icono: "◌" },
  { nombre: "Posición ocupada", descripcion: "Historial de uso de cada posición reutilizable.", categoria: "Histórico", icono: "01" },
  { nombre: "Registro → visita", descripcion: "Tiempo y avance desde el alta hasta la visita.", categoria: "Flujo", icono: "→" },
  { nombre: "Visita → tasación", descripcion: "Tiempo entre visita completada y tasación.", categoria: "Flujo", icono: "→" },
  { nombre: "Tasación → aprobación", descripcion: "Seguimiento de aprobación y negociación.", categoria: "Flujo", icono: "→" },
  { nombre: "Aprobación → publicación", descripcion: "Tiempo desde aprobación hasta publicación.", categoria: "Flujo", icono: "→" },
];

const grupos = ["Todos", "Cartera", "Gestión", "Salidas", "Histórico", "Flujo"];

const tone: Record<string, string> = {
  Cartera: "bg-blue-100 text-blue-700",
  Gestión: "bg-violet-100 text-violet-700",
  Salidas: "bg-rose-100 text-rose-700",
  Histórico: "bg-slate-100 text-slate-700",
  Flujo: "bg-cyan-100 text-cyan-700",
};

export default function Page() {
  const [categoria, setCategoria] = useState("Todos");
  const [seleccionado, setSeleccionado] = useState("Cartera activa");
  const [mensaje, setMensaje] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [usuario, setUsuario] = useState("Todos");
  const [etapa, setEtapa] = useState("Todas");
  const [estado, setEstado] = useState("Todos");
  const [posicion, setPosicion] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [vista, setVista] = useState<"resumen" | "detalle">("resumen");

  const visibles = useMemo(
    () => reportes.filter((r) => categoria === "Todos" || r.categoria === categoria),
    [categoria]
  );

  const filtrosActivos = [fechaDesde, fechaHasta, usuario !== "Todos" ? usuario : "", etapa !== "Todas" ? etapa : "", estado !== "Todos" ? estado : "", posicion, tipo !== "Todos" ? tipo : ""].filter(Boolean).length;

  const aplicarFiltros = () => {
    setVista("detalle");
    setMensaje(
      `Filtros aplicados a “${seleccionado}”. En esta fase se visualiza la estructura; los resultados reales se conectarán a la base de datos.`
    );
  };

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setUsuario("Todos");
    setEtapa("Todas");
    setEstado("Todos");
    setPosicion("");
    setTipo("Todos");
    setMensaje("Filtros limpiados.");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 text-xl">▥</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Fase 1 · Información</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Reportes</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Consulta el estado de la cartera, el trabajo realizado, las salidas, el histórico y los tiempos del flujo comercial.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            <p className="font-bold">Vista de demostración</p>
            <p className="mt-0.5 text-xs text-indigo-600">Estructura preparada para datos reales</p>
          </div>
        </header>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Filtros del reporte</h2>
              <p className="mt-1 text-sm text-slate-500">Los filtros quedarán disponibles para consulta por fecha, usuario, etapa, estado, posición y tipo.</p>
            </div>
            {filtrosActivos > 0 && <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{filtrosActivos} filtro(s) activo(s)</span>}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <label className="text-xs font-semibold text-slate-500">Desde<input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400" /></label>
            <label className="text-xs font-semibold text-slate-500">Hasta<input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400" /></label>
            <label className="text-xs font-semibold text-slate-500">Usuario<select value={usuario} onChange={(e) => setUsuario(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><option>Todos</option><option>Administrador</option><option>Usuario actual</option></select></label>
            <label className="text-xs font-semibold text-slate-500">Etapa<select value={etapa} onChange={(e) => setEtapa(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><option>Todas</option><option>Visita pendiente</option><option>Tasación pendiente</option><option>Aprobación / negociación</option><option>Texto pendiente</option><option>Listo para publicar</option><option>Publicado</option></select></label>
            <label className="text-xs font-semibold text-slate-500">Estado<select value={estado} onChange={(e) => setEstado(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><option>Todos</option><option>Activo</option><option>Histórico</option><option>En negociación</option><option>Aprobado</option><option>Rechazado</option></select></label>
            <label className="text-xs font-semibold text-slate-500">Posición<input value={posicion} onChange={(e) => setPosicion(e.target.value)} placeholder="01–90" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400" /></label>
            <label className="text-xs font-semibold text-slate-500">Tipo<select value={tipo} onChange={(e) => setTipo(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><option>Todos</option><option>Casa</option><option>Departamento</option><option>Terreno</option><option>Local</option><option>Oficina</option><option>Otros</option></select></label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={aplicarFiltros} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Aplicar filtros</button>
            <button onClick={limpiarFiltros} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpiar</button>
          </div>
        </section>

        {mensaje && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{mensaje}</div>}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[["Cartera activa", "42", "de 90 posiciones"], ["Disponibles", "48", "posiciones libres"], ["Visitas pendientes", "6", "por atender"], ["Tasaciones pendientes", "4", "por atender"]].map(([titulo, valor, detalle]) => (
            <div key={titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
              <p className="mt-1 text-xs text-slate-500">{detalle}</p>
            </div>
          ))}
        </section>

        <section className="mt-7">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Reportes disponibles</h2>
              <p className="mt-1 text-sm text-slate-500">Selecciona un informe para preparar su consulta.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {grupos.map((g) => <button key={g} onClick={() => setCategoria(g)} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${categoria === g ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{g}</button>)}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((reporte) => (
              <button key={reporte.nombre} onClick={() => { setSeleccionado(reporte.nombre); setVista("resumen"); setMensaje(""); }} className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${seleccionado === reporte.nombre ? "border-indigo-300 ring-2 ring-indigo-50" : "border-slate-200"}`}>
                <div className="flex items-start gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${tone[reporte.categoria]}`}>{reporte.icono}</span>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-900">{reporte.nombre}</span>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{reporte.descripcion}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone[reporte.categoria]}`}>{reporte.categoria}</span>
                  <span className="text-sm text-slate-400">→</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reporte seleccionado</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{seleccionado}</h2>
              <p className="mt-1 text-sm text-slate-500">La vista detallada se generará con los datos reales, respetando los filtros seleccionados.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setVista("detalle")} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${vista === "detalle" ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>Vista previa</button>
              <button onClick={() => setMensaje("La impresión, PDF y Excel se habilitarán con la conexión de datos reales.")} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Imprimir / exportar</button>
            </div>
          </div>

          {vista === "detalle" && (
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Vista previa · estructura del informe</div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                <div><p className="text-xs text-slate-400">Reporte</p><p className="text-sm font-semibold text-slate-800">{seleccionado}</p></div>
                <div><p className="text-xs text-slate-400">Filtros</p><p className="text-sm font-semibold text-slate-800">{filtrosActivos ? `${filtrosActivos} aplicados` : "Sin filtros"}</p></div>
                <div><p className="text-xs text-slate-400">Fuente</p><p className="text-sm font-semibold text-slate-800">Base de datos · próxima etapa</p></div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
          <p className="text-sm font-bold text-slate-900">Preparado para la siguiente etapa</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            El módulo ya contempla las categorías del flujo completo. Al conectar la base de datos se implementarán los resultados reales, impresión, PDF, Excel y filtros efectivos sin cambiar la estructura del módulo.
          </p>
        </section>
      </div>
    </main>
  );
}
