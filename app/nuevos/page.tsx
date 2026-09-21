const nuevos = [
  {
    numero: "54",
    nombre: "Terreno Los Pinos",
    zona: "Casma",
    estado: "Nuevo",
    recibido: "Recibido recientemente",
    siguiente: "Visita",
    detalle: "Pendiente de coordinar visita y toma de fotografías.",
  },
  {
    numero: "81",
    nombre: "Terreno Sector Industrial",
    zona: "Chimbote",
    estado: "Nuevo",
    recibido: "Recibido recientemente",
    siguiente: "Visita",
    detalle: "Inmueble registrado. Falta realizar visita inicial.",
  },
  {
    numero: "86",
    nombre: "Casa Villa María",
    zona: "Nuevo Chimbote",
    estado: "Nuevo",
    recibido: "Recibido recientemente",
    siguiente: "Visita",
    detalle: "Pendiente de revisar el inmueble y coordinar visita.",
  },
  {
    numero: "89",
    nombre: "Terreno Playa Norte",
    zona: "Tortugas",
    estado: "Nuevo",
    recibido: "Recibido recientemente",
    siguiente: "Visita",
    detalle: "Nuevo inmueble incorporado a la cartera.",
  },
];

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "Nuevo") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Nuevo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
      {estado}
    </span>
  );
}

export default function NuevosPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-slate-100 px-6">
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-900">
              Inmobiliaria
            </div>
            <div className="text-sm font-medium text-slate-500">
              Alberto Alfaro
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6">
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Gestión
          </div>

          <a
            href="/"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span className="text-base">⌂</span>
            Inicio
          </a>

          <a
            href="/cartera"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span className="text-base">▣</span>
            Cartera de inmuebles
          </a>

          <a
            href="/nuevos"
            className="mb-1 flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm"
          >
            <span className="text-base">✦</span>
            Nuevos recibidos
            <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white">
              4
            </span>
          </a>

          <a
            href="#"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span className="text-base">◷</span>
            Pendientes
          </a>

          <a
            href="#"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span className="text-base">↪</span>
            Liberar inmueble
          </a>

          <div className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Sistema
          </div>

          <a
            href="#"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span className="text-base">◫</span>
            Historial
          </a>

          <a
            href="#"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span className="text-base">⚙</span>
            Configuración
          </a>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-700">
              Secretaria Virtual
            </div>
            <div className="mt-1 text-[11px] leading-4 text-slate-500">
              Control de cartera y seguimiento de operaciones.
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:pl-64">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex h-20 items-center justify-between px-6 lg:px-8">
            <div>
              <div className="text-xs font-medium text-slate-400">
                Gestión inmobiliaria
              </div>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Nuevos inmuebles recibidos
              </h1>
            </div>

            <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              + Nuevo inmueble
            </button>
          </div>
        </header>

        <div className="px-6 py-8 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Nuevos recibidos
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Inmuebles que ya fueron incorporados a la cartera y todavía
              necesitan atención inicial.
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Nuevos recibidos
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                4
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Pendientes de atención inicial
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Pendientes de visita
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                4
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Requieren coordinación
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Próximo paso
              </div>
              <div className="mt-2 text-lg font-bold tracking-tight text-slate-900">
                Visita
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Primera actividad de preparación
              </div>
            </div>
          </div>

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Inmuebles por atender
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Revisa cada inmueble y continúa con su preparación.
              </p>
            </div>

            <div className="hidden text-sm text-slate-400 sm:block">
              4 inmuebles
            </div>
          </div>

          <div className="space-y-4">
            {nuevos.map((inmueble) => (
              <div
                key={inmueble.numero}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                      #{inmueble.numero}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-slate-900">
                          {inmueble.nombre}
                        </h4>

                        <EstadoBadge estado={inmueble.estado} />
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                        <span>{inmueble.zona}</span>
                        <span className="text-slate-300">•</span>
                        <span>{inmueble.recibido}</span>
                      </div>

                      <p className="mt-3 max-w-2xl text-sm leading-5 text-slate-500">
                        {inmueble.detalle}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Siguiente actividad
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-800">
                        {inmueble.siguiente}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                        Ver ficha
                      </button>

                      <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">
                        Continuar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
                💡
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-800">
                  ¿Qué debería pasar después?
                </div>

                <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">
                  Desde aquí podrás identificar rápidamente qué inmuebles
                  nuevos necesitan visita, fotografías, tasación, texto de
                  venta u otra actividad de preparación.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
            Datos de demostración. Más adelante esta pantalla se conectará
            con la base de datos real.
          </div>
        </div>
      </main>
    </div>
  );
}