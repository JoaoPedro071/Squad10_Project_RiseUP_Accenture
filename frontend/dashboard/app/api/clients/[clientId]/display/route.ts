import { NextResponse } from "next/server";
import { getDisplayState, updateClient } from "@/lib/store";

type Context = { params: Promise<{ clientId: string }> };

// Permite que o Client App (outra porta) leia esta resposta.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

export async function GET(_request: Request, { params }: Context) {
  const { clientId } = await params;
  const state = getDisplayState(clientId);
  if (!state) {
    return NextResponse.json(
      { error: "Tela não encontrada" },
      { status: 404, headers: corsHeaders },
    );
  }
  return NextResponse.json(state, { headers: corsHeaders });
}

export async function PUT(request: Request, { params }: Context) {
  const { clientId } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.displayOff !== "boolean") {
    return NextResponse.json({ error: "Campo displayOff inválido" }, { status: 422 });
  }
  const client = updateClient(clientId, { displayOff: body.displayOff });
  if (!client) {
    return NextResponse.json({ error: "Tela não encontrada" }, { status: 404 });
  }
  return NextResponse.json(client);
}