"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const fase1 = [
  { href: "/cartera", label: "Cartera de inmuebles", icon: "home" },
  { href: "/registrar-inmueble", label: "Registrar inmueble", icon: "plus" },
  { href: "/liberar-inmuebles", label: "Liberar inmueble", icon: "release" },
  { href: "/registrar-visitas", label: "Registrar visitas", icon: "visit" },
  { href: "/registrar-tasaciones", label: "Registrar tasaciones", icon: "valuation" },
  { href: "/visitas-pendientes", label: "Visitas pendientes", icon: "clock" },
  { href: "/tasaciones-textos-pendientes", label: "Tasaciones y textos", icon: "clipboard" },
  { href: "/reportes", label: "Reportes", icon: "report" },
];

const fase2 = [{ href: "/datos-inmuebles", label: "Ingresar datos de inmuebles", icon: "database" }];

function Icon({ name }: { name: string }) {
  const common = { className: "h-[18px] w-[18px]", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    dashboard: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    home: <path d="m3 10 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z"/>,
    plus: <><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/></>,
    release: <><path d="M4 7h11"/><path d="m11 3 4 4-4 4"/><path d="M20 17H9"/><path d="m13 13-4 4 4 4"/></>,
    visit: <><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8M8 13h5M8 17h3"/></>,
    valuation: <><path d="M5 20V9l7-5 7 5v11"/><path d="M8 20v-5h8v5"/><path d="M9 10h6"/></>,
    clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></>,
    clipboard: <><rect x="5" y="5" width="14" height="15" rx="2"/><path d="M9 5V4h6v1M8 10h8M8 14h6"/></>,
    report: <><path d="M5 20V10M12 20V4M19 20v-7"/><path d="M3 20h18"/></>,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="M6 6l12 12M18 6 6 18"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function MenuLink({ item, onNavigate }: { item: { href: string; label: string; icon: string }; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${active ? "bg-[#171717] text-white shadow-[0_8px_22px_rgba(23,23,23,0.12)]" : "text-slate-600 hover:bg-[#f5f4f2] hover:text-[#171717]"}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/10 text-white" : "bg-[#f2f1ef] text-[#66615c]"}`}>
        <Icon name={item.icon}/>
      </span>
      <span className="min-w-0 flex-1 leading-5">{item.label}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-[#c80000]" />}
    </Link>
  );
}

function MenuContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="rounded-2xl border border-[#e7e5e2] bg-[#faf9f7] p-2">
        <MenuLink item={{ href: "/", label: "Dashboard", icon: "dashboard" }} onNavigate={onNavigate}/>
      </div>

      <div className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#96928c]">Operación</div>
      <div className="space-y-1">{fase1.slice(0, 3).map(item => <MenuLink key={item.href} item={item} onNavigate={onNavigate}/>)}</div>

      <div className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Seguimiento</div>
      <div className="space-y-1">{fase1.slice(3).map(item => <MenuLink key={item.href} item={item} onNavigate={onNavigate}/>)}</div>

      <div className="mb-2 mt-7 flex items-center justify-between px-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Próxima fase</span>
        <span className="rounded-full bg-[#fff1f1] px-2 py-0.5 text-[9px] font-semibold text-[#c80000]">FASE 2</span>
      </div>
      <div className="space-y-1">
        {fase2.map(item => (
          <MenuLink key={item.href} item={item} onNavigate={onNavigate}/>
        ))}
      </div>
    </>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((value) => !value)}
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-[#e7e5e2] bg-white text-slate-700 shadow-sm lg:hidden"
      >
        <Icon name={open ? "close" : "menu"}/>
      </button>

      {open && (
        <button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,18rem)] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:top-0 lg:w-72 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] shrink-0 items-center border-b border-slate-100 px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#171717] text-sm font-bold text-white shadow-sm">AA</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-tight text-slate-950">Inmobiliaria Alberto Alfaro</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Secretaría virtual</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <MenuContent onNavigate={() => setOpen(false)}/>
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff1f1] text-[#c80000]">
                <span className="h-2 w-2 rounded-full bg-[#c80000]" />
              </span>
              <div>
                <div className="text-xs font-bold text-slate-800">Sistema operativo</div>
                <div className="text-[10px] text-slate-400">Gestión de cartera activa</div>
              </div>
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3 text-[10px] leading-4 text-slate-500">
              Cartera, seguimiento y pendientes en un solo lugar.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}