// The prospective server route MUST check authenticated platform-admin session,
// strict origin/CSRF and the real receipt before invoking this orchestration.
// No direct HTTP exposure; dependency-injected for deterministic security tests.
import {verifyMetaAuthorization} from './meta-authorization-verifier.mjs'
const META_ID=/^[0-9]{5,24}$/
/** @param {{organizationId:string,protocolId:string,operatorId:string,sessionId:string,nonce:string,authorizationCode:string,wabaId:string,phoneNumberId:string,store:any,writer:any,appId:string,appSecret:string,version?:string,fetchFn?:typeof fetch}} input */
export async function finalizeVerifiedMetaAuthorization({
  organizationId,protocolId,operatorId,sessionId,nonce,
  authorizationCode,wabaId,phoneNumberId,
  store,writer,appId,appSecret,version='v26.0',fetchFn=fetch
}={}){
 if(typeof store?.checkAuthorization!=='function'||typeof writer?.store!=='function')
  throw Error('meta_finalization_dependencies_missing')
 if(typeof appId!=='string'||!META_ID.test(appId))throw Error('meta_finalization_app_invalid')
 // Preflight happens BEFORE the one-time OAuth code is exchanged.
 const valid=await store.checkAuthorization({
  organizationId,protocolId,operatorId,sessionId,nonce,wabaId,phoneNumberId
 })
 if(!valid?.provisioningId)throw Error('meta_finalization_session_invalid')
 const verified=await verifyMetaAuthorization({
  fetchFn,appId,appSecret,version,authorizationCode,wabaId,phoneNumberId
 })
 // The writer re-checks & consumes the one-time session in the SAME transaction
 // as the encrypted envelope and phase transition. If this fails, never retry
 // the consumed Meta code; require a fresh authorization after diagnosis.
 const result=await writer.store({
  identity:{organizationId,protocolId,wabaId:verified.wabaId,phoneNumberId:verified.phoneNumberId,appId:verified.appId},
  accessToken:verified.accessToken,grantedScopes:verified.scopes,operatorId,sessionId,nonce,
  expiresAt:verified.expiresAt
 })
 if(!result?.stored||result.provisioningId!==valid.provisioningId)
  throw Error('meta_finalization_storage_unverified')
 return Object.freeze({stored:true,provisioningId:result.provisioningId,
  fingerprint:result.fingerprint,checkedAt:verified.checkedAt})
}
