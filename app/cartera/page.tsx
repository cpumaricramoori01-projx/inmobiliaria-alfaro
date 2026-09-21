const inmuebles = [
  {
    numero: "39",
    nombre: "Terreno Plaza 28 de Julio – Jona Servat",
    zona: "Chimbote",
    estado: "En preparación",
    pendiente: "Tasación",
  },
  {
    numero: "45",
    nombre: "Terreno La Campiña",
    zona: "Chimbote",
    estado: "En preparación",
    pendiente: "Fotografías",
  },
  {
    numero: "52",
    nombre: "Casa Buenos Aires",
    zona: "Nuevo Chimbote",
    estado: "Activo",
    pendiente: "Ninguna",
  },
  {
    numero: "54",
    nombre: "Terreno Los Pinos",
    zona: "Casma",
    estado: "Nuevo",
    pendiente: "Visita",
  },
  {
    numero: "61",
    nombre: "Casa California",
    zona: "Nuevo Chimbote",
    estado: "Activo",
    pendiente: "Ninguna",
  },
  {
    numero: "67",
    nombre: "Terreno Las Brisas",
    zona: "Tortugas",
    estado: "En preparación",
    pendiente: "Texto de venta",
  },
  {
    numero: "72",
    nombre: "Local Comercial Centro",
    zona: "Chimbote",
    estado: "Activo",
    pendiente: "Ninguna",
  },
  {
    numero: "81",
    nombre: "Terreno Sector Industrial",
    zona: "Chimbote",
    estado: "Nuevo",
    pendiente: "Visita",
  },
];

const zonas = [
  "Todas",
  "Chimbote",
  "Nuevo Chimbote",
  "Tortugas",
  "Casma",
  "Huarmey",
  "Trujillo",
  "Lima",
];

function estadoClase(estado: string) {
  switch (estado) {
    case "Activo":
      return "bg-emerald-50 text-emerald-700";
    case "Nuevo":
      return "bg-blue-50 text-blue-700";
    case "En preparación":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function pendienteClase(pendiente: string) {
  if (pendiente === "Ninguna") {
    return "text-emerald-600";
  }

  return "text-amber-600";
}

export default function CarteraPage() {
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
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"
                />
              </svg>

              Inicio
            </a>

            {/* Cartera */}
            <a
              href="/cartera"
              className="flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10.5 12 4l9 6.5v8.25A1.25 1.25 0 0 1 19.75 20H4.25A1.25 1.25 0 0 1 3 18.75V10.5Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 20v-6h8v6"
                />
              </svg>

              Cartera de inmuebles
            </a>

            {/* Nuevos */}
            <a
              href="/nuevos"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="8.5" />
                <path
                  strokeLinecap="round"
                  d="M12 8v8M8 12h8"
                />
              </svg>

              Nuevos recibidos

              <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                4
              </span>
            </a>

            {/* Pendientes */}
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="8.5" />
                <path strokeLinecap="round" d="M12 7v5l3 2" />
              </svg>

              Pendientes
            </a>

            {/* Liberar */}
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h11"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11 3 4 4-4 4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 17H9"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m13 13-4 4 4 4"
                />
              </svg>

              Liberar inmueble
            </a>

            {/* Historial */}
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="8.5" />
                <path strokeLinecap="round" d="M12 7v5l3 2" />
              </svg>

              Historial
            </a>
          </div>

          {/* Sistema */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sistema
            </p>

            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.8 1.8-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.55v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.8-1.8.06-.06A1.7 1.7 0 0 0 8.1 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.55h.1A1.7 1.7 0 0 0 7.66 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.8-1.8.06.06A1.7 1.7 0 0 0 11 6.1 1.7 1.7 0 0 0 12.03 4.5V4h2.55v.1A1.7 1.7 0 0 0 15.61 5.66a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.8 1.8-.06.06A1.7 1.7 0 0 0 19 9a1.7 1.7 0 0 0 1.56 1.03h.1v2.55h-.1A1.7 1.7 0 0 0 19.4 15Z"
                />
              </svg>

              Configuración
            </a>
          </div>
        </nav>
      </aside>

      {/* Contenido */}
      <section className="lg:pl-64">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex h-20 items-center justify-between px-6 lg:px-8">
            <div>
              <p className="text-sm text-slate-500">Gestión inmobiliaria</p>
              <h2 className="text-xl font-bold text-slate-900">
                Cartera de inmuebles
              </h2>
            </div>

            <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
              + Nuevo inmueble
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              Mi cartera
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Consulta y gestiona los inmuebles actualmente registrados.
            </p>
          </div>

          {/* Resumen */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total en cartera
              </p>
              <p className="mt-2 text-3xl font-bold">42</p>
              <p className="mt-2 text-xs text-slate-400">
                Inmuebles activos
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Nuevos</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">4</p>
              <p className="mt-2 text-xs text-slate-400">
                Pendientes de atención
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                En preparación
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-600">8</p>
              <p className="mt-2 text-xs text-slate-400">
                Preparando para venta
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Activos</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">30</p>
              <p className="mt-2 text-xs text-slate-400">
                En proceso de venta
              </p>
            </div>
          </div>

          {/* Filtros y tabla */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    🔎
                  </span>

                  <input
                    type="text"
                    placeholder="Buscar por número o nombre..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none">
                    <option>Todos los estados</option>
                    <option>Nuevo</option>
                    <option>En preparación</option>
                    <option>Activo</option>
                  </select>

                  <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none">
                    <option>Todas las zonas</option>
                    {zonas.slice(1).map((zona) => (
                      <option key={zona}>{zona}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {zonas.map((zona, index) => (
                  <button
                    key={zona}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                      index === 0
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {zona}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      N.º
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Inmueble
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Zona
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pendiente
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {inmuebles.map((inmueble) => (
                    <tr
                      key={inmueble.numero}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                          {inmueble.numero}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {inmueble.nombre}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Inmueble registrado
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {inmueble.zona}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estadoClase(
                            inmueble.estado,
                          )}`}
                        >
                          {inmueble.estado}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`font-medium ${pendienteClase(
                            inmueble.pendiente,
                          )}`}
                        >
                          {inmueble.pendiente}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button className="text-sm font-semibold text-slate-700 hover:text-slate-950">
                          Ver ficha →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Mostrando <strong className="text-slate-700">8</strong> de{" "}
                <strong className="text-slate-700">42</strong> inmuebles
              </p>

              <div className="flex gap-2">
                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                  ←
                </button>

                <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
                  1
                </button>

                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                  2
                </button>

                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                  3
                </button>

                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                  →
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Vista de demostración:</strong> los datos mostrados son
              ficticios. En una siguiente etapa esta cartera se conectará a la
              base de datos real.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}