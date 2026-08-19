import { NextResponse } from "next/server";

/** Probe de sante du frontend (independante de celle de l'API NestJS). */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
