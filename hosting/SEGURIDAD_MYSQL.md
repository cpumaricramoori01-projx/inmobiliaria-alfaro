# Cambios pendientes en el proveedor de MySQL

La revisión del 4 de octubre de 2026 encontró TLS disponible, pero el certificado no pasa la validación; la cuenta de la aplicación tiene ALL PRIVILEGES sobre su base, sin CREATE USER ni GRANT OPTION. Estas dos correcciones necesitan al administrador del hosting.

1. Solicitar el nombre DNS oficial de MySQL, su certificado CA y confirmación de que ese nombre aparece en el certificado. Validar estos datos mediante cPanel o un canal autenticado del proveedor. No aceptar un certificado obtenido de una conexión no verificada como única fuente de confianza.
2. Configurar el host certificado en DATABASE_URL y el PEM de la CA en DATABASE_SSL_CA, en local y Vercel. La aplicación verifica el certificado y el nombre. No utilizar rejectUnauthorized=false. Para certificados emitidos por una CA pública, se puede usar DATABASE_TLS_REQUIRED=1 sin una CA personalizada.
3. Antes de activar estos cambios en producción, probar una consulta y comprobar que Ssl_cipher no está vacío desde el entorno de ejecución. Exigir transporte seguro a la nueva cuenta y, si el proveedor lo permite, en el servidor.
4. Crear una cuenta distinta de ejecución. Otorgar SELECT, INSERT, UPDATE y DELETE en cada tabla de negocio; en inm_auth_limits e inm_auth_challenges, los mismos permisos. En inm_security_audit, solamente INSERT y SELECT. No otorgar CREATE, ALTER, DROP, GRANT OPTION ni permisos globales. Restringir su origen a los accesos realmente necesarios si el plan de Vercel permite IP de salida fija.
5. Conservar la cuenta de migraciones exclusivamente para los scripts de instalación y mantenimiento. Actualizar DATABASE_URL de producción a la cuenta limitada, probar inicio de sesión, MFA, fichas, documentos, visitas y usuarios. Después retirar la credencial anterior del runtime. No revocar permisos de la cuenta actual antes de comprobar la nueva.

Ejemplos para el administrador del proveedor, sustituyendo nombres y definiendo la contraseña fuera del chat y del repositorio:

```sql
-- El alta y la contraseña se gestionan en cPanel o mediante un canal seguro.
ALTER USER 'CUENTA_RUNTIME'@'ORIGEN' REQUIRE SSL;
GRANT SELECT, INSERT, UPDATE, DELETE ON BASE.inm_usuarios TO 'CUENTA_RUNTIME'@'ORIGEN';
-- Repetir para cada tabla de ejecución, excepto el registro de auditoría.
GRANT SELECT, INSERT ON BASE.inm_security_audit TO 'CUENTA_RUNTIME'@'ORIGEN';
```

No basta con añadir permisos limitados a una cuenta que conserva ALL PRIVILEGES. La nueva cuenta debe partir sin esos permisos. Las tablas nuevas se crean con `node scripts/install-security.mjs` desde el entorno de mantenimiento antes de desplegar.

# Operación de seguridad

Los administradores deben registrar una aplicación TOTP al siguiente inicio de sesión. Los operadores no necesitan TOTP y conservan consulta y edición; solamente los administradores pueden borrar fotos/documentos. Las sesiones vencen por 30 minutos de inactividad y por ocho horas totales. Cambios de usuarios requieren autenticación reciente de cinco minutos; vencida esa ventana, se vuelve a pedir contraseña y un código nuevo.

Conservar AUTH_MFA_KEY en el gestor de secretos y su respaldo seguro. No cambiarla sin una migración de los secretos cifrados. Si un administrador pierde su autenticador, un responsable con acceso de mantenimiento puede ejecutar `node scripts/reset-mfa.mjs USUARIO`; revoca sus sesiones y permite repetir el alta después de verificar la contraseña. Verificar su identidad fuera del sistema antes de usar este procedimiento.

Los eventos se consultan en `/seguridad`, solamente con una cuenta administrativa. Definir retención y alertas con el responsable del negocio. La cuenta runtime no debe poder alterar/borrar estos eventos; mantenimiento puede archivar los antiguos según esa política. No registrar contraseñas, secretos TOTP ni tokens.
