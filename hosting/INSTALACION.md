# Documentos en cPanel

1. Confirma que `https://media.inmobiliariaalbertoalfaro.com.pe` llega a cPanel y tiene SSL válido.
2. En Administrador de archivos crea `/home5/inmobi16/documentos-privados` con permisos 0700, fuera de todas las carpetas públicas.
3. Copia `documentos-config.example.php` a `/home5/inmobi16/documentos-config.php` con permisos 0600. Reemplaza el token por un secreto aleatorio: puedes generarlo en Codespaces con `openssl rand -hex 32`. No publiques ni envíes ese secreto por chat.
4. Sube `documentos.php` a la raíz web del subdominio. La URL será `https://media.inmobiliariaalbertoalfaro.com.pe/documentos.php`. Sin autorización debe responder 401 (503 indica que falta configurar el servicio).
5. Configura estas variables de servidor en Vercel y en el entorno local de Codespaces:

```dotenv
DOCUMENT_STORAGE=hosting
DOCUMENT_HOSTING_URL=https://media.inmobiliariaalbertoalfaro.com.pe/documentos.php
DOCUMENT_HOSTING_TOKEN=EL_MISMO_SECRETO_DEL_ARCHIVO_PHP
```

6. Despliega la versión modificada y prueba subir, abrir, descargar y eliminar un PDF ficticio. Comprueba la carpeta `documentos-privados/inmuebles/` en cPanel. Los registros continúan en la base de datos actual; no hace falta modificar su estructura.

Los documentos de Blob anteriores no se migran automáticamente. Conserva sus credenciales para abrirlos o eliminarlos. Con `DOCUMENT_STORAGE=hosting`, una falla del hosting NO envía nuevas subidas a Blob.

El almacenamiento queda en cPanel, pero la subida y descarga pasan por las funciones de Vercel y pueden consumir transferencia y ejecución allí. La aplicación conserva su autenticación y límite de 4 MB. No se publica una URL directa de los documentos ni el secreto en el navegador.

Si la autenticación falla aun con el secreto correcto, revisa con el proveedor que PHP reciba el encabezado Authorization. No habilites acceso público como solución.
