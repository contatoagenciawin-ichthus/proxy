import Link from 'next/link'
import {notFound,redirect} from 'next/navigation'
import {currentPlatformAdmin} from '@/lib/meta-admin/auth'
import {loadProviderConnectionRequests} from '@/lib/meta-admin/connection-requests-admin.mjs'
import {findAdminRequestDetail} from '@/lib/meta-admin/connection-request-detail.mjs'
import {getVaultDiagnostic} from '@/lib/meta-provisioning/runtime.mjs'

export const dynamic='force-dynamic'
const ICHTHUS_ORG='e9b935b6-3349-4b2c-970d-be8ad3bc243d'
const ICHTHUS_WABA='107697061976892'
const ICHTHUS_PHONE='107612478652254'
const labels=[['waba','WABA'],['phone','Número WhatsApp'],['subscription','Aplicativo inscrito'],['callback','Callback exclusivo da WABA'],['phoneOverride','Callback específico do número (prioritário)']] as const
const statuses:Record<string,string>={verified:'Verificado',not_found:'Não encontrado',inconclusive:'Inconclusivo',blocked:'Bloqueado',error:'Erro',no_access:'Sem acesso'}

export default async function IchthusDiagnostic({params}:{params:Promise<{organizationId:string,protocolId:string}>}){
 if(!(await currentPlatformAdmin()))redirect('/meta/admin/login')
 const {organizationId,protocolId}=await params
 if(organizationId!==ICHTHUS_ORG)notFound()
 const detail=findAdminRequestDetail({inbound:await loadProviderConnectionRequests(),organizationId,protocolId})
 if(detail.state!=='ready')notFound()
 let report:{checkedAt:string;checks:Record<string,{status:string;detail:string}>}|null=null
 try {
  report=await getVaultDiagnostic().check({organizationId,protocolId,wabaId:ICHTHUS_WABA,phoneNumberId:ICHTHUS_PHONE})
 }catch{
  // Deliberately no database, Graph, decrypted credential or error details in output.
 }
 return <main className="pa-workspace" style={{minHeight:'100vh',padding:'32px max(20px,6vw)'}}>
  <Link href={`/meta/admin/requests/${organizationId}/${protocolId}`}>← Voltar ao protocolo</Link>
  <p className="pa-eyebrow" style={{marginTop:28}}>WHATSAPP / DIAGNÓSTICO DE SOMENTE LEITURA</p>
  <h1>Ichthus · Assinatura Meta</h1>
  <p className="pa-lead">Consulta autenticada ao aplicativo Meta por credencial protegida no cofre da Proxy. Não altera callback, WABA ou mensagens.</p>
  {!report?<section className="pa-note"><h2>Consulta indisponível</h2>
   <p>A identidade de leitura ou a credencial do protocolo ainda não foi validada. Nenhuma ausência de assinatura pode ser presumida.</p>
  </section>:<section className="pa-note">
   <h2>Resultados da Graph API</h2>
   <p>Consultado em {new Date(report.checkedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}.</p>
   {labels.map(([key,label])=><div key={key} style={{padding:'12px 0',borderTop:'1px solid #263341'}}>
    <strong>{label}</strong>
    <p>{statuses[report!.checks[key]?.status]||'Não verificado'}: {report!.checks[key]?.detail||'Sem resposta.'}</p>
   </div>)}
  </section>}
  <section className="pa-note"><h2>Critério de homologação</h2>
   <p>Uma inscrição encontrada não prova entrega de mensagens. Após confirmação do callback específico, ainda será necessário receber mensagem real no CRM e validar o atendimento. O callback global de Eduardo Brasil não será alterado.</p>
  </section>
 </main>
}
