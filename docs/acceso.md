# Acceso al sistema

La entrada `/` requiere una sesión y redirige a `/login` cuando no la hay. Las cuentas se validan en `inm_usuarios` mediante `usuario` y `password_hash`. El sistema admite varias cuentas. El rol `administrador` accede a todos los módulos. Los demás usuarios, incluyendo `operador` y el rol anterior `usuario`, solo acceden a Información de inmuebles (`/datos-inmuebles`), donde pueden consultar y completar la ficha, datos del propietario y documentación. Inician sesión directamente en ese módulo. El menú oculta los demás apartados; sus páginas redirigen a Información de inmuebles y sus APIs rechazan el acceso con HTTP 403. Los permisos se verifican en el servidor para cada solicitud.

## Preparar una base existente

Ejecutar en la terminal del proyecto, con `DATABASE_URL` configurada en `.env.local`:

```bash
npm run auth:install
npm run auth:user -- --usuario alberto --nombre "Alberto Alfaro" --rol administrador
npm run auth:user -- --usuario operador --nombre "Operador" --rol operador
```

Se puede agregar `--email correo@ejemplo.com` para usar el correo de una cuenta existente; si se omite se asigna un identificador interno `usuario@inmobiliaria-alfaro.local`, sin enviar correos. Los comandos preguntan y confirman la contraseña sin mostrarla; nunca se pasa como argumento ni se guarda en el código. Debe tener al menos 12 caracteres. Repetir `auth:user` para la misma cuenta cambia su contraseña e invalida sus sesiones. Los usuarios anteriores sin contraseña no pueden iniciar sesión hasta configurar su cuenta.

`auth:install` agrega únicamente los campos e índices de acceso y la tabla de sesiones, admite ejecuciones repetidas y conserva los datos existentes. Para instalaciones gestionadas completamente por Drizzle, la migración `0002_mixed_gwen_stacy.sql` incorpora los mismos cambios; usar una sola vía de migración para evitar aplicar las mismas operaciones dos veces.

## Sesiones y trazabilidad

Las sesiones duran ocho horas. La cookie es HttpOnly, SameSite=Lax y Secure en producción (requiere HTTPS). MySQL guarda solo el hash del token. Cerrar sesión invalida el registro en MySQL y borra la cookie. Desactivar una cuenta en `inm_usuarios.activo` bloquea también sus sesiones existentes.

Las páginas verifican la sesión en el layout privado y cada API la verifica antes de consultar o modificar datos. Las solicitudes de escritura requieren un encabezado Origin del mismo sitio. Tras cinco contraseñas incorrectas, la cuenta se bloquea durante 15 minutos. No hay registro público ni contraseñas predeterminadas.

Las nuevas visitas, tasaciones, publicaciones, documentos y liberaciones registran el ID del usuario autenticado. El dashboard y el menú muestran su nombre y rol.

## Verificación

```bash
npm run test:auth
npm run build
```

En entornos con restricciones de Turbopack, usar `npm run build -- --webpack`. La prueba de integración se ejecuta de forma explícita con `node tests/auth.integration.mjs`: levanta un servidor en el puerto 3107, crea dos cuentas temporales en la base configurada y las elimina al terminar. No debe ejecutarse mientras se está compilando.

Comprobar con ambas cuentas: inicio de sesión, cierre de sesión y rechazo de acceso anónimo. El administrador puede entrar a todos los módulos; el operador solo a Información de inmuebles, incluyendo sus APIs de ficha y documentación. Para restablecer una cuenta bloqueada, ejecutar `auth:user` o restablecer `intentos_fallidos` y `bloqueo_hasta` desde la administración de la base.
