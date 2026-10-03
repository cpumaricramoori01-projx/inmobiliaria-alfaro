"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, TileLayer } from "leaflet";

export type MapPoint = { lat: number; lng: number };
type Props = { point: MapPoint | null; editable?: boolean; disabled?: boolean; onChange?: (point: MapPoint) => void };
const initialCenter: [number, number] = [-9.105, -78.558];

export default function LocationMap({ point, editable = false, disabled = false, onChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const tiles = useRef<TileLayer | null>(null);
  const callback = useRef(onChange);
  const interactionEnabled = useRef(editable && !disabled);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [tilesFailed, setTilesFailed] = useState(false);
  const lat = point?.lat, lng = point?.lng;
  useEffect(() => { callback.current = onChange; interactionEnabled.current = editable && !disabled; }, [onChange, editable, disabled]);
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    void import("leaflet").then(L => {
      if (cancelled || !container.current) return;
      const instance = L.map(container.current, { scrollWheelZoom: false, zoomControl: true }).setView(initialCenter, 12);
      map.current = instance;
      const layer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        referrerPolicy: "strict-origin-when-cross-origin",
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      });
      tiles.current = layer;
      let failures = 0;
      layer.on("loading", () => { failures = 0; });
      layer.on("tileerror", () => { failures++; if (!cancelled) setTilesFailed(true); });
      layer.on("load", () => { if (!cancelled) setTilesFailed(failures > 0); });
      layer.addTo(instance);
      const pin = L.divIcon({ className: "property-map-pin", iconSize: [32, 42], iconAnchor: [16, 40],
        html: '<svg width="32" height="42" viewBox="0 0 32 42" aria-hidden="true"><path d="M16 40S2 24 2 16a14 14 0 1 1 28 0c0 8-14 24-14 24Z" fill="#c80000" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="white"/></svg>',
      });
      marker.current = L.marker(initialCenter, { icon: pin, draggable: interactionEnabled.current, keyboard: true, title: "Ubicación del inmueble", alt: "Marcador del inmueble" });
      marker.current.on("dragend", () => { const position = marker.current?.getLatLng(); if (interactionEnabled.current && position) callback.current?.({ lat: position.lat, lng: ((position.lng + 180) % 360 + 360) % 360 - 180 }); });
      instance.on("click", event => {
        if (interactionEnabled.current) callback.current?.({ lat: event.latlng.lat, lng: ((event.latlng.lng + 180) % 360 + 360) % 360 - 180 });
      });
      observer = new ResizeObserver(() => instance.invalidateSize());
      observer.observe(container.current);
      setReady(true);
    }).catch(() => { if (!cancelled) setError("No se pudo cargar el mapa. Puedes usar tu ubicación o pegar un enlace de Google Maps."); });
    return () => { cancelled = true; observer?.disconnect(); map.current?.remove(); map.current = null; marker.current = null; tiles.current = null; };
  }, [editable]);
  useEffect(() => {
    if (!ready || !map.current || !marker.current) return;
    if (lat != null && lng != null) {
      marker.current.setLatLng([lat, lng]).addTo(map.current);
      map.current.setView([lat, lng], 17, { animate: false });
    } else {
      marker.current.remove();
      map.current.setView(initialCenter, 12, { animate: false });
    }
  }, [lat, lng, ready]);
  useEffect(() => {
    if (!ready || !marker.current) return;
    marker.current.options.draggable = editable && !disabled;
    if (editable && !disabled) marker.current.dragging?.enable(); else marker.current.dragging?.disable();
  }, [disabled, editable, ready]);

  return <div className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
    <div ref={container} aria-label={editable ? "Mapa para elegir la ubicación del inmueble" : "Mapa de ubicación del inmueble"} className="h-72 w-full sm:h-80" />
    {!ready && <div role="status" className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-50 p-5 text-center text-sm text-slate-500">{error || "Cargando mapa…"}</div>}
    {ready && tilesFailed && <div role="alert" className="absolute left-3 right-3 top-3 z-[500] rounded-xl border border-amber-200 bg-white/95 p-3 text-xs leading-5 text-slate-700 shadow-sm">
      <p>No se pudieron cargar las imágenes del mapa. Reintenta o utiliza el enlace de Google Maps.</p>
      <button type="button" onClick={() => { setTilesFailed(false); tiles.current?.redraw(); }} className="mt-2 min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold">Reintentar mapa</button>
    </div>}
    {editable && ready && <button type="button" disabled={disabled} onClick={() => {
      const center = map.current?.getCenter();
      if (center) callback.current?.({ lat: center.lat, lng: ((center.lng + 180) % 360 + 360) % 360 - 180 });
    }} className="absolute bottom-7 right-3 z-[500] min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm disabled:opacity-50">Marcar centro del mapa</button>}
  </div>;
}
