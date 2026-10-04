"use client";

import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mfa,setMfa]=useState<{setup:boolean;secret?:string;otpauth?:string}|null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const response = await fetch(mfa ? "/api/auth/mfa" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mfa ? {code:form.get("code")} : { usuario: form.get("usuario"), password: form.get("password") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar sesión.");
      if(data.mfaRequired){setMfa(data);setPending(false);return;}
      window.location.replace(data.redirectTo || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo conectar. Inténtalo nuevamente.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      {!mfa && <><div>
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
      </>}
      {mfa && <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800">{mfa.setup ? 'Activa la verificación en dos pasos' : 'Confirma tu acceso'}</h2>
        {mfa.setup && <><p className="text-sm leading-6 text-slate-600">Agrega una cuenta en tu aplicación de autenticación con esta clave. Conserva una copia segura o activa el respaldo de tu aplicación.</p><p className="break-all rounded-xl bg-slate-100 p-3 font-mono text-sm select-all">{mfa.secret}</p><a href={mfa.otpauth} className="inline-block text-sm font-semibold text-red-700">Abrir en mi aplicación de autenticación</a></>}
        <label className="block text-sm font-semibold text-slate-700">Código de 6 dígitos<input name="code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required maxLength={6} disabled={pending} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-lg tracking-widest" /></label>
        <button type="button" disabled={pending} onClick={()=>{setMfa(null);setError('');}} className="text-xs text-slate-500">Volver al inicio de sesión</button>
      </div>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-[#c80000] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a90000] disabled:cursor-wait disabled:opacity-60">{pending ? "Verificando…" : mfa ? "Verificar código" : "Iniciar sesión"}</button>
    </form>
  );
}
