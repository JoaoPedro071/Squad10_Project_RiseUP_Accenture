import { NextResponse } from "next/server";
import { listClients, updateClient } from "@/lib/store";

type Context = { params: Promise<{ clientId: string }> };

function isPercent(value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

export async function PUT(request: Request, { params }: Context) {
  const { clientId } = await params;
  const body = await request.json().catch(() => null);

  if (!isPercent(body?.x) || !isPercent(body?.y)) {
    return NextResponse.json({ error: "Posição inválida" }, { status: 422 });
  }

  const current = listClients().find((c) => c.id === clientId);
  if (!current) {
    return NextResponse.json({ error: "Tela não encontrada" }, { status: 404 });
  }
  if (current.locked) {
    return NextResponse.json(
      { error: "Esta tela está travada" },
      { status: 403 },
    );
  }

  const client = updateClient(clientId, { x: body.x, y: body.y });
  return NextResponse.json(client);
}
