import {getVaultDiagnostic} from '@/lib/meta-provisioning/runtime.mjs'
import {handleIchthusHumanOutbound} from '@/lib/ichthus-human-outbound-handler.mjs'
export const runtime='nodejs'
export const dynamic='force-dynamic'

// Authenticated machine-to-machine operation. Never accepts browser sessions,
// Meta tokens, customer tenant IDs, or client-chosen Phone Number IDs.
export async function POST(request:Request){
 return handleIchthusHumanOutbound(request,{
  send:input=>getVaultDiagnostic().sendIchthusText(input)
 })
}
