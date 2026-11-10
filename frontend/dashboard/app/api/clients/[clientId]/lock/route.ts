import { NextResponse } from "next/server";
import { updateClient } from "@/lib/store";

type Context = { params: Promise<{ clientId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const { clientId } = await params;
  const body = await request.json().catch(() => null);

  if (typeof body?.locked !== "boolean") {
    return NextResponse.json({ error: "Campo locked inválido" }, { status: 422 });
  }

  const client = updateClient(clientId, { locked: body.locked });
  if (!client) {
    return NextResponse.json({ error: "Tela não encontrada" }, { status: 404 });
  }
  return NextResponse.json(client);
}