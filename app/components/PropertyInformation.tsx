"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useSessionUser } from "./SessionProvider";
import { isAdministrator } from "@/lib/access.mjs";
import { filterProperties } from "@/lib/property-list.mjs";

type Item = { id: string; posicion: number | null; nombre: string; tipo: string; ubicacion: string; propietario: string; estado: string };
type Property = {
  id: number; codigo: string; posicion: number | null; tipo: string; referencia: string; estado: string;
  propietarioId: number | null; direccion: string | null; distrito: string | null; provincia: string | null; departamento: string | null;
  areaTerreno: string | null; areaConstruida: string | null; habitaciones: string | number | null; banos: string | number | null;
  caracteristicas: string | null; observaciones: string | null; fechaRegistro: string;
  propietarioDni: string | null; propietarioNombres: string | null; propietarioApellidos: string | null;
  propietarioTelefono: string | null; propietarioEmail: string | null; propietarioReferencia: string | null;
};
type Owner = { dni: string; nombres: string; apellidos: string; telefono: string; email: string; referenciaContacto: string };
type Document = { id: number; tipoDocumento: string; nombre: string; enlace: string; observacion: string | null; almacenamiento: string; nombreOriginal: string | null; tamanoBytes: number | null };
type Details = { inmueble: Property; tasacion: { fechaTasacion: string; valorReferencia: string | null; precioObjetivo: string | null; precioVenta: string | null; observacion: string | null } | null; publicacion: { texto: string; enlace: string; publicado: boolean; fechaPublicacion: string | null } | null };
type DocumentForm = { tipoDocumento: string; nombre: string; observacion: string };
const emptyDocument: DocumentForm = { tipoDocumento: "DNI_PROPIETARIO", nombre: "", observacion: "" };
const emptyOwner: Owner = { dni: "", nombres: "", apellidos: "", telefono: "", email: "", referenciaContacto: "" };
const documentTypes = [["DNI_PROPIETARIO", "DNI del propietario"], ["DOCUMENTO_PROPIEDAD", "Documento de propiedad"], ["COPIA_LITERAL", "Copia literal"], ["CONTRATO", "Contrato"], ["TASACION", "Tasación"], ["TEXTO_PUBLICACION", "Texto de publicación"], ["FOTO_INMUEBLE", "Fotos"], ["VIDEO_INMUEBLE", "Video / recorrido"], ["PLANO", "Plano"], ["RECIBO_SERVICIO", "Recibo de servicio"], ["OTRO", "Otro"]];
const tabs = [["Resumen", "home"], ["Propietario", "user"], ["Inmueble", "building"], ["Documentación", "document"], ["Tasación", "chart"], ["Publicación", "publish"]] as const;
type Tab = (typeof tabs)[number][0];
type IconName = (typeof tabs)[number][1] | "search" | "map" | "check" | "arrow" | "save" | "close" | "link";
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#c80000]/40 focus:bg-white disabled:opacity-50";
const primaryClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#c80000] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a90000] disabled:cursor-not-allowed disabled:opacity-50";

