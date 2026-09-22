"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const fase1 = [
  { href: "/cartera", label: "Cartera de inmuebles", icon: "home" },
  { href: "/registrar-inmueble", label: "Registrar inmueble", icon: "plus" },
  { href: "/liberar-inmuebles", label: "Liberar inmueble", icon: "release" },
  { href: "/registrar-visitas", label: "Registrar visitas realizadas", icon: "visit" },
  { href: "/registrar-tasaciones", label: "Registrar tasaciones realizadas", icon: "valuation" },
  { href: "/visitas-pendientes", label: "Visitas pendientes", icon: "clock" },
  { href: "/tasaciones-textos-pendientes", label: "Tasaciones y textos pendientes", icon: "clipboard" },
  { href: "/reportes", label: "Reportes", icon: "report" },
];

const fase2 = [
  { href: "/datos-inmuebles", label: "Ingresar datos de inmuebles", icon: "database" },
];

function Icon({ name }: { name: string }) {
  const common = { className: "h-[18px] w-[18px] shrink-0", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
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
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function MenuLink({ item }: { item: { href: string; label: string; icon: string } }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
  return <Link href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><Icon name={item.icon}/><span className="leading-5">{item.label}</span></Link>;
}

export default function Sidebar() {
  return <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
    <div className="flex h-[76px] items-center border-b border-slate-100 px-6"><div><div className="text-base font-bold tracking-tight text-slate-950">Inmobiliaria Alberto Alfaro</div><div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Gestión inmobiliaria</div></div></div>
    <nav className="flex-1 overflow-y-auto px-3 py-5">
      <MenuLink item={{ href: "/", label: "Dashboard", icon: "dashboard" }}/>
      <div className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Fase 1 · Flujo operativo</div>
      <div className="space-y-1">{fase1.map(item=><MenuLink key={item.href} item={item}/>)}</div>
      <div className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Fase 2 · Datos del inmueble</div>
      <div className="space-y-1">{fase2.map(item=><MenuLink key={item.href} item={item}/>)}</div>
    </nav>
    <div className="border-t border-slate-100 p-4"><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs font-semibold text-slate-700">Secretaria Virtual</div><div className="mt-1 text-[11px] leading-4 text-slate-500">Control de cartera y seguimiento de operaciones.</div></div></div>
  </aside>;
}