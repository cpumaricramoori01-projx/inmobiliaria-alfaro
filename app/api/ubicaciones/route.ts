import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { allowedGoogleMapsUrl, parseGoogleMapsLocation } from "@/lib/location.mjs";

export async function POST(request: Request) {
  const auth = await authorizeApi(request, "informacion");
  if (auth.response) return auth.response;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enlace no válido." }, { status: 400 }); }
  if (!body || typeof body.enlace !== "string" || body.enlace.length > 4096 || !allowedGoogleMapsUrl(body.enlace)) {
    return NextResponse.json({ error: "Pega un enlace HTTPS de Google Maps." }, { status: 400 });
  }
  let current = body.enlace;
  const signal = AbortSignal.timeout(8000);
  try {
    for (let step = 0; step < 5; step++) {
      if (!allowedGoogleMapsUrl(current)) break;
      const point = parseGoogleMapsLocation(current);
      if (point) return NextResponse.json(point, { headers: { "Cache-Control": "private, no-store" } });
      const response = await fetch(current, { redirect: "manual", signal, cache: "no-store" });
      await response.body?.cancel();
      const redirect = response.headers.get("location");
      if (response.status < 300 || response.status > 399 || !redirect) break;
      current = new URL(redirect, current).href;
    }
    return NextResponse.json({ error: "El enlace no incluye un punto identificable. Abre Google Maps, selecciona el inmueble y copia su enlace; también puedes marcarlo aquí." }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "No se pudo abrir el enlace. Prueba con la dirección completa de Google Maps o marca el punto en el mapa." }, { status: 502 });
  }
}
