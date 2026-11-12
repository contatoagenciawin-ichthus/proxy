import {timingSafeEqual} from 'node:crypto'
import {getConnectionAdminReader} from '@/lib/meta-admin/connection-admin-read-pool.mjs'
import {getVaultDiagnostic,getProvisioningStore} from '@/lib/meta-provisioning/runtime.mjs'
import {authorizedDailyCheck,executeDailyCheck} from '@/lib/meta-admin/daily-connection-check.mjs'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(request:Request){
 if(process.env.VERCEL_ENV!=='production'||!authorizedDailyCheck(request,process.env.CRON_SECRET))
  return Response.json({ok:false,error:'unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}})
 try{
  const reader=getConnectionAdminReader()
  const writer=getProvisioningStore()
  const diagnostic=getVaultDiagnostic()
  const result=await executeDailyCheck({
   readPrevious:(org:string,phone:string)=>reader.readDailyConnectionCheck(org,phone),
   diagnose:(params:any)=>diagnostic.check(params),
   persist:(params:any)=>writer.writeDailyConnectionCheck(params)
  })
  return Response.json({ok:true,...result},{headers:{'Cache-Control':'no-store'}})
 }catch{
  return Response.json({ok:false,error:'check_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})
 }
}
