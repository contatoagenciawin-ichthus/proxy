import type { DiagnosticResult } from '@/lib/meta-admin/diagnostics-client.mjs'
const status: Record<DiagnosticResult['state'], string> = {
  disabled: 'Coleta desabilitada', unsupported: 'Fonte de diagnóstico ainda não preparada', unconfigured: 'Configuração de coleta incompleta',
  denied: 'Produto recusou a autorização da consulta', unavailable: 'Fonte temporariamente indisponível', invalid: 'Resposta não validada', available: 'Diagnóstico local consultado',
}
function date(value: string | null) {
  return value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value)) + ' (Brasília)' : 'Sem evidência registrada'
}
export function ProductDiagnostic({ result }: { result: DiagnosticResult }) {
  const snapshot = result.snapshot
  const credential = { missing: 'Registro de credencial ausente', recorded: 'Credencial registrada · uso não testado', expired: 'Expirada conforme registro local', invalid_scope: 'Permissões incompletas no registro local' }
  return <section aria-labelledby="product-diagnostic"><div className="pa-section-title"><h2 id="product-diagnostic">Monitoramento do produto</h2><span>{status[result.state]}</span></div>
    {snapshot ? <>
      <p className="pa-lead">Fonte: banco do produto · consulta em {date(snapshot.observedAt)}. Esta consulta não valida a conexão na Meta.</p>
      <dl className="pa-diagnostics">{[
        ['Credencial · registro local', credential[snapshot.credential.state]],
        ['Expiração registrada', snapshot.credential.expiresAt ? date(snapshot.credential.expiresAt) : 'Não informada'],
        ['Último evento recebido', date(snapshot.webhook.lastReceivedAt)],
        ['Último processamento registrado como concluído', date(snapshot.webhook.lastProcessedAt)],
        ['Falhas registradas nas últimas 24 horas', (snapshot.webhook.failuresCapped ? 'Pelo menos ' : '') + snapshot.webhook.failures24h],
        ['Assinatura / callback atual na Meta', 'Não consultado'],
        ['Coexistência com o aplicativo', 'Não determinada'],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <p className="pa-lead">{snapshot.webhook.coverage === 'first-entry-metadata' ? 'Cobertura parcial: eventos cujo primeiro item identifica este número. Eventos em outros itens de um lote podem não aparecer.' : 'Cobertura: registros vinculados à conexão e à organização. Falhas anteriores ao registro do evento podem não aparecer.'} Ausência de eventos não comprova indisponibilidade.</p>
    </> : <p className="pa-lead">O inventário abaixo permanece como referência. {result.state === 'disabled' ? 'A coleta real está bloqueada neste ambiente até a liberação específica.' : 'Não há diagnóstico atual validado para esta consulta.'} Nenhuma saúde operacional foi confirmada.</p>}
  </section>
}
