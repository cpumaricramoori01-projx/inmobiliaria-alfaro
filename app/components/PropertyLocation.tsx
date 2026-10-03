"use client";

import { useEffect, useRef, useState } from "react";
import LocationMap, { type MapPoint } from "./LocationMap";
import { googleMapsUrl, locationPoint } from "@/lib/location.mjs";

type Props = { latitude: string | null; longitude: string | null; address: string; editable?: boolean; disabled?: boolean; onChange?: (point: MapPoint | null) => void };
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";
const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

export default function PropertyLocation({ latitude, longitude, address, editable = false, disabled = false, onChange }: Props) {
  const point = locationPoint(latitude, longitude);
  const [link, setLink] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const generation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const busy = disabled || pending;
  const search = `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: address || "Chimbote, Perú" })}`;
  const displayMap = point || editable;

  function choose(next: MapPoint | null) {
    if (busy) return;
    ++generation.current;
    setError(""); setNotice(next ? "Punto seleccionado. Guarda los cambios para conservarlo." : "Ubicación retirada. Guarda los cambios para confirmar.");
    onChange?.(next);
  }
  function locate() {
    if (!navigator.geolocation) { setError("Este dispositivo no permite obtener tu ubicación."); return; }
    const id = ++generation.current;
    setPending(true); setError(""); setNotice("");
    navigator.geolocation.getCurrentPosition(position => {
      if (!mounted.current || id !== generation.current) return;
      setPending(false);
      onChange?.({ lat: position.coords.latitude, lng: position.coords.longitude });
      setNotice(`Ubicación detectada con una precisión aproximada de ${Math.round(position.coords.accuracy)} m. Confirma que el marcador señale el inmueble y guarda los cambios.`);
    }, failure => {
      if (!mounted.current || id !== generation.current) return;
      setPending(false); setError(failure.code === 1 ? "Permite el acceso a tu ubicación en el navegador o marca el punto manualmente." : "No se pudo obtener tu ubicación. Prueba nuevamente o marca el inmueble en el mapa.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  async function importLink() {
    const id = ++generation.current;
    setPending(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/ubicaciones", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enlace: link.trim() }) });
      const data = await response.json();
      if (!mounted.current || id !== generation.current) return;
      if (!response.ok) throw new Error(data.error || "No se pudo leer el enlace.");
      onChange?.({ lat: data.lat, lng: data.lng });
      setNotice(data.approximate ? "Se tomó el centro del mapa compartido. Ajusta el marcador al inmueble y guarda los cambios." : "Ubicación importada. Revisa el marcador y guarda los cambios.");
    } catch (failure) { if (mounted.current && id === generation.current) setError(failure instanceof Error ? failure.message : "No se pudo leer el enlace."); }
    finally { if (mounted.current && id === generation.current) setPending(false); }
  }

  return <section className="space-y-4" aria-label="Ubicación en el mapa">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-sm font-bold text-slate-900">Ubicación en el mapa</h3><p className="mt-1 break-words text-xs leading-5 text-slate-500">{editable ? "Haz clic en el inmueble o arrastra el marcador hasta el punto correcto." : address || "Completa la dirección en la pestaña Inmueble."}</p></div><span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold ${point ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{point ? (editable ? "Punto seleccionado" : "Ubicación registrada") : "Ubicación pendiente"}</span></div>
    {editable && <div className="flex flex-wrap gap-2"><a href={search} target="_blank" rel="noreferrer" className={buttonClass}>Buscar dirección en Google Maps ↗</a><button type="button" disabled={busy} onClick={locate} className={buttonClass}>Usar mi ubicación actual</button>{point && <button type="button" disabled={busy} onClick={() => choose(null)} className={`${buttonClass} text-red-700`}>Quitar ubicación</button>}</div>}
    {displayMap ? (!editable && point && embedKey ? <iframe title="Ubicación del inmueble en Google Maps" src={`https://www.google.com/maps/embed/v1/place?${new URLSearchParams({ key: embedKey, q: `${point.lat},${point.lng}`, zoom: "17", language: "es" })}`} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-72 w-full rounded-2xl border border-slate-200 sm:h-80" /> : <LocationMap point={point} editable={editable} disabled={busy} onChange={choose} />) : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center"><p className="text-sm font-semibold text-slate-600">Todavía no se ha marcado este inmueble</p><p className="mt-2 text-xs leading-5 text-slate-400">En la pestaña Inmueble puedes seleccionar su ubicación y guardarla.</p></div>}
    {editable && <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><label className="block text-xs font-semibold text-slate-700">¿Ya tienes la ubicación en Google Maps?<span className="mt-1 block text-[11px] font-normal leading-5 text-slate-500">Busca la dirección, selecciona el inmueble y copia el enlace desde Compartir. Pégalo aquí para traer el punto al mapa.</span><input type="url" value={link} disabled={busy} onChange={event => setLink(event.target.value)} placeholder="https://maps.app.goo.gl/…" className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal" /></label><button type="button" disabled={busy || !link.trim()} onClick={() => void importLink()} className={`${buttonClass} mt-3`}>Importar ubicación del enlace</button></div>}
    {pending && <p role="status" className="text-xs text-slate-500">Obteniendo ubicación…</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700">{notice}</p>}
    {point && <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-[10px] text-slate-400">{point.lat.toFixed(6)}, {point.lng.toFixed(6)}</p><div className="flex flex-wrap gap-2"><a href={googleMapsUrl(point)} target="_blank" rel="noreferrer" className={buttonClass}>Abrir en Google Maps ↗</a><a href={googleMapsUrl(point, true)} target="_blank" rel="noreferrer" className={`${buttonClass} border-red-100 bg-red-50 text-[#c80000]`}>Cómo llegar ↗</a></div></div>}
  </section>;
}
