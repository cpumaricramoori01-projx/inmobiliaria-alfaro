"use client";

import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: form.get("usuario"), password: form.get("password") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar sesión.");
      window.location.replace(data.redirectTo || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo conectar. Inténtalo nuevamente.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="usuario" className="text-sm font-semibold text-slate-700">Usuario</label>
        <input id="usuario" name="usuario" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={60} placeholder="Tu usuario" disabled={pending} className="mt-2 w-full rounded-xl border border-[#e7e5e2] bg-[#faf9f7] px-4 py-3 text-sm outline-none focus:border-[#c80000] disabled:opacity-60" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">Contraseña</label>
        <div className="relative mt-2">
          <input id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" required maxLength={256} disabled={pending} className="w-full rounded-xl border border-[#e7e5e2] bg-[#faf9f7] py-3 pl-4 pr-20 text-sm outline-none focus:border-[#c80000] disabled:opacity-60" />
          <button type="button" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible} onClick={() => setVisible(!visible)} className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-500">{visible ? "Ocultar" : "Mostrar"}</button>
        </div>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-[#c80000] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a90000] disabled:cursor-wait disabled:opacity-60">{pending ? "Ingresando…" : "Iniciar sesión"}</button>
    </form>
  );
}
