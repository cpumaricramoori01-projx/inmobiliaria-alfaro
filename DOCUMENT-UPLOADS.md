# Documentación: archivos privados en Vercel

Solo Información de inmuebles → Documentación usa esta subida. Los enlaces anteriores continúan funcionando y los demás módulos conservan su comportamiento.

## Conectar el almacenamiento

En el proyecto Vercel `puma19/inmobiliaria-alfarov2`, abrir Storage → Create Storage → Blob → Private. Conectar el store a Production, con los nombres de variables predeterminados. Volver a desplegar después de conectar. El SDK usa OIDC y `BLOB_STORE_ID` en Vercel; también admite `BLOB_READ_WRITE_TOKEN`. Nunca poner tokens en variables `NEXT_PUBLIC_*`.

Para trabajar localmente, conectar Development y obtener las variables de forma segura mediante `vercel env pull`. No compartir tokens por chat ni subir `.env.local` a Git.

## Base de datos

Para una instalación existente: `node scripts/install-documents.mjs` agrega los cinco campos de forma idempotente sin modificar registros previos. La migración Drizzle `0004_adorable_warlock.sql` representa el mismo cambio; no aplicarla dos veces a una base donde ya se ejecutó el instalador. `db/schema.sql` incluye los campos para instalaciones nuevas.

## Funcionamiento

PDF, DOC, DOCX, XLS y XLSX hasta 4 MiB por archivo, para mantener la petición multipart por debajo del límite de 4.5 MB de Vercel Functions. Se valida extensión, tamaño y firma del contenido; para DOCX/XLSX se comprueba el directorio Office del ZIP sin descomprimir. Esta comprobación de formato no sustituye un antivirus.

Ruta: `inmuebles/posicion-11/inmueble-123/copia-literal/UUID-nombre.pdf`. El ID evita mezclar documentos cuando se reutiliza una posición. La posición refleja la asignación al subir; los inmuebles sin posición usan `sin-posicion`. Los archivos registrados mantienen su ruta aunque cambie la posición.

Los documentos son privados y se sirven por una API con la misma sesión/permisos de Información de inmuebles (administrador y operador). PDF se abre en el navegador; Office se descarga. Se permite descarga explícita. Eliminar un archivo nuevo elimina Blob y luego su registro; quitar un enlace antiguo conserva el archivo externo. Un fallo al registrar en MySQL intenta eliminar el Blob recién subido.

## Verificación

`node --test tests/document-files.test.mjs` valida formatos, límites, carpetas, configuración y limpieza tras fallo de registro. `node tests/auth.integration.mjs` comprueba permisos de administrador/operador, multipart inválido, falta de almacenamiento y rechazo de solicitudes de otro origen. Una prueba real de subida requiere conectar el store privado; el formulario informa de la configuración pendiente sin simular archivos.
