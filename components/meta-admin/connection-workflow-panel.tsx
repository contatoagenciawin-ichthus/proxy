'use client'
import {useCallback,useEffect,useState} from 'react'

type WorkflowRow={stage:string;version:number;assignedOperatorId:string|null;nextAction:string|null}
type WorkflowEvent={recordedAt:string;action:string;actorId:string;note:string|null}
type WorkflowData={workflow:WorkflowRow|null;events:WorkflowEvent[]}
const stages:[string,string][]=[
 ['received','Recebido'],
 ['under_review','Em análise'],
 ['awaiting_customer','Aguardando cliente'],
 ['authorization_pending','Autorização pendente'],
 ['technical_validation','Validação técnica'],
 ['operational_validation','Validação operacional'],
 ['suspended','Suspenso'],
 ['cancelled','Cancelado']
]
const allowed:Record<string,string[]>={
 received:['under_review','cancelled'],
 under_review:['awaiting_customer','authorization_pending','suspended','cancelled'],
 awaiting_customer:['under_review','authorization_pending','cancelled'],
 authorization_pending:['under_review','technical_validation','suspended','cancelled'],
 technical_validation:['authorization_pending','operational_validation','suspended'],
 operational_validation:['technical_validation','suspended'],
 suspended:['under_review','cancelled'],
 cancelled:[]
}
export default function ConnectionWorkflowPanel({organizationId,protocolId}:{organizationId:string;protocolId:string}){
 const [data,setData]=useState<WorkflowData|null>(null)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const [note,setNote]=useState('')
 const [operatorId,setOperatorId]=useState('')
 const [nextAction,setNextAction]=useState('')
 const [targetStage,setTargetStage]=useState('')
 const url=`/api/meta/admin/requests/workflow/${organizationId}/${protocolId}`
 const refresh=useCallback(async()=>{
  const response=await fetch(url,{cache:'no-store',credentials:'same-origin'})
  const payload=await response.json()
  if(!response.ok)throw Error('Não foi possível consultar o andamento deste protocolo.')
  setData(payload.data)
 },[url])
 useEffect(()=>{refresh().catch(e=>setError(e.message))},[refresh])
 async function update(action:string,payload:Record<string,string>){
  if(!data||busy)return
  setBusy(true);setError('')
  try{
   const response=await fetch(url,{method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({organizationId,protocolId,
     expectedVersion:data.workflow?.version??1,action,payload})})
   const result=await response.json()
   if(!response.ok)throw Error(response.status===409?
    'O protocolo foi atualizado por outro operador. Atualize a página e tente novamente.':
    'Não foi possível registrar a alteração.')
   await refresh()
   setNote('');setOperatorId('');setNextAction('');setTargetStage('')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar a alteração.')}finally{setBusy(false)}
 }
 const workflow=data?.workflow
 const current=workflow?.stage||'received'
 const options=(allowed[current]||[]).map(s=>stages.find(x=>x[0]===s)).filter((x):x is [string,string]=>Boolean(x))
 return <section className="pa-note" aria-label="Acompanhamento administrativo" style={{marginTop:24}}>
  <h2>Acompanhamento administrativo</h2>
  <p>Registros operacionais supervisionados. Nenhuma alteração abaixo conecta, desativa ou autoriza um número na Meta.</p>
  {error&&<p role="alert">{error}</p>}
  {!data&&!error&&<p>Consultando andamento…</p>}
  {data&&<>
   <p><strong>Etapa:</strong> {stages.find(x=>x[0]===current)?.[1]||current}</p>
   <p><strong>Responsável (ID GitHub):</strong> {workflow?.assignedOperatorId||'Não atribuído'}</p>
   <p><strong>Próxima providência:</strong> {workflow?.nextAction||'Não informada'}</p>
   {!workflow&&<p>Este protocolo ainda não possui atualização administrativa. A primeira ação iniciará seu histórico.</p>}
   <div style={{display:'grid',gap:14,maxWidth:640}}>
    <div>
     <label htmlFor="proxy-operator-id">Atribuir operador (ID GitHub numérico)</label>
     <div style={{display:'flex',gap:8,marginTop:6}}>
      <input id="proxy-operator-id" value={operatorId} onChange={e=>setOperatorId(e.target.value)} inputMode="numeric" maxLength={32} style={{flex:1,minWidth:0}}/>
      <button disabled={busy||!/^\d{1,32}$/.test(operatorId)} onClick={()=>update('assign',{operatorId})}>Atribuir</button>
     </div>
    </div>
    <div>
     <label htmlFor="proxy-next-action">Próxima providência</label>
     <textarea id="proxy-next-action" value={nextAction} onChange={e=>setNextAction(e.target.value)} maxLength={1000} rows={2} style={{display:'block',width:'100%',marginTop:6}}/>
     <button disabled={busy||!nextAction.trim()} onClick={()=>update('next_action',{text:nextAction})}>Salvar providência</button>
    </div>
    <div>
     <label htmlFor="proxy-stage">Alterar etapa</label>
     <select id="proxy-stage" value={targetStage} onChange={e=>setTargetStage(e.target.value)} style={{display:'block',marginTop:6}}>
      <option value="">Selecione uma transição permitida</option>
      {options.map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </select>
     <button disabled={busy||!targetStage} onClick={()=>update('stage_change',{stage:targetStage})}>Registrar etapa</button>
    </div>
    <div>
     <label htmlFor="proxy-note">Observação para auditoria</label>
     <textarea id="proxy-note" value={note} onChange={e=>setNote(e.target.value)} maxLength={1000} rows={3} style={{display:'block',width:'100%',marginTop:6}}/>
     <button disabled={busy||!note.trim()} onClick={()=>update('note',{text:note})}>Registrar observação</button>
    </div>
   </div>
   <h3>Histórico de alterações</h3>
   {data.events.length===0?<p>Nenhum evento administrativo registrado.</p>:
    <ol>{data.events.map((e,i)=><li key={i}>
     {new Date(e.recordedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}
     {' · '}{e.action} · operador {e.actorId}{e.note?` · ${e.note}`:''}
    </li>)}</ol>}
  </>}
 </section>
}
