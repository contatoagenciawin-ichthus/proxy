import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

function confirmationCode(seed: string) {
  return createHash("sha256").update(seed).digest("hex").slice(0, 24)
}

async function handle(request: NextRequest) {
  const body = await request.text()
  const seed = body || `${Date.now()}-${request.headers.get("user-agent") || "meta"}`
  const code = confirmationCode(seed)
  const origin = new URL(request.url).origin

  return NextResponse.json({
    url: `${origin}/meta/data-deletion/status?code=${code}`,
    confirmation_code: code,
  })
}

export async function POST(request: NextRequest) {
  return handle(request)
}

export async function GET(request: NextRequest) {
  return handle(request)
}
