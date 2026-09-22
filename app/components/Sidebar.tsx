"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/cartera", label: "Cartera de inmuebles", icon: "home" },
  { href: "/registrar-inmueble", label: "Registrar inmueble", icon: "plus" },
  { href: "/liberar-inmuebles", label: "Liberar inmuebles", icon: "release" },
  { href: "/registrar-visitas", label: "Registrar visitas realizadas", icon: "visit" },
  { href: "/registrar-tasaciones", label: "Registrar tasaciones realizadas", icon: "valuation" },
  { href: "/visitas-pendientes", label: "Visitas pendientes", icon: "clock" },
  { href: "/tasaciones-pendientes", label: "Tasaciones pendientes", icon: "clipboard" },
  { href: "/reportes", label: "Reportes", icon: "report" },
];

function Icon({ name }: { name: string }) {
  const common = {
    className: "h-5 w-5 shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="m3 10 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "release":
      return (
        <svg {...common}>
          <path d="M4 7h11" />
          <path d="m11 3 4 4-4 4" />
          <path d="M20 17H9" />
          <path d="m13 13-4 4 4 4" />
        </svg>
      );
    case "visit":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M8 9h8M8 13h5M8 17h3" />
        </svg>
      );
    case "valuation":
      return (
        <svg {...common}>
          <path d="M5 20V9l7-5 7 5v11" />
          <path d="M8 20v-5h8v5" />
          <path d="M9 10h6" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="15" rx="2" />
          <path d="M9 5V4h6v1M8 10h8M8 14h6" />
        </svg>
      );
    case "report":
      return (
        <svg {...common}>
          <path d="M5 20V10M12 20V4M19 20v-7" />
          <path d="M3 20h18" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-20 items-center border-b border-slate-100 px-6">
        <div>
          <div className="text-lg font-bold tracking-tight text-slate-900">
            Inmobiliaria
          </div>
          <div className="text-sm font-medium text-slate-500">
            Alberto Alfaro
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Gestión
        </div>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon name={item.icon} />
                <span className="leading-5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-700">
            Secretaria Virtual
          </div>
          <div className="mt-1 text-[11px] leading-4 text-slate-500">
            Control de cartera y seguimiento de operaciones.
          </div>
        </div>
      </div>
    </aside>
  );
}
