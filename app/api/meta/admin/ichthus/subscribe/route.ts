import {NextResponse} from 'next/server'
import {currentPlatformAdmin} from '@/lib/meta-admin/auth'
import {getAdminConfig} from '@/lib/meta-admin/policy.mjs'
import {verifyProvisioningPost,readBoundedProvisioningJson} from '@/lib/meta-provisioning/admin-request-policy.mjs'
import {getVaultDiagnostic} from '@/lib/meta-provisioning/runtime.mjs'

export const runtime='nodejs'
export const dynamic='force-dynamic'
const org='e9b935b6-3349-4b2c-970d-be8ad3bc243d'
const protocol='6419a70f-854d-4b7f-989a-25beaadabeed'
const waba='107697061976892'
const phone='107612478652254'
const callback='https://app.proxyone.tech/api/meta/ichthus/whatsapp/webhook'
const headers={'Cache-Control':'no-store'}

export async function POST(request:Request){
 const config=getAdminConfig()
 if(!verifyProvisioningPost(request,{origin:config?.origin,maxBytes:1024}))
  return NextResponse.json({status:'blocked',reason:'not_authorized'},{status:403,headers})
 if(!(await currentPlatformAdmin()))
  return NextResponse.json({status:'blocked',reason:'not_authorized'},{status:403,headers})
 if(process.env.VERCEL_ENV!=='production'||process.env.PROXY_ICHTHUS_META_SUBSCRIBE_ENABLED!=='true')
  return NextResponse.json({status:'blocked',reason:'operation_disabled'},{status:503,headers})
 let body:unknown
 try{body=await readBoundedProvisioningJson(request,1024)}
 catch{return NextResponse.json({status:'blocked',reason:'invalid_body'},{status:400,headers})}
 if(!body||typeof body!=='object'||Array.isArray(body)||
    (body as Record<string,unknown>).confirmation!=='subscribe-ichthus-waba-only'||
    (body as Record<string,unknown>).organizationId!==org||
    (body as Record<string,unknown>).protocolId!==protocol)
  return NextResponse.json({status:'blocked',reason:'invalid_scope'},{status:400,headers})
 try{
  const result=await getVaultDiagnostic().subscribeIchthusOverride({
   organizationId:org,protocolId:protocol,wabaId:waba,phoneNumberId:phone,callbackUrl:callback,
   verifyToken:process.env.ICHTHUS_META_WEBHOOK_VERIFY_TOKEN})
  return NextResponse.json(result,{status:result.status==='verified'?200:409,headers})
 }catch{
  return NextResponse.json({status:'blocked',reason:'operation_unavailable'},{status:503,headers})
 }
}
