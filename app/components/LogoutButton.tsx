"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("No se pudo cerrar sesión.");
      window.location.replace("/login");
    } catch {
      setError("No se pudo cerrar sesión. Inténtalo nuevamente.");
      setPending(false);
    }
  }
  return <>
    <button type="button" onClick={logout} disabled={pending} className="mt-3 w-full rounded-xl border border-[#e7e5e2] bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-[#c80000] hover:text-[#c80000] disabled:opacity-60">{pending ? "Cerrando sesión…" : "Cerrar sesión"}</button>
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </>;
}
