import {openMetaCredential} from './credential-envelope.mjs'

// A deliberately non-exporting credential reader. Only this server module sees the
// plaintext token; callers receive sanitized Graph diagnostic outcomes, not tokens.
// No shared webhook callback or per-tenant Vercel secrets.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const META_ID=/^[0-9]{5,24}$/
const ROLE='proxy_credential_reader_login'
const MAX_ITEMS=100
const outcome=(status,detail)=>({status,detail})
const blocked=detail=>({waba:outcome('blocked',detail),phone:outcome('blocked',detail),subscription:outcome('blocked',detail),callback:outcome('blocked',detail)})

async function requestGraph(fetchFn,version,token,path){
 try{
  const response=await fetchFn('https://graph.facebook.com/'+version+'/'+path,{
   method:'GET',cache:'no-store',redirect:'error',
   headers:{Authorization:'Bearer '+token,Accept:'application/json'},
   signal:AbortSignal.timeout(7000)
  })
  const data=await response.json().catch(()=>null)
  if(!response.ok||data?.error){
   const code=Number(data?.error?.code||0)
   const status=response.status===401||code===190?'no_access':
    response.status===403||code===10||code===200?'no_access':'inconclusive'
   return {ok:false,reason:outcome(status,'A Meta não autorizou ou não concluiu esta consulta.')}
  }
  return data&&typeof data==='object'?{ok:true,data}:{ok:false,reason:outcome('inconclusive','Resposta Meta inválida.')}
 }catch{return {ok:false,reason:outcome('error','A consulta Meta não pôde ser concluída.')}}
}
function completeList(result){
 if(!Array.isArray(result?.data)||result.paging?.next||result.data.length>=MAX_ITEMS)
  return null
 return result.data
}

