import type { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/meta-admin/auth'
import { getAdminConfig, requestHasAdminOrigin } from '@/lib/meta-admin/policy.mjs'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
async function handle(request: NextRequest) {
  const config = getAdminConfig()
  const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
  if (!config) return Response.json({ error: 'admin_unavailable' }, { status: 503, headers })
  if (!requestHasAdminOrigin(request, config)) return Response.json({ error: 'origin_rejected' }, { status: 403, headers })
  const instance = adminAuth()!
  const response = await (request.method === 'POST' ? instance.handlers.POST(request) : instance.handlers.GET(request))
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
  return response
}
export const GET = handle
export const POST = handle
