import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { currentPlatformAdmin } from '@/lib/meta-admin/auth'
import { findConnection } from '@/lib/meta-admin/inventory.mjs'
import { getProductDiagnostic } from '@/lib/meta-admin/diagnostics.server'
import { ProductDiagnostic } from './diagnostic'
export default async function ConnectionDetail({ params }: { params: Promise<{ client: string }> }) {
  if (!(await currentPlatformAdmin())) redirect('/meta/admin/login')
  const { client } = await params
  const record = findConnection(client)
  if (!record) notFound()
  const diagnostic = await getProductDiagnostic(client)
  const fields = [['Produto', record.product], ['Número', record.number], ['Business ID', record.businessId], ['WABA ID', record.wabaId], ['Phone Number ID', record.phoneNumberId], ['Meta App ID · referência', record.appId]]
  return <main className="pa-main pa-detail"><Link className="pa-detail-link" href="/meta/admin">← Todas as conexões</Link>
    <div className="pa-heading"><div><p className="pa-eyebrow">FICHA DA CONEXÃO</p><h1>{record.name}</h1><p className="pa-lead">{record.product}</p></div><span className={`pa-badge ${record.stageKind === 'pending' ? 'pa-badge-pending' : ''}`}>{record.stage}</span></div>
    <section aria-labelledby="assets"><h2 id="assets">Identificação dos ativos</h2><dl className="pa-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Não conferido'}</dd></div>)}</dl></section>
    <ProductDiagnostic result={diagnostic} />
    <section><div className="pa-section-title"><h2>Referência do inventário</h2><span>Sem consulta em tempo real</span></div><dl className="pa-diagnostics">{[['Credencial operacional', record.credential], ['Assinatura / callback do webhook', record.webhook], ['Recebimento recente', record.inbound], ['Coexistência com o aplicativo', record.coexistence]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <section><div className="pa-section-title"><h2>Evidências registradas</h2><span>Origem e data preservadas</span></div><ol className="pa-evidence">{record.evidence.map((e, i) => <li key={i}><div><time dateTime={e.date}>{e.date.split('-').reverse().join('/')}</time><span>{e.kind}</span></div><p>{e.text}</p></li>)}</ol></section>
    <section className="pa-note"><h2>Próxima verificação</h2><p>{record.next}</p></section>
    <footer className="pa-footer">Consulta administrativa. Sem ações de reconexão, envio ou alteração de configurações.</footer>
  </main>
}
