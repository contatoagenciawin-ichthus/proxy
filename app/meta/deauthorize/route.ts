import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Desautorização recebida pela Proxy Technology.",
  })
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "meta-deauthorize",
  })
}