function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    building: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h1m4 0h1M9 11h1m4 0h1M10 21v-6h4v6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    document: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
    chart: <><path d="M4 4v16h16M8 15l4-5 4 2 4-7" /></>,
    publish: <><path d="m3 11 18-8-8 18-3-8-7-2ZM10 13l11-10" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    map: <><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="m9 5 7 7-7 7" />,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z" /><path d="M7 3v6h9V3M7 21v-8h10v8" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    link: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" /></>,
  };
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function ownerFrom(property: Property): Owner {
  return { dni: property.propietarioDni ?? "", nombres: property.propietarioNombres ?? "", apellidos: property.propietarioApellidos ?? "", telefono: property.propietarioTelefono ?? "", email: property.propietarioEmail ?? "", referenciaContacto: property.propietarioReferencia ?? "" };
}
const positionLabel = (position: number | null) => position == null ? "—" : String(position).padStart(2, "0");
const money = (value: string | null | undefined) => value ? `S/ ${Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Por definir";
const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "Sin fecha";

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
  return data as T;
}

function Block({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="space-y-4"><div><h3 className="text-sm font-bold text-slate-900">{title}</h3>{description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}</div>{children}</section>;
}
function Stat({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div className="flex items-center gap-2 text-slate-400"><Icon name={icon} /><p className="text-[10px] font-bold uppercase tracking-wide">{label}</p></div><p className="mt-3 break-words text-sm font-semibold text-slate-800">{value}</p></div>;
}
function SaveBar({ dirty, busy }: { dirty: boolean; busy: boolean }) {
  return <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm"><p className={`flex items-center gap-2 text-xs ${dirty ? "text-amber-700" : "text-slate-500"}`}><Icon name={dirty ? "document" : "check"} />{dirty ? "Tienes cambios por guardar" : "Sin cambios pendientes"}</p><button type="submit" disabled={!dirty || busy} className={primaryClass}><Icon name="save" />{busy ? "Guardando…" : "Guardar cambios"}</button></div>;
}

export default function PropertyInformation({ initialCode = "" }: { initialCode?: string }) {
  const admin = isAdministrator(useSessionUser());
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(initialCode ? "todos" : "activo");
  const [code, setCode] = useState(initialCode);
  const [tab, setTab] = useState<Tab>("Resumen");
  const [details, setDetails] = useState<Details | null>(null);
  const [form, setForm] = useState<Property | null>(null);
  const [owner, setOwner] = useState<Owner>(emptyOwner);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadReady, setUploadReady] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [documentForm, setDocumentForm] = useState<DocumentForm>(emptyDocument);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [listReload, setListReload] = useState(0);
  const [loading, setLoading] = useState(Boolean(initialCode));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const loadRequest = useRef(0);
  const sheet = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => filterProperties(items, query, status) as Item[], [items, query, status]);
  const dirty = !!details && (JSON.stringify(form) !== JSON.stringify(details.inmueble) || JSON.stringify(owner) !== JSON.stringify(ownerFrom(details.inmueble)));

  const load = useCallback((key: string, signal?: AbortSignal) => {
    const id = ++loadRequest.current;
    if (!key) return Promise.resolve();
    return Promise.all([
      requestJson<Details>(`/api/inmuebles/${encodeURIComponent(key)}`, { signal }),
      requestJson<{ archivos: Document[]; subidaHabilitada: boolean }>(`/api/inmuebles/${encodeURIComponent(key)}/archivos`, { signal }),
    ]).then(([data, files]) => {
      if (signal?.aborted || id !== loadRequest.current) return;
      setError(""); setDetails(data); setForm(data.inmueble); setOwner(ownerFrom(data.inmueble)); setDocuments(files.archivos); setUploadReady(files.subidaHabilitada);
      setItems(previous => previous.map(item => item.id !== data.inmueble.codigo ? item : { ...item, nombre: data.inmueble.referencia, ubicacion: [data.inmueble.distrito, data.inmueble.provincia, data.inmueble.departamento].filter(Boolean).join(", ") || "Ubicación por completar", propietario: [data.inmueble.propietarioNombres, data.inmueble.propietarioApellidos].filter(Boolean).join(" ") || "Sin propietario" }));
    }).catch(error => {
      if (!signal?.aborted && id === loadRequest.current) setError(error instanceof Error ? error.message : "No se pudo cargar la ficha.");
    }).finally(() => {
      if (!signal?.aborted && id === loadRequest.current) setLoading(false);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    requestJson<{ inmuebles: Item[] }>("/api/inmuebles", { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setItems(data.inmuebles); })
      .catch(error => { if (!controller.signal.aborted) setListError(error instanceof Error ? error.message : "No se pudieron cargar los inmuebles."); })
      .finally(() => { if (!controller.signal.aborted) setListLoading(false); });
    return () => controller.abort();
  }, [listReload]);
  useEffect(() => {
    const controller = new AbortController();
    void load(code, controller.signal);
    return () => controller.abort();
  }, [code, load]);

  function selectProperty(key: string) {
    if (busy || key === code) return;
    if ((dirty || documentForm.nombre || documentFile || documentForm.observacion) && !window.confirm("Tienes cambios sin guardar. ¿Quieres cambiar de inmueble y descartarlos?")) return;
    ++loadRequest.current;
    setCode(key); setTab("Resumen"); setError(""); setMessage(""); setDocumentForm(emptyDocument); setDocumentFile(null);
    setDetails(null); setForm(null); setOwner(emptyOwner); setDocuments([]); setLoading(Boolean(key));
    if (key && window.innerWidth < 1280) window.requestAnimationFrame(() => sheet.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await requestJson(`/api/inmuebles/${encodeURIComponent(code)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, propietario: owner }) });
      setLoading(true);
      await load(code);
      setMessage("Cambios guardados correctamente.");
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudieron guardar los cambios."); }
    finally { setBusy(false); }
  }
  async function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !documentFile || !uploadReady) return;
    if (documentFile.size > 4 * 1024 * 1024) { setError("El archivo debe pesar como máximo 4 MB."); return; }
    const body = new FormData();
    body.set("archivo", documentFile);
    body.set("tipoDocumento", documentForm.tipoDocumento);
    body.set("nombre", documentForm.nombre);
    body.set("observacion", documentForm.observacion);
    setBusy(true); setError(""); setMessage("");
    try {
      await requestJson(`/api/inmuebles/${encodeURIComponent(code)}/archivos`, { method: "POST", body });
      setDocumentForm(emptyDocument); setDocumentFile(null);
      if (fileInput.current) fileInput.current.value = "";
      const files = await requestJson<{ archivos: Document[]; subidaHabilitada: boolean }>(`/api/inmuebles/${encodeURIComponent(code)}/archivos`);
      setDocuments(files.archivos); setUploadReady(files.subidaHabilitada); setMessage("Archivo guardado en el hosting correctamente.");
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo registrar el documento."); }
    finally { setBusy(false); }
  }
  async function removeDocument(document: Document) {
    const hosted = ["vercel_blob", "hosting"].includes(document.almacenamiento);
    if (busy || !window.confirm(hosted ? "¿Eliminar este documento? Se borrará también el archivo del hosting." : "¿Quitar este enlace? El archivo externo se conservará.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await requestJson(`/api/inmuebles/${encodeURIComponent(code)}/archivos?archivoId=${document.id}`, { method: "DELETE" });
      const files = await requestJson<{ archivos: Document[]; subidaHabilitada: boolean }>(`/api/inmuebles/${encodeURIComponent(code)}/archivos`);
      setDocuments(files.archivos); setUploadReady(files.subidaHabilitada); setMessage(hosted ? "Documento eliminado del hosting." : "Enlace retirado. El archivo externo se conserva.");
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo quitar el enlace."); }
    finally { setBusy(false); }
  }
  function propertyField(label: string, key: keyof Property, type = "text", placeholder?: string) {
    return <label className="block text-xs font-semibold text-slate-600">{label}<input type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? (key === "habitaciones" || key === "banos" ? "1" : "0.01") : undefined} value={form?.[key] ?? ""} placeholder={placeholder} required={key === "referencia"} disabled={busy} onChange={event => setForm(previous => previous ? { ...previous, [key]: event.target.value } : previous)} className={inputClass} /></label>;
  }
  function ownerField(label: string, key: keyof Owner, type = "text") {
    return <label className="block text-xs font-semibold text-slate-600">{label}<input type={type} maxLength={key === "dni" ? 8 : undefined} inputMode={key === "dni" ? "numeric" : undefined} value={owner[key]} disabled={busy} onChange={event => setOwner(previous => ({ ...previous, [key]: event.target.value }))} className={inputClass} /></label>;
  }

  return <main className="min-h-screen bg-[#f7f7f5] p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8">
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c80000]">Archivo inmobiliario</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Información de inmuebles</h1><p className="mt-2 text-sm text-slate-500">Encuentra un inmueble y completa su ficha, paso a paso.</p></div>
        {admin && <Link href="/cartera" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300">← Volver a cartera</Link>}
      </header>

      <div className="mt-7 grid items-start gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside aria-label="Buscar y seleccionar inmueble" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.03)] xl:sticky xl:top-6">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">Tus inmuebles</h2><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">Por posición</span></div>
            <label className="relative mt-4 block"><span className="sr-only">Buscar inmueble por nombre, posición, código, ubicación o propietario</span><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"><Icon name="search" /></span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar un inmueble…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-xs outline-none transition focus:border-[#c80000]/40 focus:bg-white" /></label>
            <div className="mt-3 flex gap-1 rounded-xl bg-slate-100 p-1" aria-label="Filtrar por estado">
              {[["activo", "Activos"], ["historico", "Históricos"], ["todos", "Todos"]].map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)} className={`flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition ${status === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{label}</button>)}
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-3 text-[10px] text-slate-400"><span aria-live="polite">{listLoading ? "Cargando inmuebles…" : `${filtered.length} de ${items.length} inmuebles`}</span><span>Pos. ↑</span></div>
          <div className="max-h-80 overflow-y-auto px-2 pb-3 xl:max-h-[calc(100vh-22rem)] xl:min-h-64">
            {listLoading ? <div className="space-y-2 px-2" aria-label="Cargando lista">{[1, 2, 3].map(value => <div key={value} className="h-24 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" />)}</div> : listError ? <div role="alert" className="rounded-2xl bg-red-50 p-4 text-xs text-red-700"><p>{listError}</p><button type="button" onClick={() => { setListLoading(true); setListError(""); setListReload(value => value + 1); }} className="mt-3 font-bold underline underline-offset-4">Reintentar</button></div> : filtered.length === 0 ? <div className="px-5 py-10 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><Icon name="search" /></div><p className="mt-3 text-sm font-semibold text-slate-700">Sin resultados</p><p className="mt-1 text-xs leading-5 text-slate-400">Prueba otro nombre, código o estado.</p>{(query || status !== "todos") && <button type="button" onClick={() => { setQuery(""); setStatus("todos"); }} className="mt-4 text-xs font-semibold text-[#c80000]">Ver todos los inmuebles</button>}</div> : filtered.map(item => <button key={item.id} type="button" aria-pressed={code === item.id} disabled={busy} onClick={() => selectProperty(item.id)} className={`mb-1.5 flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition disabled:cursor-wait ${code === item.id ? "border-red-100 bg-[#fff5f4] shadow-sm" : "border-transparent hover:border-slate-100 hover:bg-slate-50"}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold ${code === item.id ? "bg-[#c80000] text-white" : "bg-slate-100 text-slate-500"}`}>{positionLabel(item.posicion)}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-800" title={item.nombre}>{item.nombre}</span><span className="mt-1 block truncate text-[10px] capitalize text-slate-500">{item.tipo} · {item.ubicacion}</span><span className="mt-1.5 block truncate font-mono text-[9px] text-slate-400" title={item.id}>{item.id}</span></span>
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.estado === "activo" ? "bg-emerald-500" : "bg-slate-300"}`} title={item.estado === "activo" ? "Activo" : "Histórico"}><span className="sr-only">{item.estado === "activo" ? "Activo" : "Histórico"}</span></span>
            </button>)}
          </div>
          <div className="border-t border-slate-100 px-5 py-3"><p className="text-[10px] leading-5 text-slate-400">{status === "todos" ? "Activos primero; cada grupo está ordenado por posición." : "Ordenados por posición. Los inmuebles sin posición aparecen al final."}</p></div>
        </aside>

        <div ref={sheet} className="min-w-0 scroll-mt-5">
          {code && <button type="button" disabled={busy} onClick={() => selectProperty("")} className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500 xl:hidden">← Volver a elegir inmueble</button>}
          {error && <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><Icon name="document" /><p>{error}</p></div>}
          {message && <div role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Icon name="check" />{message}</div>}
          {loading && !details ? <div role="status" className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8"><p className="text-sm text-slate-500">Cargando ficha del inmueble…</p><div className="h-28 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" /><div className="h-64 animate-pulse rounded-2xl bg-slate-50 motion-reduce:animate-none" /></div> : !details ? <div className="flex min-h-[480px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-red-100 bg-[#fff5f4] text-[#c80000]"><Icon name="home" className="h-9 w-9" /></div><p className="mt-6 text-lg font-bold text-slate-900">La ficha de tu inmueble, en un solo lugar</p><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Selecciona un inmueble de la lista para consultar sus datos, completar la información y organizar sus documentos.</p><div className="mt-7 flex flex-wrap justify-center gap-2">{["Datos del propietario", "Características", "Documentación"].map(label => <span key={label} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-500">{label}</span>)}</div></div> : <>
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.03)]">
              <div className="h-1.5 bg-[#c80000]" />
              <div className="flex flex-wrap items-start justify-between gap-5 p-5 sm:p-6">
                <div className="flex min-w-0 flex-1 items-start gap-4"><span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#fff1f1] text-[#c80000]"><span className="text-[8px] font-bold uppercase tracking-wider">Posición</span><span className="font-mono text-xl font-bold">{positionLabel(details.inmueble.posicion)}</span></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-semibold capitalize text-slate-400">{details.inmueble.tipo}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${details.inmueble.estado === "activo" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{details.inmueble.estado === "activo" ? "Activo" : "Histórico"}</span></div><h2 className="mt-2 break-words text-xl font-bold tracking-tight text-slate-950">{details.inmueble.referencia}</h2><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Icon name="map" />{[details.inmueble.distrito, details.inmueble.provincia, details.inmueble.departamento].filter(Boolean).join(", ") || "Ubicación por completar"}</p><p className="mt-2 break-all font-mono text-[10px] text-slate-400">{details.inmueble.codigo}</p></div></div>
                <div className="rounded-2xl bg-slate-50 px-5 py-4"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Precio de venta</p><p className="mt-1 text-lg font-bold tracking-tight text-slate-900">{money(details.tasacion?.precioVenta)}</p></div>
              </div>
              <nav aria-label="Apartados de la ficha" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2">
                {tabs.map(([label, icon]) => <button key={label} type="button" aria-current={tab === label ? "page" : undefined} onClick={() => setTab(label)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-3 text-[11px] font-semibold transition ${tab === label ? "bg-[#fff1f1] text-[#c80000]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Icon name={icon} />{label}{label === "Documentación" && documents.length > 0 && <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] ring-1 ring-slate-200">{documents.length}</span>}</button>)}
              </nav>
            </section>

            <section aria-label={tab} className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.03)] sm:p-6">
              {tab === "Resumen" && <div className="space-y-6">
                <Block title="Una mirada al inmueble" description="Los datos principales para continuar completando la ficha."><div className="grid gap-3 sm:grid-cols-2"><Stat label="Propietario" value={[details.inmueble.propietarioNombres, details.inmueble.propietarioApellidos].filter(Boolean).join(" ") || "Por completar"} icon="user" /><Stat label="Dirección" value={details.inmueble.direccion || "Por completar"} icon="map" /><Stat label="Documentación" value={`${documents.length} documento${documents.length === 1 ? "" : "s"} registrado${documents.length === 1 ? "" : "s"}`} icon="document" /><Stat label="Publicación" value={details.publicacion?.publicado ? "Publicado" : details.publicacion ? "Lista para publicar" : "Sin publicación"} icon="publish" /></div></Block>
                <Block title="Precios del inmueble"><div className="grid gap-3 sm:grid-cols-3">{[["Precio de tasación", details.tasacion?.valorReferencia], ["Precio objetivo", details.tasacion?.precioObjetivo], ["Precio de venta", details.tasacion?.precioVenta]].map(([label, value]) => <div key={label} className={`rounded-2xl border p-4 ${label === "Precio de venta" ? "border-red-100 bg-[#fff5f4]" : "border-slate-100 bg-slate-50"}`}><p className="text-[10px] font-semibold text-slate-500">{label}</p><p className="mt-2 text-sm font-bold text-slate-900">{money(value)}</p></div>)}</div></Block>
                <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setTab("Inmueble")} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-left transition hover:border-red-200 hover:bg-[#fffafa]"><span><span className="block text-xs font-bold text-slate-800">Completar datos del inmueble</span><span className="mt-1 block text-[11px] text-slate-400">Ubicación y características</span></span><Icon name="arrow" /></button><button type="button" onClick={() => setTab("Documentación")} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-left transition hover:border-red-200 hover:bg-[#fffafa]"><span><span className="block text-xs font-bold text-slate-800">Organizar documentación</span><span className="mt-1 block text-[11px] text-slate-400">Archivos y documentos</span></span><Icon name="arrow" /></button></div>
              </div>}

              {tab === "Propietario" && (details.inmueble.propietarioId == null ? <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Este inmueble todavía no tiene un propietario vinculado.</div> : <form onSubmit={save} className="space-y-7">
                <Block title="Datos personales" description="Identifica al propietario del inmueble."><div className="grid gap-4 sm:grid-cols-2">{ownerField("DNI", "dni")}{ownerField("Nombres", "nombres")}{ownerField("Apellidos", "apellidos")}</div></Block>
                <div className="border-t border-slate-100" />
                <Block title="Contacto" description="Mantén a mano los datos para comunicarte con el propietario."><div className="grid gap-4 sm:grid-cols-2">{ownerField("Teléfono", "telefono", "tel")}{ownerField("Correo electrónico", "email", "email")}</div><div className="mt-4">{ownerField("Referencia de contacto", "referenciaContacto")}</div></Block>
                <SaveBar dirty={dirty} busy={busy || loading} />
              </form>)}

              {tab === "Inmueble" && <form onSubmit={save} className="space-y-7">
                <Block title="Identificación" description="El nombre con el que reconocerás este inmueble.">{propertyField("Nombre o referencia", "referencia", "text", "Ej. Casa en urbanización Los Jardines")}</Block>
                <div className="border-t border-slate-100" />
                <Block title="Ubicación"><div className="space-y-4">{propertyField("Dirección", "direccion", "text", "Calle, número o referencia")}<div className="grid gap-4 sm:grid-cols-2">{propertyField("Distrito", "distrito")}{propertyField("Provincia", "provincia")}{propertyField("Departamento", "departamento")}</div></div></Block>
                <div className="border-t border-slate-100" />
                <Block title="Características" description="Superficies y distribución del inmueble."><div className="grid gap-4 sm:grid-cols-2">{propertyField("Área de terreno (m²)", "areaTerreno", "number")}{propertyField("Área construida (m²)", "areaConstruida", "number")}{propertyField("Habitaciones", "habitaciones", "number")}{propertyField("Baños", "banos", "number")}</div><label className="mt-4 block text-xs font-semibold text-slate-600">Detalles adicionales<textarea rows={4} value={form?.caracteristicas || ""} disabled={busy} onChange={event => setForm(previous => previous ? { ...previous, caracteristicas: event.target.value } : previous)} placeholder="Distribución, acabados, servicios y otros detalles…" className={inputClass} /></label></Block>
                <Block title="Observaciones"><textarea aria-label="Observaciones del inmueble" rows={3} value={form?.observaciones || ""} disabled={busy} onChange={event => setForm(previous => previous ? { ...previous, observaciones: event.target.value } : previous)} placeholder="Comentarios que quieras conservar en la ficha…" className={inputClass} /></Block>
                <SaveBar dirty={dirty} busy={busy || loading} />
              </form>}

              {tab === "Documentación" && <div className="space-y-7">
                <Block title="Documentación del inmueble" description="Consulta tus documentos y sube archivos directamente al hosting."><div className="grid gap-2 sm:grid-cols-2">{documentTypes.map(([value, label]) => { const count = documents.filter(document => document.tipoDocumento === value).length; return <div key={value} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"><span className="text-[11px] font-medium text-slate-600">{label}</span><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${count ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{count ? `${count} registrado${count === 1 ? "" : "s"}` : "Por completar"}</span></div>; })}</div></Block>
                {documents.length > 0 && <Block title="Documentos registrados"><div className="space-y-2">{documents.map(document => <article key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"><div className="flex min-w-0 items-start gap-3"><span className="rounded-xl bg-slate-50 p-2.5 text-slate-400"><Icon name="document" /></span><div className="min-w-0"><p className="break-words text-xs font-bold text-slate-800">{document.nombre}</p><p className="mt-1 text-[10px] text-slate-400">{documentTypes.find(([value]) => value === document.tipoDocumento)?.[1] || document.tipoDocumento}</p>{["vercel_blob", "hosting"].includes(document.almacenamiento) && <p className="mt-1 text-[10px] text-emerald-700">Guardado en hosting · {document.nombreOriginal} · {((document.tamanoBytes || 0) / 1024).toLocaleString("es-PE", { maximumFractionDigits: 0 })} KB</p>}{document.observacion && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500">{document.observacion}</p>}</div></div><div className="flex gap-2"><a href={document.enlace} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><Icon name="link" />Abrir</a>{["vercel_blob", "hosting"].includes(document.almacenamiento) && <a href={`${document.enlace}?download=1`} className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Descargar</a>}<button type="button" disabled={busy} onClick={() => removeDocument(document)} aria-label={`${["vercel_blob", "hosting"].includes(document.almacenamiento) ? "Eliminar documento" : "Quitar enlace"} de ${document.nombre}`} className="rounded-lg px-2.5 py-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><Icon name="close" /></button></div></article>)}</div></Block>}
                {!uploadReady && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">{admin ? "Para activar la subida, configura el almacenamiento de documentos y vuelve a desplegar el proyecto." : "La subida de documentos está pendiente de activación por el administrador."}</p>}
                <form onSubmit={addDocument} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5"><Block title="Agregar un documento" description="PDF, Word (.doc, .docx) o Excel (.xls, .xlsx), hasta 4 MB. Se guarda de forma privada, organizado por inmueble y tipo de documento."><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Tipo de documento<select value={documentForm.tipoDocumento} disabled={busy} onChange={event => setDocumentForm(previous => ({ ...previous, tipoDocumento: event.target.value }))} className={inputClass}>{documentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Nombre<input required maxLength={255} value={documentForm.nombre} disabled={busy} onChange={event => setDocumentForm(previous => ({ ...previous, nombre: event.target.value }))} placeholder="Ej. Copia literal actualizada" className={inputClass} /></label><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Archivo<input ref={fileInput} required type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" disabled={busy || !uploadReady} onChange={event => { const selected = event.target.files?.[0] || null; setDocumentFile(selected); if (selected && !documentForm.nombre) setDocumentForm(previous => ({ ...previous, nombre: selected.name.replace(/\.[^.]+$/, "") })); }} className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-red-700`} />{documentFile && <span className="mt-2 block text-[11px] font-normal text-slate-500">{documentFile.name} · {(documentFile.size / 1024 / 1024).toFixed(2)} MB</span>}</label><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Observación<textarea rows={2} maxLength={500} value={documentForm.observacion} disabled={busy} onChange={event => setDocumentForm(previous => ({ ...previous, observacion: event.target.value }))} placeholder="Fecha, versión o comentario sobre el documento" className={inputClass} /></label></div><button type="submit" disabled={busy || !uploadReady || !documentFile} className={`${primaryClass} mt-5`}><Icon name="document" />{busy ? "Guardando…" : "Subir documento"}</button></Block></form>
              </div>}

              {tab === "Tasación" && (details.tasacion ? <div className="space-y-6"><Block title="Tasación registrada" description={`Fecha de tasación: ${formatDate(details.tasacion.fechaTasacion)}`}><div className="grid gap-3 sm:grid-cols-3"><Stat label="Precio de tasación" value={money(details.tasacion.valorReferencia)} icon="chart" /><Stat label="Precio objetivo" value={money(details.tasacion.precioObjetivo)} icon="chart" /><Stat label="Precio de venta" value={money(details.tasacion.precioVenta)} icon="chart" /></div></Block><Block title="Observación"><p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{details.tasacion.observacion || "Sin observaciones registradas."}</p></Block>{admin && <Link href="/tasaciones-textos-pendientes" className="inline-flex items-center gap-2 text-xs font-semibold text-[#c80000]">Gestionar precio de venta <Icon name="arrow" /></Link>}</div> : <div className="rounded-2xl bg-slate-50 p-6"><p className="text-sm text-slate-500">Todavía no hay una tasación registrada.</p>{admin && <Link href="/registrar-tasaciones" className="mt-3 inline-flex text-xs font-semibold text-[#c80000]">Registrar tasación →</Link>}</div>)}

              {tab === "Publicación" && (details.publicacion ? <div className="space-y-5"><Block title="Publicación del inmueble" description={details.publicacion.publicado ? `Publicada el ${formatDate(details.publicacion.fechaPublicacion)}` : "Texto y material listos para publicar."}><p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">{details.publicacion.texto}</p></Block>{details.publicacion.enlace && <a href={details.publicacion.enlace} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700"><Icon name="link" />Abrir material de referencia ↗</a>}</div> : <div className="rounded-2xl bg-slate-50 p-6"><p className="text-sm text-slate-500">Todavía no hay una publicación registrada.</p>{admin && <Link href="/tasaciones-textos-pendientes" className="mt-3 inline-flex text-xs font-semibold text-[#c80000]">Preparar texto y material →</Link>}</div>)}
            </section>
          </>}
        </div>
      </div>
    </div>
  </main>;
}
