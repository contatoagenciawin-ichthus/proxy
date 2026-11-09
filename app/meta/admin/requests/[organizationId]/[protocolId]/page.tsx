import Link from 'next/link'
import {redirect,notFound} from 'next/navigation'
import {currentPlatformAdmin} from '@/lib/meta-admin/auth'
import {loadProviderConnectionRequests} from '@/lib/meta-admin/connection-requests-admin.mjs'
import {findAdminRequestDetail} from '@/lib/meta-admin/connection-request-detail.mjs'

export const dynamic='force-dynamic'
export default async function RequestDetail({params}:{
 params:Promise<{organizationId:string,protocolId:string}>
}){
 if(!(await currentPlatformAdmin()))redirect('/meta/admin/login')
 const {organizationId,protocolId}=await params
 const detail=findAdminRequestDetail({inbound:await loadProviderConnectionRequests(),organizationId,protocolId})
 if(detail.state==='invalid'||detail.state==='not_found')notFound()
 const row=detail.state==='ready'?detail.request:null
 return <main className="pa-workspace" style={{minHeight:'100vh',padding:'32px max(20px,6vw)'}}>
   <Link href="/meta/admin">← Voltar à administração</Link>
   <p className="pa-eyebrow" style={{marginTop:30}}>WHATSAPP / SOLICITAÇÕES</p>
   <h1>Ficha de solicitação</h1>
   <p className="pa-lead">Consulta administrativa de um recibo persistido. Não representa número conectado ou autorização Meta.</p>
   {!row?<p role="alert">{detail.state==='disabled'?'Recepção de solicitações desativada neste ambiente.':'Fila indisponível. Não é possível confirmar o estado deste protocolo.'}</p>:
   <section className="pa-note" aria-label="Dados do protocolo">
     <h2>Protocolo recebido</h2>
     <dl style={{display:'grid',gridTemplateColumns:'minmax(150px,240px) 1fr',gap:'14px 20px',overflowWrap:'anywhere'}}>
       <dt>Protocolo</dt><dd><code>{row.protocolId}</code></dd>
       <dt>Organização</dt><dd><code>{row.organizationId}</code></dd>
       <dt>Produto de origem</dt><dd>{row.product}</dd>
       <dt>Canal solicitado</dt><dd>{row.channel}</dd>
       <dt>Estado comprovado</dt><dd>{row.status==='received_by_proxy'?'Recebido pela Proxy':row.status}</dd>
       <dt>Data do recibo</dt><dd>{row.receivedAt?new Date(row.receivedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Não informada'}</dd>
     </dl>
     <p>Responsável, pendências, Business Portfolio, WABA, Phone Number ID e testes operacionais: ainda não registrados neste protocolo.</p>
     <p>O protocolo foi recebido pela Proxy. A autorização da Meta e o provisionamento do número permanecem como etapas posteriores do onboarding assistido.</p>
     {process.env.PROXY_PROVISIONING_ENABLED==='true'&&<p><Link href={`/meta/admin/requests/${row.organizationId}/${row.protocolId}/onboarding`}>Abrir onboarding assistido vinculado ao protocolo</Link></p>}
   </section>}
 </main>
}
