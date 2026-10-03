import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { updateManagedUser, userManagementError } from "@/lib/user-admin";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(request);
  if (auth.response) return auth.response;
  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return NextResponse.json({ error: "Usuario no válido." }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Datos de usuario no válidos." }, { status: 400 }); }
  try { return NextResponse.json(await updateManagedUser(auth.user.id, Number(id), body)); }
  catch (error) { return userManagementError(error); }
}
