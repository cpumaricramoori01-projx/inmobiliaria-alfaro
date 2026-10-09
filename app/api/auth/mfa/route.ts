import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'La verificación en dos pasos está desactivada. Inicia sesión con usuario y contraseña.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
