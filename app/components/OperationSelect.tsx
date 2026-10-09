"use client";

export default function OperationSelect({ value, onChange, disabled = false, filter = false, className }: { value: string; onChange: (value: string) => void; disabled?: boolean; filter?: boolean; className?: string }) {
  return <select aria-label="Tipo de operación" value={value} onChange={event => onChange(event.target.value)} disabled={disabled} required={!filter} className={className}>
    {filter && <option value="Todos">Todos</option>}
    <option value="venta">Venta</option><option value="alquiler">Alquiler</option>
  </select>;
}
