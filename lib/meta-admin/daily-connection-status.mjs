import 'server-only'
import {getConnectionAdminReader} from './connection-admin-read-pool.mjs'
const ORG='e9b935b6-3349-4b2c-970d-be8ad3bc243d'
const PHONE='107612478652254'
export async function loadDailyConnectionStatus(env=process.env){
 if(env.VERCEL_ENV!=='production'||env.PROXY_REQUEST_ADMIN_READ_ENABLED!=='true')
  return {state:'unavailable',snapshot:null}
 try{
  const reader=getConnectionAdminReader(env)
  const record=await reader.readDailyConnectionCheck(ORG,PHONE)
  if(!record)return {state:'not_checked',snapshot:null}
  const checkedAt=new Date(record.checkedAt).toISOString()
  const age=Date.now()-Date.parse(checkedAt)
  // Last recorded outcome is not a permanent statement of current health.
  return {state:age>=0&&age<=36*3600000?'recent':'stale',
   snapshot:{checkedAt,result:record.result,checks:{
    waba:record.waba,phone:record.phone,subscription:record.subscription,callback:record.callback
   }}}
 }catch{return {state:'unavailable',snapshot:null}}
}
