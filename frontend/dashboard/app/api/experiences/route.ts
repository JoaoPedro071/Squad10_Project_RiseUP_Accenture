import { NextResponse } from "next/server";
import { createExperience, listExperiences } from "@/lib/store";
import { validateExperience } from "@/lib/validation";

export async function GET() {
  return NextResponse.json(listExperiences());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fieldErrors = validateExperience(body ?? {});

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ fieldErrors }, { status: 400 });
  }
  return NextResponse.json(createExperience(body), { status: 201 });
}