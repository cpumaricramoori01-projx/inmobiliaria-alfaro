const resumen = [
  { titulo: "Inmuebles en cartera", valor: "42", detalle: "Activos actualmente", icono: "01" },
  { titulo: "Visitas pendientes", valor: "6", detalle: "Requieren seguimiento", icono: "02" },
  { titulo: "Tasaciones pendientes", valor: "4", detalle: "Requieren atención", icono: "03" },
  { titulo: "Actividades pendientes", valor: "11", detalle: "Para revisar", icono: "04" },
];

const pendientes = [
  { numero: "39", nombre: "Terreno Plaza 28 de Julio – Jona Servat", estado: "En preparación", pendiente: "Falta tasación" },
  { numero: "45", nombre: "Terreno La Campiña", estado: "En preparación", pendiente: "Faltan fotografías" },
  { numero: "54", nombre: "Terreno Los Pinos", estado: "Nuevo", pendiente: "Falta visita" },
];

const tareas = [
  "Visitar inmueble N.° 54",
  "Completar tasación del inmueble N.° 39",
  "Preparar texto del inmueble N.° 45",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex min-h-20 items-center justify-between px-6 lg:px-8">
          <div>
            <p className="text-sm text-slate-500">Panel de gestión</p>
            <h1 className="text-xl font-bold text-slate-900">Dashboard · Secretaria Virtual</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">Alberto Alfaro</p>
              <p className="text-xs text-slate-500">Administrador</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">AA</div>
          </div>
        </div>
      </header>

      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">Buenos días, Alberto</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Aquí tienes el estado de tu cartera inmobiliaria.</h2>
          <p className="mt-2 text-sm text-slate-500">Revisa qué tienes, qué has hecho y qué necesita atención.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {resumen.map((item) => (
            <div key={item.titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.titulo}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{item.valor}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">{item.icono}</div>
              </div>
              <p className="mt-3 text-xs text-slate-400">{item.detalle}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="font-bold text-slate-900">Requieren atención</h3>
                <p className="mt-1 text-sm text-slate-500">Inmuebles con actividades pendientes.</p>
              </div>
              <a href="/cartera" className="text-sm font-semibold text-slate-700 hover:text-slate-950">Ver cartera →</a>
            </div>
            <div className="divide-y divide-slate-100">
              {pendientes.map((item) => (
                <div key={item.numero} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">{item.numero}</div>
                    <div>
                      <p className="font-semibold text-slate-800">{item.nombre}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.estado}</p>
                    </div>
                  </div>
                  <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{item.pendiente}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h3 className="font-bold text-slate-900">Mi trabajo</h3>
              <p className="mt-1 text-sm text-slate-500">Próximas acciones.</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {tareas.map((tarea, index) => (
                  <div key={tarea} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-300 text-xs text-slate-500">{index + 1}</div>
                    <p className="text-sm leading-5 text-slate-700">{tarea}</p>
                  </div>
                ))}
              </div>
              <a href="/cartera" className="mt-6 block rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Ver cartera</a>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Acciones rápidas</h3>
              <p className="mt-1 text-sm text-slate-500">Accede directamente a las tareas principales.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a href="/cartera" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><p className="text-sm font-semibold">Cartera de inmuebles</p><p className="mt-1 text-xs text-slate-500">Consultar la cartera.</p></a>
            <a href="/registrar-inmueble" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><p className="text-sm font-semibold">Registrar inmueble</p><p className="mt-1 text-xs text-slate-500">Incorporar un inmueble.</p></a>
            <a href="/registrar-visitas" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><p className="text-sm font-semibold">Registrar visita</p><p className="mt-1 text-xs text-slate-500">Registrar una visita realizada.</p></a>
            <a href="/registrar-tasaciones" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><p className="text-sm font-semibold">Registrar tasación</p><p className="mt-1 text-xs text-slate-500">Registrar una tasación realizada.</p></a>
          </div>
        </section>
      </div>
    </main>
  );
}
