"use client";

import { createContext, useContext } from "react";

export type SessionUser = { id: number; nombre: string; usuario: string | null; rol: string };
const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSessionUser() {
  const user = useContext(SessionContext);
  if (!user) throw new Error("Falta una sesión válida.");
  return user;
}
