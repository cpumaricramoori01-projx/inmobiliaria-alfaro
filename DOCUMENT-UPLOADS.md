# Documentos privados en el hosting cPanel

Información de inmuebles → Documentación guarda PDF, DOC, DOCX, XLS y XLSX de hasta 4 MiB en el hosting. La instalación del servicio PHP y sus variables se describen en [hosting/INSTALACION.md](hosting/INSTALACION.md).

La aplicación usa únicamente `DOCUMENT_HOSTING_URL` y `DOCUMENT_HOSTING_TOKEN`, tanto en Vercel como en Codespaces. `DOCUMENT_STORAGE=hosting` puede conservarse por compatibilidad, pero ya no selecciona otro proveedor. Las claves son privadas y no deben publicarse ni usar el prefijo `NEXT_PUBLIC_`.

Los archivos están en `/home5/inmobi16/documentos-privados/inmuebles/CODIGO-posicion-N/tipo/UUID-nombre.pdf`. La posición refleja la asignación al subir y las rutas anteriores se conservan aunque cambie. Los inmuebles sin posición usan `sin-posicion`.

Se valida extensión, tamaño y contenido antes de subir. Los documentos se abren o descargan mediante la API de la aplicación, que comprueba sesión y permisos. Eliminar un documento borra primero el archivo del hosting y luego su registro en MySQL. Si el registro de una subida falla, se intenta limpiar el archivo recién subido. Los enlaces externos conservan su comportamiento.

La base de datos usa los campos instalados por `node scripts/install-documents.mjs`; no requiere cambios por retirar Blob. La aplicación ya no depende de Vercel Blob. El almacenamiento reside en cPanel; la subida y descarga siguen usando funciones y transferencia de Vercel.

## Verificación

`node --test tests/document-files.test.mjs` comprueba formatos, límites, rutas, configuración y limpieza ante fallos. `node tests/auth.integration.mjs` comprueba permisos y validaciones de las APIs contra un entorno de prueba configurado.
