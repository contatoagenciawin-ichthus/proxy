import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { currentPlatformAdmin } from '@/lib/meta-admin/auth'
import { findConnection } from '@/lib/meta-admin/inventory.mjs'
import { getProductDiagnostic } from '@/lib/meta-admin/diagnostics.server'
import { ProductDiagnostic } from './diagnostic'
import { readIchthusOperationalTelemetry } from '@/lib/meta-admin/ichthus-operational-telemetry.mjs'
export default async function ConnectionDetail({ params }: { params: Promise<{ client: string }> }) {
  if (!(await currentPlatformAdmin())) redirect('/meta/admin/login')
  const { client } = await params
  const record = findConnection(client)
  if (!record) notFound()
  const [diagnostic,telemetry] = await Promise.all([getProductDiagnostic(client),client==='ichthus'?readIchthusOperationalTelemetry():Promise.resolve(null)])
  const fields = [['Produto', record.product], ['Número', record.number], ['Business ID', record.businessId], ['WABA ID', record.wabaId], ['Phone Number ID', record.phoneNumberId], ['Meta App ID · referência', record.appId]]
  return <main className="pa-main pa-detail"><Link className="pa-detail-link" href="/meta/admin">← Todas as conexões</Link>
    <div className="pa-heading"><div><p className="pa-eyebrow">FICHA DA CONEXÃO</p><h1>{record.name}</h1><p className="pa-lead">{record.product}</p></div><span className={`pa-badge ${record.stageKind === 'pending' ? 'pa-badge-pending' : ''}`}>{record.stage}</span></div>
    <section aria-labelledby="assets"><h2 id="assets">Identificação dos ativos</h2><dl className="pa-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Não conferido'}</dd></div>)}</dl></section>
    <ProductDiagnostic result={diagnostic} />
    {client==='ichthus'&&<section aria-label="Telemetria operacional do CRM Ichthus">
      <div className="pa-section-title"><h2>Telemetria operacional</h2><span>{telemetry?.state==='available'?'Consulta atual ao CRM':'Consulta indisponível'}</span></div>
      <p className="pa-lead">Somente metadados de eventos do CRM Ichthus. A ausência de tráfego não comprova falha da conexão. A consulta não acessa conversas, segredos ou tokens.</p>
      {telemetry?.state==='available'&&telemetry.snapshot?<dl className="pa-diagnostics">
        {[
          ['Consulta realizada em',telemetry.snapshot.observedAt],
          ['Última mensagem recebida',telemetry.snapshot.lastInboundAt],
          ['Última resposta enviada pelo CRM',telemetry.snapshot.lastCrmOutboundAt],
          ['Última mensagem do aplicativo',telemetry.snapshot.lastBusinessAppEchoAt],
          ['Última entrega confirmada',telemetry.snapshot.lastDeliveredAt],
          ['Última leitura confirmada',telemetry.snapshot.lastReadAt],
          ['Última falha de entrega',telemetry.snapshot.lastFailedAt]
        ].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Sem evento registrado'}</dd></div>)}
        <div><dt>Falhas de entrega em 24h</dt><dd>{telemetry.snapshot.deliveryFailures24h}</dd></div>
        <div><dt>Recebimentos em 24h</dt><dd>{telemetry.snapshot.inboundEvents24h}</dd></div>
      </dl>:<p role="status" className="pa-lead">Não foi possível consultar metadados atuais ({telemetry?.state||'indisponível'}). Homologação histórica não significa saúde atual.</p>}
    </section>}
    <section><div className="pa-section-title"><h2>Referência do inventário</h2><span>Sem consulta em tempo real</span></div><dl className="pa-diagnostics">{[['Credencial operacional', record.credential], ['Assinatura / callback do webhook', record.webhook], ['Recebimento recente', record.inbound], ['Coexistência com o aplicativo', record.coexistence]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <section><div className="pa-section-title"><h2>Evidências registradas</h2><span>Origem e data preservadas</span></div><ol className="pa-evidence">{record.evidence.map((e, i) => <li key={i}><div><time dateTime={e.date}>{e.date.split('-').reverse().join('/')}</time><span>{e.kind}</span></div><p>{e.text}</p></li>)}</ol></section>
    <section className="pa-note"><h2>Próxima verificação</h2><p>{record.next}</p></section>
    <footer className="pa-footer">Consulta administrativa. Sem ações de reconexão, envio ou alteração de configurações.</footer>
  </main>
}
