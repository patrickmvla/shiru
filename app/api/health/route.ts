// File: apps/web/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // This log is important. Check your terminal for it.
  console.log("✅✅✅ /api/health route was successfully hit! ✅✅✅");
  return NextResponse.json({ status: "ok" });
}