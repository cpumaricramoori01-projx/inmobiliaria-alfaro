const inmuebles = [
  { numero: "39", nombre: "Terreno Plaza 28 de Julio – Jona Servat", zona: "Chimbote", estado: "En preparación", pendiente: "Tasación" },
  { numero: "45", nombre: "Terreno La Campiña", zona: "Chimbote", estado: "En preparación", pendiente: "Fotografías" },
  { numero: "52", nombre: "Casa Buenos Aires", zona: "Nuevo Chimbote", estado: "Activo", pendiente: "Ninguna" },
  { numero: "54", nombre: "Terreno Los Pinos", zona: "Casma", estado: "Nuevo", pendiente: "Visita" },
  { numero: "61", nombre: "Casa California", zona: "Nuevo Chimbote", estado: "Activo", pendiente: "Ninguna" },
  { numero: "67", nombre: "Terreno Las Brisas", zona: "Tortugas", estado: "En preparación", pendiente: "Texto de venta" },
  { numero: "72", nombre: "Local Comercial Centro", zona: "Chimbote", estado: "Activo", pendiente: "Ninguna" },
  { numero: "81", nombre: "Terreno Sector Industrial", zona: "Chimbote", estado: "Nuevo", pendiente: "Visita" },
];

const zonas = ["Todas", "Chimbote", "Nuevo Chimbote", "Tortugas", "Casma", "Huarmey", "Trujillo", "Lima"];

function estadoClase(estado: string) {
  switch (estado) {
    case "Activo": return "bg-emerald-50 text-emerald-700";
    case "Nuevo": return "bg-blue-50 text-blue-700";
    case "En preparación": return "bg-amber-50 text-amber-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

export default function CarteraPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex min-h-20 items-center justify-between px-6 lg:px-8">
          <div>
            <p className="text-sm text-slate-500">Gestión inmobiliaria</p>
            <h1 className="text-xl font-bold text-slate-900">Cartera de inmuebles</h1>
          </div>
          <a href="/registrar-inmueble" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">+ Nuevo inmueble</a>
        </div>
      </header>

      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Mi cartera</h2>
          <p className="mt-1 text-sm text-slate-500">Consulta y gestiona los inmuebles actualmente registrados.</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total en cartera", "42", "Inmuebles activos"],
            ["Nuevos", "4", "Pendientes de atención"],
            ["En preparación", "8", "Preparando para venta"],
            ["Activos", "30", "En proceso de venta"],
          ].map(([titulo, valor, detalle]) => (
            <div key={titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{titulo}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{valor}</p>
              <p className="mt-2 text-xs text-slate-400">{detalle}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                <input type="text" placeholder="Buscar por número o nombre..." className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100" />
              </div>
              <div className="flex flex-wrap gap-2">
                <select className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"><option>Todos los estados</option><option>Nuevo</option><option>En preparación</option><option>Activo</option></select>
                <select className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"><option>Todas las zonas</option>{zonas.slice(1).map((zona) => <option key={zona}>{zona}</option>)}</select>
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {zonas.map((zona, index) => <button key={zona} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${index === 0 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{zona}</button>)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-slate-50"><tr className="border-b border-slate-200">
                {['N.º', 'Inmueble', 'Zona', 'Estado', 'Pendiente', 'Acción'].map((title) => <th key={title} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {inmuebles.map((inmueble) => (
                  <tr key={inmueble.numero} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">{inmueble.numero}</div></td>
                    <td className="px-6 py-4"><p className="font-semibold text-slate-800">{inmueble.nombre}</p><p className="mt-1 text-xs text-slate-400">Inmueble registrado</p></td>
                    <td className="px-6 py-4 text-sm text-slate-600">{inmueble.zona}</td>
                    <td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estadoClase(inmueble.estado)}`}>{inmueble.estado}</span></td>
                    <td className="px-6 py-4 text-sm"><span className={inmueble.pendiente === "Ninguna" ? "font-medium text-emerald-600" : "font-medium text-amber-600"}>{inmueble.pendiente}</span></td>
                    <td className="px-6 py-4"><button className="text-sm font-semibold text-slate-700 hover:text-slate-950">Ver ficha →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Mostrando <strong className="text-slate-700">8</strong> de <strong className="text-slate-700">42</strong> inmuebles</p>
            <div className="flex gap-2"><button className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50">←</button><button className="rounded-lg bg-slate-900 px-3 py-2 text-white">1</button><button className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50">2</button><button className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50">3</button><button className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50">→</button></div>
          </div>
        </section>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><strong>Vista de demostración:</strong> los datos mostrados son ficticios. Más adelante esta cartera se conectará a la base de datos real.</div>
      </div>
    </main>
  );
}
