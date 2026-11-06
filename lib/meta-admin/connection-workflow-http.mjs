// Narrow admin API contract. Authentication and the database runtime are
// injected by the server route; never accept actor identity from the browser.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const json=(status,body)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}})
/**
 * @param {Request} request
 * @param {{env?:Record<string,string|undefined>,resolveOperator?:()=>Promise<{user?:{id?:string}}|null>,getRuntime?:(env:any)=>any}} dependencies
 */
export async function handleConnectionWorkflowHttp(request,{
 env={},resolveOperator,getRuntime
}={}){
 if(env.VERCEL_ENV!=='preview'||env.VERCEL_GIT_COMMIT_REF!=='feat/g2-workflow-admin-integration-20261106'||
    env.PROXY_REQUEST_WORKFLOW_ENABLED!=='true'||env.PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED!=='true')
   return json(503,{error:'workflow_disabled'})
 if(!['GET','POST'].includes(request.method))return json(405,{error:'method_not_allowed'})
 const url=new URL(request.url)
 if(url.protocol!=='https:'||url.search||url.hash)return json(400,{error:'invalid_request'})
 if(request.method==='POST'){
  // Include both Origin and Fetch Metadata checks. The browser's cookie is
  // allowed only after authentication, never trusted as an operator ID.
  if(request.headers.get('origin')!==url.origin||
     request.headers.get('sec-fetch-site')==='cross-site')
    return json(403,{error:'origin_denied'})
  const len=Number(request.headers.get('content-length')||0)
  if(!Number.isFinite(len)||len>4096)return json(413,{error:'request_too_large'})
 }
 const operator=await resolveOperator?.()
 const actorId=operator?.user?.id
 if(typeof actorId!=='string'||!/^\d{1,32}$/.test(actorId))return json(401,{error:'unauthorized'})
 let body
 if(request.method==='GET'){
  const segments=url.pathname.split('/').filter(Boolean)
  if(segments.length!==7||segments.slice(0,5).join('/')!=='api/meta/admin/requests/workflow')
    return json(400,{error:'invalid_request'})
  body={organizationId:segments[5],protocolId:segments[6]}
 }else{
  if(request.headers.get('content-type')?.split(';')[0]?.trim()!=='application/json')
   return json(415,{error:'invalid_content_type'})
  let raw
  try{
   const reader=request.body?.getReader()
   if(!reader)return json(400,{error:'invalid_request'})
   const chunks=[];let count=0
   while(true){
    const part=await reader.read()
    if(part.done)break
    count+=part.value.byteLength
    if(count>4096){await reader.cancel();return json(413,{error:'request_too_large'})}
    chunks.push(part.value)
   }
   raw=Buffer.concat(chunks).toString('utf8')
   body=JSON.parse(raw)
  }catch{return json(400,{error:'invalid_request'})}
  if(!body||typeof body!=='object'||Array.isArray(body)||
     Object.keys(body).sort().join(',')!=='action,expectedVersion,organizationId,payload,protocolId')
    return json(400,{error:'invalid_request'})
 }
 const segments=url.pathname.split('/').filter(Boolean)
 if(segments.length!==7||segments.slice(0,5).join('/')!=='api/meta/admin/requests/workflow'||
    body.organizationId!==segments[5]||body.protocolId!==segments[6]||
    !UUID.test(body.organizationId||'')||!UUID.test(body.protocolId||''))
  return json(400,{error:'invalid_request'})
 try{
  const service=getRuntime?.(env)
  if(!service)return json(503,{error:'workflow_unavailable'})
  const result=request.method==='GET'
   ?await service.read({actorId,organizationId:body.organizationId,protocolId:body.protocolId})
   :await service.apply({actorId,organizationId:body.organizationId,protocolId:body.protocolId,
       expectedVersion:body.expectedVersion,action:body.action,payload:body.payload})
  return json(200,{data:result})
 }catch(e){
  if(e?.message==='workflow_version_conflict')return json(409,{error:'workflow_version_conflict'})
  if(e?.message==='workflow_operator_denied')return json(403,{error:'access_denied'})
  if(e?.message==='invalid_stage_transition'||e?.message==='operational_validation_required'||
     /^invalid_/.test(e?.message||''))return json(400,{error:'invalid_request'})
  return json(503,{error:'workflow_unavailable'})
 }
}
