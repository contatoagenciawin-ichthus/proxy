import 'server-only'
import {getCentralReceiptStore} from './connection-receiver-pool.mjs'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export async function loadProviderConnectionRequests(env=process.env){
 if(env.PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED!=='true')return {state:'disabled',requests:[]}
 const allowed=String(env.PROXY_CONNECTION_REQUEST_ALLOWED_ORGS||'').split(',').map(x=>x.trim()).filter(Boolean)
 if(!allowed.length||allowed.length>50||new Set(allowed).size!==allowed.length||allowed.some(id=>!UUID.test(id)))return {state:'unavailable',requests:[]}
 try{
  const store=getCentralReceiptStore(env)
  if(typeof store?.listReceipts!=='function')return {state:'unavailable',requests:[]}
  // Iterating the server-maintained allowlist is intentional: no cross-tenant
  // privilege, no BYPASSRLS role and no browser-supplied organization ID.
  const perTenant=[]
  for(const organizationId of allowed){
   const data=await store.listReceipts(organizationId)
   perTenant.push(...data)
  }
  const requests=perTenant.sort((a,b)=>new Date(b.receivedAt)-new Date(a.receivedAt)).slice(0,100)
  return {state:'ready',requests}
 }catch{return {state:'unavailable',requests:[]}}
}
