import {handleConnectionRequestHttp} from '@/lib/meta-admin/connection-request-http.mjs'
import {getCentralReceiptStore} from '@/lib/meta-admin/connection-receiver-pool.mjs'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(request: Request){
 // Fail closed if feature flag, database login or signing config is missing.
 try{
  const store=getCentralReceiptStore(process.env)
  return await handleConnectionRequestHttp(request,{env:process.env,store})
 }catch{
  return Response.json({error:'receiver_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})
 }
}
