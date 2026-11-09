import {NextResponse} from 'next/server'
import {currentPlatformAdmin} from '@/lib/meta-admin/auth'
import {getAdminConfig} from '@/lib/meta-admin/policy.mjs'
import {getProvisioningStore,getCredentialWriter,provisioningEnabled} from '@/lib/meta-provisioning/runtime.mjs'
import {verifyProvisioningPost,validateProvisioningBody,readBoundedProvisioningJson} from '@/lib/meta-provisioning/admin-request-policy.mjs'
import {finalizeVerifiedMetaAuthorization} from '@/lib/meta-provisioning/meta-authorization-finalize.mjs'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const META_ID=/^[0-9]{5,24}$/
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'}
 const config=getAdminConfig()
 if(!verifyProvisioningPost(request,{origin:config?.origin,maxBytes:6500}))
  return NextResponse.json({ok:false,reason:'not_authorized'},{status:403,headers})
 const operatorId=(await currentPlatformAdmin())?.user?.id
 if(typeof operatorId!=='string'||!/^\d{1,20}$/.test(operatorId))
  return NextResponse.json({ok:false,reason:'not_authorized'},{status:403,headers})
 if(!provisioningEnabled())
  return NextResponse.json({ok:false,reason:'not_enabled'},{status:503,headers})
 try{
  const body=await readBoundedProvisioningJson(request)
  const {organizationId,protocolId}=validateProvisioningBody(body)
  if(!UUID.test(body.sessionId)||typeof body.nonce!=='string'||!/^[-_A-Za-z0-9]{43}$/.test(body.nonce)||
     typeof body.authorizationCode!=='string'||body.authorizationCode.length<12||body.authorizationCode.length>4096||
     !META_ID.test(body.wabaId)||!META_ID.test(body.phoneNumberId))
   return NextResponse.json({ok:false,reason:'invalid_request'},{status:400,headers})
  const store=getProvisioningStore()
  const writer=getCredentialWriter()
  const result=await finalizeVerifiedMetaAuthorization({
   organizationId,protocolId,operatorId,
   sessionId:body.sessionId,nonce:body.nonce,
   authorizationCode:body.authorizationCode,wabaId:body.wabaId,phoneNumberId:body.phoneNumberId,
   store,writer,appId:process.env.META_APP_ID||'1952034255371331',
   appSecret:process.env.META_APP_SECRET||'',
   version:process.env.META_GRAPH_VERSION||'v26.0'
  })
  return NextResponse.json({ok:true,stored:result.stored,
   fingerprint:result.fingerprint,checkedAt:result.checkedAt},
   {headers})
 }catch{
  // OAuth codes can only be used once. Failure must not suggest replay.
  return NextResponse.json({ok:false,reason:'finalization_unverified_new_authorization_may_be_required'},
   {status:409,headers})
 }
}