export function createVaultDiagnostic({pool,rootKeyHex,appId,fetchFn=fetch,graphVersion='v26.0'}={}){
 if(typeof pool?.connect!=='function')throw TypeError('reader_pool_required')
 if(typeof appId!=='string'||!META_ID.test(appId)||!/^v\d{1,2}\.\d{1,2}$/.test(graphVersion))
  throw Error('reader_config_invalid')
 return Object.freeze({
  async check({organizationId,protocolId,wabaId,phoneNumberId}={}){
   if(![organizationId,protocolId].every(x=>typeof x==='string'&&UUID.test(x))||
      ![wabaId,phoneNumberId].every(x=>typeof x==='string'&&META_ID.test(x)))
    throw Error('reader_identity_invalid')
   const db=await pool.connect()
   let tx=false,token
   try{
    const roles=await db.query("select current_user as name,rolcanlogin,rolsuper,rolbypassrls,rolcreaterole,rolcreatedb from pg_roles where rolname=current_user")
    const role=roles.rows?.[0]
    if(roles.rows?.length!==1||role.name!==ROLE||role.rolcanlogin!==true||
       role.rolsuper!==false||role.rolbypassrls!==false||
       role.rolcreaterole!==false||role.rolcreatedb!==false)
      throw Error('reader_unsafe_role')
    const privileges=await db.query(`select
     has_table_privilege(current_user,'proxy_control.whatsapp_credential_envelopes','SELECT') as vault_select,
     has_table_privilege(current_user,'proxy_control.whatsapp_credential_envelopes','INSERT') as vault_insert,
     has_table_privilege(current_user,'proxy_control.whatsapp_credential_envelopes','UPDATE') as vault_update,
     has_table_privilege(current_user,'proxy_control.whatsapp_credential_envelopes','DELETE') as vault_delete,
     has_table_privilege(current_user,'proxy_control.whatsapp_provisioning','SELECT') as provision_select,
     has_table_privilege(current_user,'proxy_control.whatsapp_provisioning','UPDATE') as provision_update`)
    const p=privileges.rows?.[0]
    if(privileges.rows?.length!==1||p.vault_select!==true||p.provision_select!==true||
       p.vault_insert!==false||p.vault_update!==false||p.vault_delete!==false||p.provision_update!==false)
      throw Error('reader_unsafe_grants')
    await db.query('begin read only')
    tx=true
    await db.query("select set_config('app.organization_id',$1,true)",[organizationId])
    const rows=await db.query(`select p.organization_id,p.protocol_id,p.waba_id,p.phone_number_id,p.meta_app_id,
      e.envelope_version,e.key_version,e.iv,e.ciphertext,e.tag,e.expires_at
      from proxy_control.whatsapp_provisioning p
      join proxy_control.whatsapp_credential_envelopes e
       on e.provisioning_id=p.id and e.organization_id=p.organization_id
      where p.organization_id=$1 and p.protocol_id=$2
       and p.waba_id=$3 and p.phone_number_id=$4 and p.meta_app_id=$5
       and p.product='proxy-relationship'
       and p.phase in ('credential_secured','diagnosing','ready_for_validation','active')
      limit 2`,[organizationId,protocolId,wabaId,phoneNumberId,appId])
    if(rows.rows?.length!==1)throw Error('reader_credential_not_available')
    const v=rows.rows[0]
    if(Number(v.key_version)!==1 || (v.expires_at&&Date.parse(v.expires_at)<=Date.now()))
      throw Error('reader_credential_expired_or_unknown_key')
    token=openMetaCredential({identity:{organizationId,protocolId,wabaId,phoneNumberId,appId},
     envelope:{envelopeVersion:Number(v.envelope_version),iv:v.iv,ciphertext:v.ciphertext,tag:v.tag},rootKeyHex})
    await db.query('commit')
    tx=false
   }catch(e){
    if(tx)await db.query('rollback').catch(()=>{})
    throw Error('reader_not_available')
   }finally{db.release()}

   const version=graphVersion
   const waba=await requestGraph(fetchFn,version,token,wabaId+'?fields=id,name')
   if(!waba.ok)return {checkedAt:new Date().toISOString(),checks:{...blocked('WABA não confirmada.'),waba:waba.reason||outcome('inconclusive','WABA não confirmada.')}}
   if(String(waba.data.id)!==wabaId)return {checkedAt:new Date().toISOString(),checks:blocked('WABA divergente.')}
   const checks={...blocked('Aguardando consulta.'),waba:outcome('verified','WABA confirmada pela Graph API.')}
   const [phone,subscriptions]=await Promise.all([
    requestGraph(fetchFn,version,token,wabaId+'/phone_numbers?fields=id,platform_type&limit='+MAX_ITEMS),
    requestGraph(fetchFn,version,token,wabaId+'/subscribed_apps?limit='+MAX_ITEMS)
   ])
   if(!phone.ok)checks.phone=phone.reason
   else{
    const list=completeList(phone.data)
    checks.phone=!list?outcome('inconclusive','Lista de números incompleta.'):
     list.some(x=>String(x.id)===phoneNumberId)?
      outcome('verified','Número pertence à WABA.'):outcome('not_found','Número não consta na lista completa.')
   }
   if(!subscriptions.ok){checks.subscription=subscriptions.reason;checks.callback=subscriptions.reason}
   else{
    const list=completeList(subscriptions.data)
    if(!list){checks.subscription=outcome('inconclusive','Assinaturas incompletas.');checks.callback=outcome('inconclusive','Callback não verificado.')}
    else{
     const found=list.find(x=>String(x.id||x.app?.id||x.application?.id)===appId)
     checks.subscription=found?outcome('verified','Aplicativo Proxy inscrito na WABA.'):
      outcome('not_found','Aplicativo Proxy não consta na lista completa.')
     // The API may omit override info; never mistake omission for a global callback.
     const callback=found?.override_callback_uri||found?.override_callback?.url||null
     checks.callback=!found?outcome('blocked','Sem inscrição confirmada.'):
      typeof callback==='string'&&callback.startsWith('https://')?
       outcome('verified',callback):outcome('inconclusive','A Graph API não confirmou callback específico para esta WABA.')
    }
   }
   return {checkedAt:new Date().toISOString(),checks}
  }
 })
}
