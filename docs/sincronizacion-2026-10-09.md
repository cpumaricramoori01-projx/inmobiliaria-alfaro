# Sincronización de la versión exportada de dark

Se integró el commit `32074404f6a9d13b7e6572f4d7ed09b9c75d8598` de la rama
`codespace-verbose-spoon-r766rp659j9gc5g46` en la versión de esta cuenta.

Los conflictos de las pantallas se resolvieron conservando la versión exportada,
que contiene la agenda de atención, contratos y seguimiento de alquileres,
catálogos de ubicaciones y tipos, y mejoras de gestión de inmuebles.
Se conserva el tipado ReactNode del layout y el acceso local con usuario y
contraseña, incluida la confirmación de contraseña al gestionar accesos.
El endpoint anterior de MFA permanece desactivado.
Los metadatos usan el dominio de intranet2.

## Verificación

- TypeScript y ESLint correctos.
- 17 archivos de pruebas unitarias correctos.
- Compilación de producción correcta en Vercel.
- Las 22 tablas del esquema y todos sus campos existen en producción.
  No se ejecutaron migraciones ni se modificaron registros de inmuebles.
- Verificación en el despliegue con cuentas temporales: acceso de administrador
  y operador sin MFA, 14 páginas, 9 APIs, componentes de las capturas,
  permisos y confirmación de contraseña. Cuentas y sesiones eliminadas al terminar.

El repositorio de dark mantiene su rama exportada; esta sesión tiene acceso
solo de lectura a ese repositorio y no modifica su Vercel.
