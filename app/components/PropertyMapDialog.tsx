"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import PropertyLocation from "./PropertyLocation";
import { locationPoint } from "@/lib/location.mjs";

type Property = { id: string; nombre: string; posicion?: number; direccion: string | null; ubicacion: string; latitud: string | null; longitud: string | null };

export default function PropertyMapDialog({ property, onClose }: { property: Property; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const hasLocation = Boolean(locationPoint(property.latitud, property.longitud));
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return <dialog ref={dialog} aria-labelledby="property-map-title" onCancel={event => { event.preventDefault(); onClose(); }}
    className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl backdrop:bg-slate-950/50 sm:p-6">
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0"><h2 id="property-map-title" className="break-words text-lg font-bold text-slate-900">{property.nombre}</h2><p className="mt-1 break-words text-xs text-slate-500">{property.id} · {property.posicion ? `Posición ${property.posicion}` : "Sin posición"}</p></div>
      <button type="button" autoFocus onClick={onClose} className="min-h-11 shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cerrar</button>
    </div>
    <PropertyLocation latitude={property.latitud} longitude={property.longitud} address={[property.direccion, property.ubicacion].filter(Boolean).join(", ")} />
    <div className="mt-5 border-t border-slate-100 pt-4"><Link href={`/datos-inmuebles?${new URLSearchParams({ codigo: property.id, pestana: "inmueble" })}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{hasLocation ? "Editar ubicación en la ficha" : "Registrar ubicación en la ficha"} →</Link></div>
  </dialog>;
}
