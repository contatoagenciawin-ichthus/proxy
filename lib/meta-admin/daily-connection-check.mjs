import {timingSafeEqual} from 'node:crypto'
const ORG='e9b935b6-3349-4b2c-970d-be8ad3bc243d'
const PROTOCOL='6419a70f-854d-4b7f-989a-25beaadabeed'
const WABA='107697061976892'
const PHONE='107612478652254'
const STATUS=['verified','no_access','not_found','inconclusive','error','blocked']
const neutral='inconclusive'
export function authorizedDailyCheck(request,secret){
 if(typeof secret!=='string'||secret.length<32||request.method!=='GET')return false
 const provided=request.headers.get('authorization')||''
 const expected='Bearer '+secret
 const a=Buffer.from(provided),b=Buffer.from(expected)
 return a.length===b.length&&timingSafeEqual(a,b)
}
export function summarizeMetaCheck(result){
 const c=result?.checks||{}
 const checks=Object.fromEntries(['waba','phone','subscription','callback'].map(k=>[
  k,STATUS.includes(c[k]?.status)?c[k].status:neutral
 ]))
 const essential=['waba','phone','subscription'].map(k=>checks[k])
 const resultStatus=essential.some(x=>x==='not_found'||x==='no_access')?'attention':
  essential.every(x=>x==='verified')&&checks.callback==='verified'?'confirmed':'inconclusive'
 return {result:resultStatus,checks}
}
export async function executeDailyCheck({
 now=new Date(),readPrevious,diagnose,persist
}={}){
 if(typeof readPrevious!=='function'||typeof diagnose!=='function'||typeof persist!=='function')
  throw Error('daily_check_not_configured')
 const previous=await readPrevious(ORG,PHONE)
 const at=new Date(now).toISOString()
 if(previous?.checkedAt&&new Date(previous.checkedAt).toISOString().slice(0,10)===at.slice(0,10))
  return {status:'already_checked',checkedAt:previous.checkedAt}
 let snapshot
 try{
  const r=await diagnose({organizationId:ORG,protocolId:PROTOCOL,wabaId:WABA,phoneNumberId:PHONE})
  snapshot=summarizeMetaCheck(r)
 }catch{snapshot=summarizeMetaCheck(null)}
 await persist({organizationId:ORG,phoneNumberId:PHONE,checkedAt:at,...snapshot})
 return {status:'recorded',checkedAt:at,result:snapshot.result}
}
