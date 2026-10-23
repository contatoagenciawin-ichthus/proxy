import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentPlatformAdmin } from '@/lib/meta-admin/auth'
import { listConnections, inventorySummary } from '@/lib/meta-admin/inventory.mjs'
import { logoutAdmin } from './actions'
export default async function AdminOverview() {
  if (!(await currentPlatformAdmin())) redirect('/meta/admin/login')
  const connections = listConnections(), summary = inventorySummary()
  return <div className="pa-shell"><aside className="pa-sidebar"><div className="pa-wordmark">proxy<span>TECHNOLOGY</span></div>
    <p className="pa-nav-label">PLATAFORMA META</p><nav aria-label="Administração"><Link className="pa-nav-active" href="/meta/admin">Conexões <span>03</span></Link></nav>
    <div className="pa-sidebar-bottom">Acesso da plataforma<br/><strong>Consulta administrativa</strong></div></aside>
    <div className="pa-workspace"><header className="pa-topbar"><span>Meta Provider <span className="pa-muted">/ Administração</span></span><form action={logoutAdmin}><button className="pa-text-button">Sair</button></form></header>
    <main className="pa-main"><div className="pa-heading"><div><p className="pa-eyebrow">VISÃO DA PLATAFORMA</p><h1>Conexões dos clientes</h1><p className="pa-lead">Inventário e evidências das integrações gerenciadas pela Proxy.</p></div><span className="pa-mode">SOMENTE LEITURA</span></div>
    <section className="pa-metrics" aria-label="Resumo do inventário">
      <div><span>Clientes registrados</span><strong>{summary.registered.toString().padStart(2, '0')}</strong></div>
      <div><span>Produção informada</span><strong>{summary.productionReported.toString().padStart(2, '0')}</strong></div>
      <div><span>Homologação pendente</span><strong>{summary.pending.toString().padStart(2, '0')}</strong></div>
      <div><span>Saúde verificada ao vivo</span><strong>—</strong><small>Ainda sem consulta automática</small></div>
    </section>
    <div className="pa-section-title"><h2>WhatsApp Business Platform</h2><span>3 organizações · registros de 23/10/2026</span></div>
    <div className="pa-table-wrap"><table><caption className="pa-sr">Clientes e situação documentada de suas integrações WhatsApp</caption><thead><tr><th>Cliente / produto</th><th>Canal</th><th>Situação registrada</th><th>Verificação atual</th><th><span className="pa-sr">Detalhes</span></th></tr></thead><tbody>
      {connections.map(c => <tr key={c.id}><td><div className="pa-client"><span className="pa-avatar">{c.initials}</span><div><strong>{c.name}</strong><small>{c.product}</small></div></div></td><td><span>{c.number || 'Número não conferido'}</span><small>WhatsApp Business</small></td><td><span className={`pa-badge ${c.stageKind === 'pending' ? 'pa-badge-pending' : ''}`}>{c.stage}</span></td><td><span className="pa-muted">Pendente de diagnóstico</span></td><td><Link className="pa-detail-link" href={`/meta/admin/connections/${c.id}`} aria-label={`Ver conexão de ${c.name}`}>Ver ficha <span aria-hidden="true">↗</span></Link></td></tr>)}
    </tbody></table></div>
    <section className="pa-note"><h2>Inventário não é confirmação de saúde</h2><p>Eduardo Brasil e LA Climatização já são atendidos pela Proxy, conforme informado pelo responsável. Este painel ainda não consulta a Meta nem os sistemas dos clientes. Nenhuma conexão é declarada operacional com base apenas nesse registro.</p></section>
    <footer className="pa-footer"><span>Proxy gerencia as integrações. Cada CRM mantém seu próprio contexto.</span><span>Sem acesso a conversas ou credenciais</span></footer>
    </main></div></div>
}
