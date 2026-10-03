export class UserInputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function field(value, label, max, required = false) {
  if (typeof value !== 'string' && value != null) throw new UserInputError(`Revisa ${label}.`);
  const result = (value ?? '').trim();
  if ((required && !result) || result.length > max) throw new UserInputError(`Revisa ${label} (máximo ${max} caracteres).`);
  return result;
}
export function userInput(body, creating = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new UserInputError('Datos de usuario no válidos.');
  const nombre = field(body.nombre, 'el nombre', 120, true);
  const usuario = field(body.usuario, 'el usuario', 60, true).toLowerCase();
  if (!/^[a-z0-9._-]{1,60}$/.test(usuario)) throw new UserInputError('El usuario admite letras, números, punto, guion y guion bajo.');
  const correo = field(body.email, 'el correo', 160);
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new UserInputError('Ingresa un correo válido.');
  const rol = body.rol ?? (creating ? 'operador' : undefined);
  if (!['administrador', 'operador'].includes(rol)) throw new UserInputError('Selecciona un rol válido.');
  const activo = body.activo ?? (creating ? true : undefined);
  if (typeof activo !== 'boolean') throw new UserInputError('Selecciona el estado de acceso.');
  if (body.desbloquear !== undefined && typeof body.desbloquear !== 'boolean') throw new UserInputError('Solicitud de desbloqueo no válida.');
  const password = body.password ?? '';
  if (typeof password !== 'string' || (creating && !password) || (password && (password.length < 8 || password.length > 256))) throw new UserInputError('La contraseña debe tener entre 8 y 256 caracteres.');
  if (password && body.confirmacion !== password) throw new UserInputError('Las contraseñas no coinciden.');
  return { nombre, usuario, email: correo || `${usuario}@inmobiliaria-alfaro.local`, rol, activo, password: password || null, desbloquear: body.desbloquear === true };
}
export function assertUserAccessChange(actor, target, values, activeAdministrators) {
  if (!actor?.activo || actor.rol !== 'administrador') throw new UserInputError('Tu cuenta ya no tiene permiso para administrar usuarios.', 403);
  if (target.id === actor.id && (!values.activo || values.rol !== 'administrador')) throw new UserInputError('Tu propia cuenta debe permanecer activa como administrador.', 409);
  if (target.activo && target.rol === 'administrador' && (!values.activo || values.rol !== 'administrador') && activeAdministrators <= 1) throw new UserInputError('Debe permanecer al menos un administrador activo.', 409);
}
