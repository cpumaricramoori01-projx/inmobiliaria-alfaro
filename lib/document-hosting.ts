// Server-only credentials: never expose these variables to the browser.
export async function hostingRequest(method: string, pathname: string, bytes?: Uint8Array) {
  const endpoint = new URL(process.env.DOCUMENT_HOSTING_URL || '');
  if (endpoint.protocol !== 'https:' || !process.env.DOCUMENT_HOSTING_TOKEN) throw new Error('Hosting no configurado.');
  endpoint.searchParams.set('path', pathname);
  const response = await fetch(endpoint, {
    method, headers: { Authorization: `Bearer ${process.env.DOCUMENT_HOSTING_TOKEN}`, 'Content-Type': 'application/octet-stream' },
    body: bytes ? new Uint8Array(bytes) : undefined,
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error('El hosting no pudo procesar el documento.');
  return response;
}
