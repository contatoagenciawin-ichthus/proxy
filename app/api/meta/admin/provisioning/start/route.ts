import {NextResponse} from 'next/server'
import {currentPlatformAdmin} from '@/lib/meta-admin/auth'
import {getAdminConfig} from '@/lib/meta-admin/policy.mjs'
import {getProvisioningStore,provisioningEnabled,verifyProvisioningInfrastructure} from '@/lib/meta-provisioning/runtime.mjs'
import {verifyProvisioningPost,validateProvisioningBody} from '@/lib/meta-provisioning/admin-request-policy.mjs'
import {expectedAssetsForReceipt} from '@/lib/meta-provisioning/expected-assets.mjs'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'}
 const adminConfig=getAdminConfig()
 if(!verifyProvisioningPost(request,{origin:adminConfig?.origin}))
  return NextResponse.json({ok:false,reason:'not_authorized'},{status:403,headers})
 const session=await currentPlatformAdmin()
 const operatorId=session?.user?.id
 if(typeof operatorId!=='string'||!/^\d{1,20}$/.test(operatorId))
  return NextResponse.json({ok:false,reason:'not_authorized'},{status:403,headers})
 if(!provisioningEnabled())
  return NextResponse.json({ok:false,reason:'not_enabled'},{status:503,headers})
 try{
  const body=await request.json()
  const {organizationId,protocolId}=validateProvisioningBody(body)
  await verifyProvisioningInfrastructure()
  const store=getProvisioningStore()
  await store.beginFromReceipt({organizationId,protocolId,operatorId})
  const expected=expectedAssetsForReceipt(organizationId)
  const issued=await store.issueAuthorization({organizationId,protocolId,operatorId,...expected})
  return NextResponse.json({ok:true,sessionId:issued.sessionId,nonce:issued.nonce,
   expiresAt:issued.expiresAt,
   expectedWabaId:expected.expectedWabaId,expectedPhoneNumberId:expected.expectedPhoneNumberId,
   configurationId:process.env.PROXY_META_COEXISTENCE_CONFIG_ID,
   appId:process.env.META_APP_ID||'1952034255371331'},
   {headers})
 }catch{
  // No database or Meta diagnostic text in browser responses.
  return NextResponse.json({ok:false,reason:'provisioning_unavailable_or_pending'},
   {status:409,headers})
 }
}
