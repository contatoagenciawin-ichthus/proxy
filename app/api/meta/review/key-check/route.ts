import { createHash, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"

function fingerprint(value: string) {
  if (!value) return "missing"
  return createHash("sha256").update(value).digest("hex").slice(0, 10)
}

export async function POST(request: Request) {
  const configured = process.env.META_REVIEW_KEY || ""
  const provided = request.headers.get("x-review-key") || ""

  const configuredBuffer = Buffer.from(configured)
  const providedBuffer = Buffer.from(provided)

  const matches =
    configured.length > 0 &&
    configuredBuffer.length === providedBuffer.length &&
    timingSafeEqual(configuredBuffer, providedBuffer)

  return NextResponse.json(
    {
      ok: matches,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      deploymentUrl: process.env.VERCEL_URL || null,
      configured: Boolean(configured),
      configuredFingerprint: fingerprint(configured),
      providedFingerprint: fingerprint(provided),
    },
    { status: matches ? 200 : 401 },
  )
}

export const dynamic = "force-dynamic"
