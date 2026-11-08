import {receiveConnectionRequest} from './connection-request-protocol.mjs'
const MAX_BYTES=2048
const noStore={'Cache-Control':'no-store'}
async function readBoundedRequest(request){
 const reader=request.body?.getReader()
 if(!reader)return ''
 const chunks=[];let size=0
 try{
  for(;;){
   const {done,value}=await reader.read()
   if(done)break
   size+=value.byteLength
   if(size>MAX_BYTES)throw new Error('payload_too_large')
   chunks.push(value)
  }
  return Buffer.concat(chunks.map(c=>Buffer.from(c))).toString('utf8')
 }finally{await reader.cancel().catch(()=>{})}
}

function answer(status,code){return Response.json({error:code},{status,headers:noStore})}
/**
 * @param {Request} request
 * @param {{ env?: Record<string, string | undefined>, store?: { saveReceipt: (input: any) => Promise<any> } | null, now?: number }} options
 */
export async function handleConnectionRequestHttp(request,{env={},store=null,now=Date.now()}={}){
 // Fail closed until dedicated central persistence and rollout are approved.
 if(env.PROXY_CONNECTION_REQUEST_RECEIVER_ENABLED!=='true')return answer(503,'receiver_disabled')
 if(typeof store?.saveReceipt!=='function')return answer(503,'receiver_storage_unavailable')
 if(request.method!=='POST')return answer(405,'method_not_allowed')
 if(!String(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return answer(415,'unsupported_content_type')
 const length=Number(request.headers.get('content-length')||'0')
 if(!Number.isFinite(length)||length<0||length>MAX_BYTES)return answer(413,'payload_too_large')
 const timestampText=request.headers.get('x-proxy-request-timestamp')
 if(!/^[0-9]{13}$/.test(timestampText||''))return answer(401,'invalid_signature')
 const timestamp=Number(timestampText)
 const signature=request.headers.get('x-proxy-request-signature')
 let raw
 try{raw=await readBoundedRequest(request)}catch(e){return answer(e?.message==='payload_too_large'?413:400,e?.message==='payload_too_large'?'payload_too_large':'invalid_request')}
 if(Buffer.byteLength(raw)>MAX_BYTES)return answer(413,'payload_too_large')
 let body
 try{body=JSON.parse(raw)}catch{return answer(400,'invalid_request')}
 const allowlist=String(env.PROXY_CONNECTION_REQUEST_ALLOWED_ORGS||'').split(',').map(x=>x.trim()).filter(Boolean)
 try{
  const result=await receiveConnectionRequest({
   body,timestamp,signature,secret:env.PROXY_CONNECTION_REQUEST_SHARED_SECRET,
   allowedTenants:allowlist,now,store,
  })
  return Response.json(result,{status:200,headers:noStore})
 }catch(e){
  if(['invalid_signature','stale_signature','tenant_not_allowed'].includes(e?.message)||e instanceof TypeError)return answer(401,'invalid_signature')
  // Never leak SQL errors, tenant details or configuration to senders.
  return answer(503,'receiver_unavailable')
 }
}
