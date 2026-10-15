import { NextResponse } from "next/server";
import { findExperience, updateClient } from "@/lib/store";

type Context = { params: Promise<{ clientId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const { clientId } = await params;
  const body = await request.json().catch(() => null);
  const experience = findExperience(String(body?.experienceId ?? ""));

  if (!experience || !experience.active) {
    return NextResponse.json({ error: "Experiência indisponível" }, { status: 422 });
  }

  const client = updateClient(clientId, {
    currentExperienceId: experience.id,
    displayOff: false,
  });
  if (!client) {
    return NextResponse.json({ error: "Tela não encontrada" }, { status: 404 });
  }
  return NextResponse.json(client);
}