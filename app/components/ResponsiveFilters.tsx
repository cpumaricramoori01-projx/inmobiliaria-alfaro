"use client";

import { useId, useState, type ReactNode } from "react";

export default function ResponsiveFilters({ children, active = false }: { children: ReactNode; active?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <div className="aa-filter-panel">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} className="aa-button flex w-full items-center justify-between border border-slate-200 bg-white text-slate-700 sm:hidden">
      <span>Filtros{active ? " · Aplicados" : ""}</span><span aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    <div id={id} className={`${open ? "block" : "hidden"} mt-3 sm:mt-0 sm:block`}>{children}</div>
  </div>;
}
