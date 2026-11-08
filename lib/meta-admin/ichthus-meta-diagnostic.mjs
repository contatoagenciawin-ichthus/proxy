// Deterministic read-only Meta Graph diagnostic for the first authorized tenant.
// Does not initiate Embedded Signup, write Graph state, or ingest message bodies.
const ID=/^[0-9]{5,24}$/
const GRAPH_VERSION=/^v[0-9]{1,2}\.[0-9]{1,2}$/
const MAX_ITEMS=100

const outcome=(status,detail)=>({status,detail})
function graphError(httpStatus,payload){
 const code=Number(payload?.error?.code||0)
 if(httpStatus===401||code===190)return outcome('no_access','Credencial recusada ou expirada pela Meta.')
 if(httpStatus===403||code===10||code===200)return outcome('no_access','A credencial não possui autorização suficiente para esta consulta.')
 if(httpStatus===400||httpStatus===404||code===100)return outcome('inconclusive','A Meta não disponibilizou este recurso para a credencial. Não é possível afirmar que o ativo não existe.')
 return outcome('error','Falha na consulta Meta; nova verificação é necessária.')
}
async function graphGet({fetchFn,version,token,path}){
 try{
  const url=new URL('https://graph.facebook.com/'+version+'/'+path)
  const response=await fetchFn(url.toString(),{
   method:'GET',cache:'no-store',redirect:'error',
   headers:{Authorization:'Bearer '+token,Accept:'application/json'},
   signal:AbortSignal.timeout(7000)
  })
  const body=await response.json().catch(()=>null)
  if(!response.ok||body?.error)return {ok:false,reason:graphError(response.status,body)}
  if(!body||typeof body!=='object')return {ok:false,reason:outcome('error','Resposta Meta inválida.')}
  return {ok:true,body}
 }catch{return {ok:false,reason:outcome('error','Consulta indisponível ou tempo esgotado.')}}
}
function listResult(response){
 if(!Array.isArray(response?.data))return {ok:false,reason:outcome('inconclusive','Lista não retornada pela Meta.')}
 if(response.paging?.next||response.data.length>=MAX_ITEMS)
  return {ok:false,reason:outcome('inconclusive','Lista paginada ou incompleta. Nenhuma ausência foi presumida.')}
 return {ok:true,rows:response.data}
}
export async function diagnoseIchthusMeta({env=process.env,fetchFn=fetch,now=()=>new Date()}={}){
 const checkedAt=now().toISOString()
 const base={checkedAt,source:'Meta Graph API',mutations:false}
 const notConfigured=detail=>({...base,checks:{
  waba:outcome('not_configured',detail),
  phone:outcome('not_configured',detail),
  subscription:outcome('not_configured',detail)}})
 if(env.PROXY_ICHTHUS_META_DIAGNOSTIC_ENABLED!=='true')
  return notConfigured('Diagnóstico não habilitado para o protocolo.')
 const token=env.PROXY_ICHTHUS_META_DIAGNOSTIC_TOKEN
 const version=env.PROXY_ICHTHUS_META_GRAPH_VERSION||'v26.0'
 const wabaId='107697061976892'
 const phoneId='107612478652254'
 const expectedAppId='1952034255371331'
 if(typeof token!=='string'||token.length<25||!GRAPH_VERSION.test(version))
  return notConfigured('Credencial de diagnóstico ou versão Graph não configurada.')
 const waba=await graphGet({fetchFn,version,token,path:wabaId+'?fields=id,name'})
 if(!waba.ok)return {...base,checks:{waba:waba.reason,phone:outcome('blocked','É necessário acesso à WABA.'),subscription:outcome('blocked','É necessário acesso à WABA.')}}
 if(String(waba.body.id)!==wabaId)return {...base,checks:{waba:outcome('mismatch','A WABA retornada difere do inventário.'),phone:outcome('blocked','Identidade da WABA divergente.'),subscription:outcome('blocked','Identidade da WABA divergente.')}}
 const checks={waba:outcome('verified','WABA identificada pela Meta para a credencial autorizada.'),phone:outcome('inconclusive','Não consultado.'),subscription:outcome('inconclusive','Não consultado.')}
 const [phones,subscriptions]=await Promise.all([
  graphGet({fetchFn,version,token,path:wabaId+'/phone_numbers?fields=id,display_phone_number,verified_name,platform_type&limit='+MAX_ITEMS}),
  graphGet({fetchFn,version,token,path:wabaId+'/subscribed_apps?limit='+MAX_ITEMS})
 ])
 if(!phones.ok)checks.phone=phones.reason
 else{
  const rows=listResult(phones.body)
  if(!rows.ok)checks.phone=rows.reason
  else{
   const matching=rows.rows.find(x=>String(x?.id)===phoneId)
   checks.phone=matching?outcome('verified','Phone Number ID encontrado na WABA autorizada.'):outcome('not_found','Phone Number ID não consta na lista completa acessível desta WABA.')
  }
 }
 if(!subscriptions.ok)checks.subscription=subscriptions.reason
 else{
  const rows=listResult(subscriptions.body)
  if(!rows.ok)checks.subscription=rows.reason
  else{
   const matching=rows.rows.some(x=>String(x?.id||x?.app?.id||x?.application?.id)===expectedAppId)
   checks.subscription=matching?outcome('verified','O aplicativo Proxy consta nas inscrições consultadas da WABA.'):outcome('not_found','O aplicativo Proxy não consta na lista completa de inscrições retornadas pela Meta.')
  }
 }
 return {...base,checks}
}
