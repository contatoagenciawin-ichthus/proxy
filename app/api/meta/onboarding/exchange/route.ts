import { NextResponse } from "next/server"
import { exchangeMetaAuthorization } from "../../../../../lib/meta-authorization-exchange"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  try {
    return await exchangeMetaAuthorization(await request.json())
  } catch {
    return NextResponse.json({ok:false,error:"invalid_request"},{status:400})
  }
}
