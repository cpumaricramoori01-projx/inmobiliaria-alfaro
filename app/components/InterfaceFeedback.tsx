import type { ReactNode } from "react";

export function Feedback({ children, tone = "success", className = "" }: {
  children: ReactNode; tone?: "success" | "error" | "info"; className?: string;
}) {
  const styles = { success: "border-emerald-200 bg-emerald-50 text-emerald-900", error: "border-red-200 bg-red-50 text-red-900", info: "border-blue-200 bg-blue-50 text-blue-900" };
  return <div role={tone === "error" ? "alert" : "status"} aria-atomic="true" className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${styles[tone]} ${className}`}>
    <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">{tone === "success" ? "✓" : tone === "error" ? "!" : "i"}</span>
    <div className="min-w-0 flex-1 break-words">{children}</div>
  </div>;
}

export function LoadingCards({ label = "Cargando información…", count = 3 }: { label?: string; count?: number }) {
  return <div role="status" aria-busy="true" className="space-y-3 py-4">
    <p className="text-sm font-medium text-slate-600">{label}</p>
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => <div key={index} className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        <div className="h-8 w-1/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
      </div>)}
    </div>
  </div>;
}
