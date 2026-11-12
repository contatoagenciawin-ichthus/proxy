import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { currentPlatformAdmin } from '@/lib/meta-admin/auth'
import { findConnection } from '@/lib/meta-admin/inventory.mjs'
import { loadDailyConnectionStatus } from '@/lib/meta-admin/daily-connection-status.mjs'
export default async function ConnectionDetail({ params }: { params: Promise<{ client: string }> }) {
  if (!(await currentPlatformAdmin())) redirect('/meta/admin/login')
  const { client } = await params
  const record = findConnection(client)
  if (!record) notFound()
  const daily=client==='ichthus'?await loadDailyConnectionStatus():null
  const checkpoint=daily?.snapshot
  const latest=daily?.state==='recent'&&checkpoint?.result==='confirmed'?'Metadados Meta confirmados':
   daily?.state==='recent'&&checkpoint?.result==='attention'?'Atenção necessária':
   daily?.state==='recent'?'Verificação inconclusiva':
   daily?.state==='stale'?'Registro desatualizado':'Primeira verificação pendente'
  const fields = [['Produto', record.product], ['Número', record.number], ['Business ID', record.businessId], ['WABA ID', record.wabaId], ['Phone Number ID', record.phoneNumberId], ['Meta App ID · referência', record.appId]]
  return <main className="pa-main pa-detail"><Link className="pa-detail-link" href="/meta/admin">← Todas as conexões</Link>
    <div className="pa-heading"><div><p className="pa-eyebrow">FICHA DA CONEXÃO</p><h1>{record.name}</h1><p className="pa-lead">{record.product}</p></div><span className={`pa-badge ${record.stageKind === 'pending' ? 'pa-badge-pending' : ''}`}>{record.stage}</span></div>
    <section aria-labelledby="assets"><h2 id="assets">Identificação dos ativos</h2><dl className="pa-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Não conferido'}</dd></div>)}</dl></section>
    <section aria-label="Verificação periódica da conexão">
      <div className="pa-section-title"><h2>Verificação programada</h2><span>{client==='ichthus'?'1 vez ao dia':'Não configurada para este cliente'}</span></div>
      {client==='ichthus'?<>
        <p className="pa-lead">Resultado salvo da última consulta diária de metadados à Meta. Abrir esta página não inicia nova verificação, não envia mensagens nem consulta conversas.</p>
        <dl className="pa-diagnostics">
          <div><dt>Último resultado</dt><dd>{latest}</dd></div>
          <div><dt>Data da verificação</dt><dd>{checkpoint?.checkedAt?new Date(checkpoint.checkedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Ainda não realizada'}</dd></div>
          <div><dt>Homologação funcional</dt><dd>Validada em 11/11/2026</dd></div>
        </dl>
        <p className="pa-lead">Uma consulta inconclusiva não anula a homologação anterior. A confirmação dos metadados não equivale a testar entrega de mensagens.</p>
      </>:<p className="pa-lead">Sem verificação programada nesta fase. A situação exibida é documental, não um diagnóstico em tempo real.</p>}
    </section>
    <section><div className="pa-section-title"><h2>Referência do inventário</h2><span>Sem consulta em tempo real</span></div><dl className="pa-diagnostics">{[['Credencial operacional', record.credential], ['Assinatura / callback do webhook', record.webhook], ['Recebimento recente', record.inbound], ['Coexistência com o aplicativo', record.coexistence]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <section><div className="pa-section-title"><h2>Evidências registradas</h2><span>Origem e data preservadas</span></div><ol className="pa-evidence">{record.evidence.map((e, i) => <li key={i}><div><time dateTime={e.date}>{e.date.split('-').reverse().join('/')}</time><span>{e.kind}</span></div><p>{e.text}</p></li>)}</ol></section>
    <section className="pa-note"><h2>Próxima verificação</h2><p>{record.next}</p></section>
    <footer className="pa-footer">Consulta administrativa. Sem ações de reconexão, envio ou alteração de configurações.</footer>
  </main>
}
