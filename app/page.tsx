const resumen = [
  {
    titulo: "Inmuebles en cartera",
    valor: "42",
    detalle: "Activos actualmente",
    icono: "🏠",
  },
  {
    titulo: "Nuevos recibidos",
    valor: "4",
    detalle: "Pendientes de atención",
    icono: "📥",
  },
  {
    titulo: "Actividades pendientes",
    valor: "11",
    detalle: "Requieren seguimiento",
    icono: "📋",
  },
  {
    titulo: "Requieren atención",
    valor: "6",
    detalle: "Acciones prioritarias",
    icono: "⚠️",
  },
];

const pendientes = [
  {
    numero: "39",
    nombre: "Terreno Plaza 28 de Julio – Jona Servat",
    estado: "En preparación",
    pendiente: "Falta tasación",
  },
  {
    numero: "45",
    nombre: "Terreno La Campiña",
    estado: "En preparación",
    pendiente: "Faltan fotografías",
  },
  {
    numero: "52",
    nombre: "Casa Buenos Aires",
    estado: "En preparación",
    pendiente: "Falta texto de venta",
  },
];

const tareas = [
  "Visitar inmueble N.° 54",
  "Completar tasación del inmueble N.° 39",
  "Preparar texto del inmueble N.° 45",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Barra lateral */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-20 items-center border-b border-slate-200 px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Inmobiliaria
            </p>

            <h1 className="text-lg font-bold text-slate-900">
              Alberto Alfaro
            </h1>
          </div>
        </div>

        <nav className="p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Gestión
          </p>

          <div className="space-y-1">
            {/* Inicio */}
            <a
              href="/"
              className="flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white"
            >
              <span>⌂</span>
              Inicio
            </a>

            {/* Cartera */}
            <a
              href="/cartera"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <span>🏠</span>
              Cartera de inmuebles
            </a>

            {/* Próximamente */}
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <span>📥</span>
              Nuevos recibidos
            </a>

            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <span>📋</span>
              Pendientes
            </a>

            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <span>↪</span>
              Liberar inmueble
            </a>

            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <span>🕘</span>
              Historial
            </a>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sistema
            </p>

            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <span>⚙</span>
              Configuración
            </a>
          </div>
        </nav>
      </aside>

      {/* Contenido principal */}
      <section className="lg:pl-64">
        {/* Cabecera */}
        <header className="border-b border-slate-200 bg-white">
          <div className="flex h-20 items-center justify-between px-6 lg:px-8">
            <div>
              <p className="text-sm text-slate-500">Panel de gestión</p>

              <h2 className="text-xl font-bold text-slate-900">
                Secretaria Virtual
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  Alberto Alfaro
                </p>

                <p className="text-xs text-slate-500">Administrador</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                AA
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        <div className="p-6 lg:p-8">
          {/* Bienvenida */}
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">
              Buenos días, Alberto
            </p>

            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Aquí tienes el estado de tu cartera inmobiliaria.
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Revisa qué tienes, qué has hecho y qué necesita atención.
            </p>
          </div>

          {/* Resumen */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {resumen.map((item) => (
              <div
                key={item.titulo}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.titulo}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {item.valor}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg">
                    {item.icono}
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  {item.detalle}
                </p>
              </div>
            ))}
          </div>

          {/* Contenido inferior */}
          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            {/* Atención */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h4 className="font-bold text-slate-900">
                    Inmuebles que requieren atención
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Propiedades con alguna actividad pendiente.
                  </p>
                </div>

                <a
                  href="/cartera"
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  Ver cartera →
                </a>
              </div>

              <div className="divide-y divide-slate-100">
                {pendientes.map((inmueble) => (
                  <div
                    key={inmueble.numero}
                    className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                        {inmueble.numero}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {inmueble.nombre}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {inmueble.estado}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {inmueble.pendiente}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mi trabajo */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h4 className="font-bold text-slate-900">Mi trabajo</h4>

                <p className="mt-1 text-sm text-slate-500">
                  Próximas acciones.
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {tareas.map((tarea, index) => (
                    <div key={tarea} className="flex gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-xs text-slate-500">
                        {index + 1}
                      </div>

                      <p className="text-sm leading-5 text-slate-700">
                        {tarea}
                      </p>
                    </div>
                  ))}
                </div>

                <a
                  href="/cartera"
                  className="mt-6 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Ver cartera
                </a>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="font-bold text-slate-900">Acciones rápidas</h4>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href="/cartera"
                className="rounded-lg border border-slate-200 p-4 text-left hover:border-slate-300 hover:bg-slate-50"
              >
                <p className="text-sm font-semibold text-slate-800">
                  🏠 Ver cartera
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Consultar los inmuebles registrados.
                </p>
              </a>

              <a
                href="#"
                className="rounded-lg border border-slate-200 p-4 text-left hover:border-slate-300 hover:bg-slate-50"
              >
                <p className="text-sm font-semibold text-slate-800">
                  📋 Ver pendientes
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Revisar actividades pendientes.
                </p>
              </a>

              <a
                href="#"
                className="rounded-lg border border-slate-200 p-4 text-left hover:border-slate-300 hover:bg-slate-50"
              >
                <p className="text-sm font-semibold text-slate-800">
                  📥 Nuevos recibidos
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Revisar nuevas propiedades.
                </p>
              </a>

              <a
                href="#"
                className="rounded-lg border border-slate-200 p-4 text-left hover:border-slate-300 hover:bg-slate-50"
              >
                <p className="text-sm font-semibold text-slate-800">
                  ↪ Liberar inmueble
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Revisar propiedades para retirar.
                </p>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}