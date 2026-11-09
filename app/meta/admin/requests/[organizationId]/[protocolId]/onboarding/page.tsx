import Link from 'next/link'
import {notFound,redirect} from 'next/navigation'
import {currentPlatformAdmin} from '@/lib/meta-admin/auth'
import {loadProviderConnectionRequests} from '@/lib/meta-admin/connection-requests-admin.mjs'
import {findAdminRequestDetail} from '@/lib/meta-admin/connection-request-detail.mjs'
import {provisioningEnabled} from '@/lib/meta-provisioning/runtime.mjs'
import OnboardingClient from './OnboardingClient'
export const dynamic='force-dynamic'
export default async function Onboarding({params}:{
 params:Promise<{organizationId:string,protocolId:string}>
}){
 if(!(await currentPlatformAdmin()))redirect('/meta/admin/login')
 const {organizationId,protocolId}=await params
 const back=`/meta/admin/requests/${organizationId}/${protocolId}`
 const detail=findAdminRequestDetail({
  inbound:await loadProviderConnectionRequests(),organizationId,protocolId
 })
 if(detail.state!=='ready'||detail.request?.channel!=='whatsapp')notFound()
 return <main className="pa-workspace" style={{minHeight:'100vh',padding:'32px max(20px,6vw)'}}>
  <Link href={back}>← Voltar ao protocolo</Link>
  <p className="pa-eyebrow" style={{marginTop:30}}>WHATSAPP / PROVISIONAMENTO ASSISTIDO</p>
  <h1>Autorização Meta vinculada ao protocolo</h1>
  <p className="pa-lead">Apenas operador Proxy autenticado. Nenhuma credencial Meta
   é enviada ao navegador ou ao CRM.</p>
  <section className="pa-note">
   <p>Organização: <code>{organizationId}</code></p>
   <p>Protocolo: <code>{protocolId}</code></p>
   <p>Estado recebido: {detail.request.status}</p>
  </section>
  {provisioningEnabled()?
   <OnboardingClient organizationId={organizationId} protocolId={protocolId}/>:
   <section className="pa-note" role="status">
    <h2>Provisionamento ainda não habilitado</h2>
    <p>A infraestrutura de sessão e credenciais está em homologação. Esta tela não
     iniciará Embedded Signup nem trocará códigos Meta até a validação do cofre e
     das permissões de acesso.</p>
   </section>}
 </main>
}
