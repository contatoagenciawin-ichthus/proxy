import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentPlatformAdmin } from '@/lib/meta-admin/auth'
import { listConnections, inventorySummary } from '@/lib/meta-admin/inventory.mjs'
import { logoutAdmin } from './actions'
import {loadProviderConnectionRequests} from '@/lib/meta-admin/connection-requests-admin.mjs'
import {readIchthusOperationalTelemetry} from '@/lib/meta-admin/ichthus-operational-telemetry.mjs'
export default async function AdminOverview() {
  if (!(await currentPlatformAdmin())) redirect('/meta/admin/login')
  const connections = listConnections(), summary = inventorySummary()
  const [inbound,ichthusTelemetry] = await Promise.all([loadProviderConnectionRequests(),readIchthusOperationalTelemetry()])
  const lastTelemetry = ichthusTelemetry.snapshot
  return <div className="pa-shell"><aside className="pa-sidebar"><div className="pa-wordmark">proxy<span>TECHNOLOGY</span></div>
    <p className="pa-nav-label">PLATAFORMA META</p><nav aria-label="Administração"><Link className="pa-nav-active" href="/meta/admin">Conexões <span>03</span></Link><Link href="/meta/admin/ads">Relatórios de tráfego <span>↗</span></Link></nav>
    <div className="pa-sidebar-bottom">Acesso da plataforma<br/><strong>Consulta administrativa</strong></div></aside>
    <div className="pa-workspace"><header className="pa-topbar"><span>Meta Provider <span className="pa-muted">/ Administração</span></span><form action={logoutAdmin}><button className="pa-text-button">Sair</button></form></header>
    <main className="pa-main"><div className="pa-heading"><div><p className="pa-eyebrow">VISÃO DA PLATAFORMA</p><h1>Conexões dos clientes</h1><p className="pa-lead">Inventário e evidências das integrações gerenciadas pela Proxy.</p></div><span className="pa-mode">SOMENTE LEITURA</span></div>
    <section className="pa-metrics" aria-label="Resumo do inventário">
      <div><span>Clientes registrados</span><strong>{summary.registered.toString().padStart(2, '0')}</strong></div>
      <div><span>Produção informada</span><strong>{summary.productionReported.toString().padStart(2, '0')}</strong></div>
      <div><span>Operações validadas</span><strong>{summary.validated.toString().padStart(2, '0')}</strong></div>
      <div><span>Telemetria consultada</span><strong>{ichthusTelemetry.state==='available'?'01':'—'}</strong><small>{ichthusTelemetry.state==='available'?'Ichthus · eventos do CRM':'Sem consulta atual disponível'}</small></div>
    </section>
    <div className="pa-section-title"><h2>WhatsApp Business Platform</h2><span>3 organizações · evidências atualizadas em 11/11/2026</span></div>
    <div className="pa-table-wrap"><table><caption className="pa-sr">Clientes e situação documentada de suas integrações WhatsApp</caption><thead><tr><th>Cliente / produto</th><th>Canal</th><th>Situação registrada</th><th>Evidência / monitoramento</th><th><span className="pa-sr">Detalhes</span></th></tr></thead><tbody>
      {connections.map(c => <tr key={c.id}><td><div className="pa-client"><span className="pa-avatar">{c.initials}</span><div><strong>{c.name}</strong><small>{c.product}</small></div></div></td><td><span>{c.number || 'Número não conferido'}</span><small>WhatsApp Business</small></td><td><span className={`pa-badge ${c.stageKind === 'pending' ? 'pa-badge-pending' : ''}`}>{c.stage}</span></td><td><span className="pa-muted">{c.id==='ichthus'&&ichthusTelemetry.state==='available'?`Eventos consultados · ${new Date(lastTelemetry?.observedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}`:('verification' in c ? c.verification : null) || 'Sem diagnóstico ao vivo'}</span></td><td><Link className="pa-detail-link" href={`/meta/admin/connections/${c.id}`} aria-label={`Ver conexão de ${c.name}`}>Ver ficha <span aria-hidden="true">↗</span></Link></td></tr>)}
    </tbody></table></div>
    <section className="pa-note" aria-label="Telemetria operacional Ichthus">
      <h2>Telemetria operacional · Ichthus</h2>
      <p>Consulta sob demanda aos metadados do CRM, sem conteúdo de mensagens. Não equivale a teste da Graph API nem comprova disponibilidade contínua.</p>
      {ichthusTelemetry.state==='available'?<dl className="pa-diagnostics">
        {[
          ['Última mensagem recebida',lastTelemetry?.lastInboundAt],
          ['Último envio humano pelo CRM',lastTelemetry?.lastCrmOutboundAt],
          ['Último envio pelo aplicativo',lastTelemetry?.lastBusinessAppEchoAt],
          ['Última confirmação de entrega',lastTelemetry?.lastDeliveredAt],
          ['Última confirmação de leitura',lastTelemetry?.lastReadAt],
          ['Última falha de entrega',lastTelemetry?.lastFailedAt]
        ].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Sem evento registrado'}</dd></div>)}
        <div><dt>Falhas de entrega nas últimas 24h</dt><dd>{lastTelemetry?.deliveryFailures24h}</dd></div>
        <div><dt>Mensagens recebidas nas últimas 24h</dt><dd>{lastTelemetry?.inboundEvents24h}</dd></div>
      </dl>:<p role="status">Telemetria atual {ichthusTelemetry.state==='disabled'?'não habilitada':ichthusTelemetry.state==='unconfigured'?'não configurada':'indisponível'}. O marco de homologação permanece válido, mas a saúde atual não foi verificada.</p>}
    </section>
    <section className="pa-quick-access" aria-labelledby="meta-ads-access">
      <div><p className="pa-eyebrow">META ADS</p><h2 id="meta-ads-access">Relatórios de tráfego</h2><p>Centralize aqui o acesso aos relatórios obtidos pela Marketing API, sem precisar memorizar rotas técnicas de review.</p></div>
      <Link className="pa-button pa-button-link" href="/meta/admin/ads">Abrir central de relatórios <span aria-hidden="true">↗</span></Link>
    </section>
    <section className="pa-note" aria-label="Solicitações de integração recebidas">
      <h2>Solicitações de integração recebidas</h2>
      <p>Pedidos reais recebidos do CRM. Um protocolo confirmado não significa que o número esteja conectado à Meta.</p>
      {inbound.state==='disabled'&&<p>Consulta administrativa ainda desativada.</p>}
      {inbound.state==='unavailable'&&<p role="alert">Não foi possível consultar os protocolos. Nenhum estado foi presumido.</p>}
      {inbound.state==='ready'&&inbound.requests.length===0&&<p>Nenhuma solicitação encontrada para as organizações autorizadas.</p>}
      {inbound.state==='ready'&&inbound.requests.length>0&&<div className="pa-table-wrap"><table>
        <caption className="pa-sr">Solicitações persistidas na Proxy</caption>
        <thead><tr><th>Empresa</th><th>Protocolo</th><th>Canal</th><th>Estado</th><th>Recebido</th><th>Detalhes</th></tr></thead>
        <tbody>{inbound.requests.map(r=><tr key={r.product+':'+r.protocolId}>
          <td>{r.organizationId==='e9b935b6-3349-4b2c-970d-be8ad3bc243d'?'Ichthus Marketing':r.organizationId}</td>
          <td><code>{r.protocolId}</code></td>
          <td>WhatsApp</td>
          <td><span className="pa-badge pa-badge-pending">{r.status==='received_by_proxy'?'Recebido pela Proxy':r.status}</span></td>
          <td>{r.receivedAt?new Date(r.receivedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'—'}</td>
          <td><Link className="pa-detail-link" href={`/meta/admin/requests/${r.organizationId}/${r.protocolId}`}>Abrir protocolo</Link></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
    <section className="pa-note"><h2>Homologação não é monitoramento contínuo</h2><p>O piloto Ichthus foi validado por mensagens reais em 11/11/2026, incluindo confirmação de entrega pela Meta. Isso não constitui diagnóstico de saúde em tempo real. Eduardo Brasil e LA Climatização permanecem com produção informada, sem validação operacional equivalente neste inventário.</p></section>
    <footer className="pa-footer"><span>Proxy gerencia as integrações. Cada CRM mantém seu próprio contexto.</span><span>Sem acesso a conversas ou credenciais</span></footer>
    </main></div></div>
}
