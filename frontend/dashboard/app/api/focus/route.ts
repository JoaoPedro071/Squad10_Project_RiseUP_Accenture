import { NextResponse } from "next/server";
import { endFocus, getFocus, listClients, startFocus } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ focus: getFocus(), clients: listClients() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = startFocus(String(body?.clientId ?? ""));

  if (typeof result === "string") {
    const errors = {
      not_found: { message: "Tela não encontrada", status: 404 },
      offline: { message: "A tela está offline", status: 422 },
      already_active: { message: "O Modo foco já está ativo", status: 409 },
    } as const;
    const { message, status } = errors[result];
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json(
    { focus: result, clients: listClients() },
    { status: 201 },
  );
}

export async function DELETE() {
  endFocus();
  return NextResponse.json({ focus: null, clients: listClients() });
}