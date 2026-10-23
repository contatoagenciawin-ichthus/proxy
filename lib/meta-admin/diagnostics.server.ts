import 'server-only'
import { currentPlatformAdmin } from './auth'
import { readProductDiagnostic } from './diagnostics-client.mjs'
export async function getProductDiagnostic(client: string) {
  if (!(await currentPlatformAdmin())) return { state: 'denied' as const, snapshot: null }
  return readProductDiagnostic(client)
}
