const nuevos = [
  { numero: "54", nombre: "Terreno Los Pinos", zona: "Casma", estado: "Nuevo", siguiente: "Visita", detalle: "Pendiente de coordinar visita y toma de fotografías." },
  { numero: "81", nombre: "Terreno Sector Industrial", zona: "Chimbote", estado: "Nuevo", siguiente: "Visita", detalle: "Inmueble registrado. Falta realizar visita inicial." },
  { numero: "86", nombre: "Casa Villa María", zona: "Nuevo Chimbote", estado: "Nuevo", siguiente: "Visita", detalle: "Pendiente de revisar el inmueble y coordinar visita." },
  { numero: "89", nombre: "Terreno Playa Norte", zona: "Tortugas", estado: "Nuevo", siguiente: "Visita", detalle: "Nuevo inmueble incorporado a la cartera." },
];

export default function NuevosPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex min-h-20 items-center justify-between px-6 lg:px-8">
          <div>
            <p className="text-sm text-slate-500">Gestión inmobiliaria</p>
            <h1 className="text-xl font-bold text-slate-900">Nuevos inmuebles recibidos</h1>
          </div>
          <a href="/registrar-inmueble" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">+ Nuevo inmueble</a>
        </div>
      </header>

      <div className="p-6 lg:p-8">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Nuevos recibidos</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Inmuebles incorporados a la cartera que todavía necesitan atención inicial.</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-medium text-slate-500">Nuevos recibidos</div><div className="mt-2 text-3xl font-bold text-slate-900">4</div><div className="mt-1 text-xs text-slate-400">Pendientes de atención inicial</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-medium text-slate-500">Pendientes de visita</div><div className="mt-2 text-3xl font-bold text-slate-900">4</div><div className="mt-1 text-xs text-slate-400">Requieren coordinación</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-medium text-slate-500">Próximo paso</div><div className="mt-2 text-lg font-bold text-slate-900">Visita</div><div className="mt-1 text-xs text-slate-400">Primera actividad de preparación</div></div>
        </div>

        <div className="mb-5"><h3 className="text-base font-semibold text-slate-900">Inmuebles por atender</h3><p className="mt-1 text-sm text-slate-500">Revisa cada inmueble y continúa con su preparación.</p></div>

        <div className="space-y-4">
          {nuevos.map((inmueble) => (
            <div key={inmueble.numero} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">#{inmueble.numero}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h4 className="text-base font-semibold text-slate-900">{inmueble.nombre}</h4><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Nuevo</span></div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-slate-500"><span>{inmueble.zona}</span><span className="text-slate-300">•</span><span>Recibido recientemente</span></div>
                    <p className="mt-3 max-w-2xl text-sm leading-5 text-slate-500">{inmueble.detalle}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end"><div><div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Siguiente actividad</div><div className="mt-1 text-sm font-semibold text-slate-800">{inmueble.siguiente}</div></div><div className="flex gap-2"><a href="/cartera" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Ver cartera</a><button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Continuar</button></div></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">Esta pantalla se conserva como prototipo de la etapa de nuevos recibidos. El menú principal seguirá la estructura definida por el dueño.</div>
      </div>
    </main>
  );
}
