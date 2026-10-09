"use client";

import { useCallback, useEffect, useState } from 'react';

type Type = { id: number; nombre: string; activo: boolean };
export default function PropertyTypeSelect({ value, onChange, disabled = false, preserveCurrent = false, filter = false, className }: { value: string; onChange: (value: string) => void; disabled?: boolean; preserveCurrent?: boolean; filter?: boolean; className?: string }) {
  const [types, setTypes] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/tipos-inmueble', { cache: 'no-store', signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron consultar los tipos.');
      if (!signal?.aborted) { setTypes(data.tipos); setError(''); }
    } catch (failure) { if (!signal?.aborted) setError(failure instanceof Error ? failure.message : 'No se pudieron consultar los tipos.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => { if (!controller.signal.aborted) return load(controller.signal); });
    const refresh = () => { void load(controller.signal); };
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.removeEventListener('focus', refresh); };
  }, [load]);
  const selected = types.find(type => type.nombre.toLocaleLowerCase('es') === value.toLocaleLowerCase('es'));
  const options = types.filter(type => filter || type.activo || (preserveCurrent && type.id === selected?.id));
  return <div>
    <select aria-label="Tipo de inmueble" required={!filter} value={selected?.nombre ?? value} disabled={disabled || loading || Boolean(error)} onChange={event => onChange(event.target.value)} className={className}>
      <option value={filter ? "Todos" : ""}>{filter ? "Todos" : loading ? 'Cargando tipos…' : 'Seleccionar tipo'}</option>
      {preserveCurrent && value && !selected && <option value={value}>{value} (actual)</option>}
      {options.map(type => <option key={type.id} value={type.nombre} disabled={!type.activo && !filter}>{type.nombre}{!type.activo ? ' (inactivo)' : ''}</option>)}
    </select>
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error} <button type="button" disabled={disabled} onClick={() => void load()} className="underline">Reintentar</button></p>}
    {!filter && !loading && !error && !types.some(type => type.activo) && <p className="mt-2 text-xs text-amber-800">No hay tipos activos. El administrador puede activarlos en Tipos de inmueble.</p>}
  </div>;
}
