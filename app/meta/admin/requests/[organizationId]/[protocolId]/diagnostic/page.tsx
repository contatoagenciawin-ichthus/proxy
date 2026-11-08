import Link from 'next/link'
import {notFound,redirect} from 'next/navigation'
import {currentPlatformAdmin} from '@/lib/meta-admin/auth'
import {loadProviderConnectionRequests} from '@/lib/meta-admin/connection-requests-admin.mjs'
import {findAdminRequestDetail} from '@/lib/meta-admin/connection-request-detail.mjs'
import {diagnoseIchthusMeta} from '@/lib/meta-admin/ichthus-meta-diagnostic.mjs'

export const dynamic='force-dynamic'
const ICHTHUS='e9b935b6-3349-4b2c-970d-be8ad3bc243d'
const translations:Record<string,string>={
 verified:'Verificado',not_found:'Não encontrado',mismatch:'Divergente',
 no_access:'Sem autorização',not_configured:'Não configurado',
 inconclusive:'Inconclusivo',blocked:'Não consultado',error:'Erro de consulta'
}
export default async function IchthusDiagnostic({params}:{
 params:Promise<{organizationId:string,protocolId:string}>
}){
 if(!(await currentPlatformAdmin()))redirect('/meta/admin/login')
 const {organizationId,protocolId}=await params
 if(organizationId!==ICHTHUS)notFound()
 const detail=findAdminRequestDetail({inbound:await loadProviderConnectionRequests(),organizationId,protocolId})
 if(detail.state!=='ready')notFound()
 const report=await diagnoseIchthusMeta()
 const labels=[['waba','Identificação da WABA'],['phone','Phone Number ID na WABA'],['subscription','Assinatura do aplicativo Proxy']] as const
 return <main className="pa-workspace" style={{minHeight:'100vh',padding:'32px max(20px,6vw)'}}>
  <Link href={`/meta/admin/requests/${organizationId}/${protocolId}`}>← Voltar ao protocolo</Link>
  <p className="pa-eyebrow" style={{marginTop:28}}>WHATSAPP / DIAGNÓSTICO DETERMINÍSTICO</p>
  <h1>Diagnóstico Meta · Ichthus</h1>
  <p className="pa-lead">Consulta explícita de somente leitura. Nenhuma autorização, assinatura ou configuração será modificada.</p>
  <section className="pa-note">
   <h2>Protocolo {protocolId}</h2>
   <p>Conferido em {new Date(report.checkedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}. Fonte: {report.source}.</p>
   <p>Inventário histórico: WABA 107697061976892, Phone Number ID 107612478652254, aplicativo Proxy 1952034255371331. Esses valores são referências de comparação e não resultados das consultas.</p>
  </section>
  <section className="pa-note" aria-label="Verificações">
   <h2>Verificações técnicas</h2>
   <div style={{display:'grid',gap:16}}>
    {labels.map(([key,label])=><div key={key} style={{borderTop:'1px solid #263341',paddingTop:12}}>
     <strong>{label}</strong>
     <p><span className="pa-badge pa-badge-pending">{translations[report.checks[key].status]||'Não verificado'}</span></p>
     <p>{report.checks[key].detail}</p>
    </div>)}
   </div>
  </section>
  <section className="pa-note"><h2>Limites deste diagnóstico</h2>
   <p>Dados inacessíveis não são considerados ausentes. Uma inscrição encontrada não prova a entrega de eventos. Nenhum resultado desta página libera atendimento ou demonstra coexistência funcional; ainda serão necessários consentimento válido e testes reais de mensagens.</p>
  </section>
 </main>
}
