export type ManagedUser = {
  id: number;
  nombre: string;
  usuario: string | null;
  email: string;
  rol: "administrador" | "operador";
  activo: boolean;
  tienePassword: boolean;
  bloqueado: boolean;
  fechaRegistro: string;
};
export type UserForm = {
  nombre: string;
  usuario: string;
  email: string;
  rol: "administrador" | "operador";
  activo: boolean;
  password: string;
  confirmacion: string;
  desbloquear: boolean;
};
