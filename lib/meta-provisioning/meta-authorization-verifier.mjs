// Server-side Meta Graph verification. No HTTP route is exposed by this module.
// The returned token may only be passed directly to the scoped credential writer.
// NEVER put raw token, OAuth code or Graph error payload into logs/audit/UI.
import {createHash} from 'node:crypto'

const META_ID=/^[0-9]{5,24}$/
const GRAPH_VERSION=/^v(?:[1-9]|[1-9][0-9])\.[0-9]{1,2}$/
const REQUIRED=['whatsapp_business_management','whatsapp_business_messaging']
const PUBLIC_GRAPH='https://graph.facebook.com/'

export class MetaAuthorizationError extends Error{
 constructor(code){super(code);this.name='MetaAuthorizationError';this.code=code}
}
function ensureId(value){if(typeof value!=='string'||!META_ID.test(value))throw new MetaAuthorizationError('meta_invalid_identity');return value}
function config(input){
 const appId=ensureId(input?.appId)
 const version=input?.version||'v26.0'
 const appSecret=input?.appSecret
 if(typeof appSecret!=='string'||appSecret.length<16||!GRAPH_VERSION.test(version))
  throw new MetaAuthorizationError('meta_configuration_invalid')
 return {appId,appSecret,version}
}
async function graphJson({fetchFn,version,path,token,method='GET',body}){
 let response
 try{
  response=await fetchFn(PUBLIC_GRAPH+version+'/'+path,{
   method,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000),
   headers:{Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{}),
    ...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},
   ...(body?{body:new URLSearchParams(body).toString()}:{})
  })
 }catch{throw new MetaAuthorizationError('meta_transport_unavailable')}
 let parsed
 try{parsed=await response.json()}catch{throw new MetaAuthorizationError('meta_invalid_response')}
 if(!response.ok||parsed?.error||!parsed||typeof parsed!=='object')
  throw new MetaAuthorizationError('meta_api_rejected')
 return parsed
}
function assertCompleteList(payload,kind){
 if(!Array.isArray(payload?.data)||payload?.paging?.next||payload.data.length>=100)
  throw new MetaAuthorizationError('meta_'+kind+'_unverifiable')
 return payload.data
}
export async function verifyMetaAuthorization({
 fetchFn=fetch,appId,appSecret,version='v26.0',
 authorizationCode,wabaId,phoneNumberId
}={}){
 const cfg=config({appId,appSecret,version})
 ensureId(wabaId);ensureId(phoneNumberId)
 if(typeof authorizationCode!=='string'||authorizationCode.length<12||
  authorizationCode.length>4096)throw new MetaAuthorizationError('meta_code_invalid')
 // OAuth authorization codes are single-use. The exchange must be called only
 // after a valid unconsumed tenant/operator session has been verified.
 const issued=await graphJson({fetchFn,version:cfg.version,path:'oauth/access_token',method:'POST',
  body:{client_id:cfg.appId,client_secret:cfg.appSecret,code:authorizationCode}})
 const accessToken=issued.access_token
 if(typeof accessToken!=='string'||accessToken.length<20||
    accessToken.length>8192)throw new MetaAuthorizationError('meta_token_missing')
 const debug=await graphJson({fetchFn,version:cfg.version,path:'debug_token',
  token:cfg.appId+'|'+cfg.appSecret,method:'POST',
  body:{input_token:accessToken,access_token:cfg.appId+'|'+cfg.appSecret}})
 if(debug.data?.is_valid!==true||String(debug.data?.app_id)!==cfg.appId)
  throw new MetaAuthorizationError('meta_wrong_app_or_invalid_token')
 const scopes=debug.data?.scopes
 if(!Array.isArray(scopes)||REQUIRED.some(scope=>!scopes.includes(scope)))
  throw new MetaAuthorizationError('meta_missing_scopes')
 if(debug.data?.expires_at&&Number(debug.data.expires_at)*1000<=Date.now())
  throw new MetaAuthorizationError('meta_expired_token')
 // Verify the actual WABA ID and its membership rather than trusting the UI.
 const [waba,phones]=await Promise.all([
  graphJson({fetchFn,version:cfg.version,path:wabaId+'?fields=id',token:accessToken}),
  graphJson({fetchFn,version:cfg.version,path:wabaId+'/phone_numbers?fields=id&limit=100',token:accessToken})
 ])
 if(String(waba.id)!==wabaId)throw new MetaAuthorizationError('meta_wrong_waba')
 if(!assertCompleteList(phones,'phones').some(x=>String(x?.id)===phoneNumberId))
  throw new MetaAuthorizationError('meta_phone_not_in_waba')
 const expiresAt=debug.data?.expires_at
  ? new Date(Number(debug.data.expires_at)*1000).toISOString()
  : null
 return {
  accessToken,scopes:scopes.filter(x=>typeof x==='string'),
  expiresAt,wabaId,phoneNumberId,appId:cfg.appId,
  fingerprint:createHash('sha256').update(accessToken).digest('hex').slice(0,16),
  checkedAt:new Date().toISOString()
 }
}
