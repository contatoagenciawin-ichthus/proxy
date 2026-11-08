// Pure projection of provider receipt rows into a read-only administrative fiche.
// This is not onboarding permission, an editable workflow or Meta verification.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function findAdminRequestDetail({inbound,organizationId,protocolId}={}){
 if(!UUID.test(organizationId||'')||!UUID.test(protocolId||''))return {state:'invalid'}
 if(inbound?.state==='disabled')return {state:'disabled'}
 if(inbound?.state!=='ready'||!Array.isArray(inbound.requests))return {state:'unavailable'}
 const row=inbound.requests.find(r=>r.organizationId===organizationId&&r.protocolId===protocolId)
 if(!row)return {state:'not_found'}
 return {state:'ready',request:{
  protocolId:row.protocolId,organizationId:row.organizationId,
  product:row.product,channel:row.channel,status:row.status,receivedAt:row.receivedAt
 }}
}
