'use client'
import {useState} from 'react'
type Result={status?:string;reason?:string}
const ORG='e9b935b6-3349-4b2c-970d-be8ad3bc243d'
const PROTOCOL='6419a70f-854d-4b7f-989a-25beaadabeed'
export default function SubscribeIchthus(){
 const [confirmed,setConfirmed]=useState(false)
 const [pending,setPending]=useState(false)
 const [result,setResult]=useState<Result|null>(null)
 async function submit(){
  if(!confirmed||pending)return
  setPending(true)
  try{
   const response=await fetch('/api/meta/admin/ichthus/subscribe',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({confirmation:'subscribe-ichthus-waba-only',organizationId:ORG,protocolId:PROTOCOL})
   })
   const payload=await response.json().catch(()=>null)
   setResult({status:payload?.status||'blocked',reason:payload?.reason||'Operação não concluída.'})
  }catch{setResult({status:'inconclusive',reason:'Falha de rede. Reabra o diagnóstico antes de tentar novamente.'})}
  finally{setPending(false)}
 }
 return <section className="pa-note" aria-label="Inscrição específica da Ichthus">
  <h2>Inscrição exclusiva da WABA da Ichthus</h2>
  <p>Esta ação tenta configurar somente a WABA 107697061976892 com o endpoint dedicado da Proxy. O callback global do Eduardo Brasil e a operação da LA não serão alterados.</p>
  <p>Se a Meta exigir inscrição prévia sem callback exclusivo, a operação será interrompida. Não será enviada inscrição genérica.</p>
  <label style={{display:'block',marginBottom:14}}>
   <input type="checkbox" checked={confirmed} disabled={pending} onChange={e=>setConfirmed(e.target.checked)}/>
   {' '}Confirmo a alteração exclusivamente na WABA da Ichthus.
  </label>
  <button type="button" disabled={!confirmed||pending||result?.status==='verified'}
   onClick={submit} className="pa-button">
   {pending?'Consultando Meta...':'Inscrever WABA com callback exclusivo'}
  </button>
  {result&&<div role="status" aria-live="polite" style={{marginTop:16}}>
   <strong>{result.status==='verified'?'Inscrição confirmada':result.status==='inconclusive'?'Resultado inconclusivo':'Operação não concluída'}</strong>
   <p>{result.reason}</p>
   <p>Reabra o diagnóstico para conferir a leitura atual da Graph API.</p>
  </div>}
 </section>
}
