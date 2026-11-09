'use client'
import {useEffect,useRef,useState} from 'react'

type FacebookLoginResponse={authResponse?:{code?:string},status?:string}
type FacebookSdk={init:(x:Record<string,unknown>)=>void,
 login:(callback:(x:FacebookLoginResponse)=>void,options:Record<string,unknown>)=>void}
type FacebookWindow=Window & {FB?:FacebookSdk,fbAsyncInit?:()=>void}
type Permit={sessionId:string,nonce:string,expiresAt:string,appId:string,
 configurationId:string,expectedWabaId:string|null,expectedPhoneNumberId:string|null}
type MetaAsset={wabaId:string,phoneNumberId:string}
type SignupMessage={type?:string,event?:string,data?:Record<string,unknown>}
type WorkflowState='initial'|'preparing'|'prepared'|'authorizing'|'exchanging'|'stored'|'failed'
const ID=/^[0-9]{5,24}$/
function facebookOrigin(origin:string){
 try{const hostname=new URL(origin).hostname
  return hostname==='facebook.com'||hostname.endsWith('.facebook.com')
 }catch{return false}
}
function safeId(x:unknown){return typeof x==='string'&&ID.test(x)?x:''}

export default function OnboardingClient({organizationId,protocolId}:{
 organizationId:string,protocolId:string
}){
 const [sdkReady,setSdkReady]=useState(false)
 const [phase,setPhase]=useState<WorkflowState>('initial')
 const [notice,setNotice]=useState('Prepare uma autorização exclusiva para esta solicitação.')
 const [assets,setAssets]=useState<MetaAsset|null>(null)
 const [fingerprint,setFingerprint]=useState('')
 const permitRef=useRef<Permit|null>(null)
 const codeRef=useRef('')
 const assetRef=useRef<MetaAsset|null>(null)
 const completingRef=useRef(false)

 async function finalizeIfReady(){
  const permit=permitRef.current,code=codeRef.current
  const asset=assetRef.current||(permit?.expectedWabaId&&permit?.expectedPhoneNumberId?
   {wabaId:permit.expectedWabaId,phoneNumberId:permit.expectedPhoneNumberId}:null)
  if(!permit||!asset||!code||completingRef.current)return
  if(Date.now()>=new Date(permit.expiresAt).getTime()){
   codeRef.current=''
   setNotice('Sessão expirada. Não é possível utilizar este código novamente.')
   setPhase('failed');return
  }
  if((permit.expectedWabaId&&permit.expectedWabaId!==asset.wabaId)||
     (permit.expectedPhoneNumberId&&permit.expectedPhoneNumberId!==asset.phoneNumberId)){
   codeRef.current=''
   setNotice('Ativos diferentes dos associados ao protocolo. A credencial não foi encaminhada.')
   setPhase('failed');return
  }
  completingRef.current=true
  setPhase('exchanging')
  setNotice('Conferindo a Meta e armazenando a credencial de forma protegida...')
  try{
   const r=await fetch('/api/meta/admin/provisioning/finalize',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({organizationId,protocolId,
     sessionId:permit.sessionId,nonce:permit.nonce,authorizationCode:code,
     wabaId:asset.wabaId,phoneNumberId:asset.phoneNumberId})
   })
   const body=await r.json()
   if(!r.ok||body.ok!==true||body.stored!==true)
    throw new Error('storage_unverified')
   setFingerprint(String(body.fingerprint||''))
   setPhase('stored')
   setNotice('Credencial validada e armazenada na Proxy. O atendimento ainda depende dos testes de canal.')
  }catch{
   setPhase('failed')
   setNotice('Não foi possível confirmar o armazenamento. Não reutilize o código nem repita a autorização sem revisar o protocolo.')
  }finally{
   codeRef.current=''
   permitRef.current=null
  }
 }
 useEffect(()=>{
  let mounted=true
  const w=window as FacebookWindow
  function init(){
   if(!mounted||!w.FB)return
   w.FB.init({appId:'1952034255371331',cookie:true,autoLogAppEvents:false,
    xfbml:false,version:'v26.0'})
   setSdkReady(true)
  }
  function receive(event:MessageEvent){
   if(!facebookOrigin(event.origin))return
   let payload:SignupMessage
   try{payload=typeof event.data==='string'?JSON.parse(event.data):event.data}catch{return}
   if(payload?.type!=='WA_EMBEDDED_SIGNUP')return
   if(!['FINISH','FINISH_ONLY_WABA','FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'].includes(payload.event||''))return
   const d=payload.data&&typeof payload.data==='object'?payload.data:{}
   const wabaId=safeId(d.waba_id)||safeId(d.wabaId)
   const phoneNumberId=safeId(d.phone_number_id)||safeId(d.phoneNumberId)||
    (permitRef.current?.expectedPhoneNumberId||'')
   if(!wabaId||!phoneNumberId)return
   const asset={wabaId,phoneNumberId}
   assetRef.current=asset
   setAssets(asset)
   void finalizeIfReady()
  }
  window.addEventListener('message',receive)
  if(w.FB)init()
  else{
   w.fbAsyncInit=init
   if(!document.getElementById('facebook-jssdk')){
    const script=document.createElement('script')
    script.id='facebook-jssdk'
    script.async=true
    script.src='https://connect.facebook.net/pt_BR/sdk.js'
    script.crossOrigin='anonymous'
    document.body.appendChild(script)
   }
  }
  return()=>{mounted=false;window.removeEventListener('message',receive)}
 // Keeping the Meta session in refs avoids persisting OAuth codes or nonces.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[])
 async function prepare(){
  if(phase!=='initial')return
  setPhase('preparing')
  setNotice('Validando o protocolo, as permissões do operador e o cofre...')
  try{
   const r=await fetch('/api/meta/admin/provisioning/start',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({organizationId,protocolId})
   })
   const p=await r.json() as Permit & {ok?:boolean}
   if(!r.ok||p.ok!==true||!p.nonce||!p.sessionId||!p.configurationId)
    throw new Error('not_available')
   permitRef.current=p
   setPhase('prepared')
   setNotice('Sessão preparada. Abra a autorização Meta abaixo antes de sua expiração.')
  }catch{
   setPhase('failed')
   setNotice('Provisionamento ainda indisponível ou sessão pendente. Nenhuma autorização Meta foi iniciada.')
  }
 }
 function authorize(){
  const p=permitRef.current
  const fb=(window as FacebookWindow).FB
  if(!p||!fb||phase!=='prepared')return
  if(Date.now()>=new Date(p.expiresAt).getTime()){
   setPhase('failed');setNotice('A sessão expirou antes da autorização.');return
  }
  setPhase('authorizing')
  setNotice('Conclua o processo na janela oficial da Meta. Não feche esta página.')
  fb.login(response=>{
   const code=response.authResponse?.code?.trim()||''
   if(code){
    codeRef.current=code
    setNotice('Autorização recebida. Validando ativos e acesso pela Meta antes de armazenar...')
    void finalizeIfReady()
   }else{
    setPhase('failed')
    setNotice('A autorização não foi concluída. Nenhuma credencial foi gravada.')
   }
  },{
   config_id:p.configurationId,response_type:'code',
   override_default_response_type:true,
   extras:{setup:{},featureType:'whatsapp_business_app_onboarding'}
  })
 }
 return <section className="pa-note" aria-label="Autorização supervisionada">
  <h2>Conectar WhatsApp pelo protocolo</h2>
  <p>{notice}</p>
  <p>Etapa: <strong>{phase==='stored'?'Credencial armazenada':phase==='failed'?'Interrompida':
   phase==='authorizing'?'Autorização Meta':phase==='exchanging'?'Validação técnica':
   phase==='prepared'?'Preparada':phase==='preparing'?'Preparando':'Não iniciada'}</strong></p>
  {phase==='initial'&&<button type="button" onClick={()=>void prepare()} className="pa-primary">
   Preparar autorização</button>}
  {phase==='prepared'&&<button type="button" disabled={!sdkReady}
   onClick={authorize} className="pa-primary">Autorizar na Meta</button>}
  {phase==='prepared'&&!sdkReady&&<p>Carregando o SDK oficial da Meta...</p>}
  {assets&&<dl><dt>WABA retornada</dt><dd><code>{assets.wabaId}</code></dd>
   <dt>Número retornado</dt><dd><code>{assets.phoneNumberId}</code></dd></dl>}
  {fingerprint&&<p>Referência técnica da credencial: <code>{fingerprint}</code></p>}
  <p>Este processo não ativa atendimento, IA, callbacks ou webhook automaticamente. Em caso de erro,
   retorne ao protocolo e revise o diagnóstico antes de iniciar outra autorização.</p>
 </section>
}
