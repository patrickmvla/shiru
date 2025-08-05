import { NextResponse } from "next/server";

export async function GET() {
  console.log("✅ Native Next.js API route /api/test was hit!");
  return NextResponse.json({ message: "Hello from native Next.js!" });
}
