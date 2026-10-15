import { NextResponse } from "next/server";
import { getToolJwks } from "@/lib/jwks";

export async function GET() {
  return NextResponse.json(await getToolJwks(), {
    headers: {
      "Cache-Control": "public, max-age=300"
    }
  });
}
