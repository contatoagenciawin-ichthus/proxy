// Curated evidence register. No network, tenant database, secrets or message bodies.
const pending = () => ({ credential: 'Não verificada', webhook: 'Não verificado', inbound: 'Não verificado', coexistence: 'Não determinada' });
const records = [
  { id: 'eduardo-brasil', name: 'Eduardo Brasil', initials: 'EB', product: 'Atendimento Eduardo Brasil',
    stage: 'Produção informada', stageKind: 'reported', number: null,
    businessId: null, wabaId: '269938242876600', phoneNumberId: '280401731826708',
    appId: '1952034255371331', ...pending(),
    evidence: [
      { date: '2026-10-23', kind: 'Relato do responsável', text: 'Cliente já atendido pela Proxy, em produção. Não equivale a uma consulta de saúde atual.' },
      { date: '2026-10-23', kind: 'Código · main', text: 'WABA e Phone Number ID encontrados no roteamento legado de credenciais da Proxy. Cadastro no código não comprova tráfego.' },
    ], next: 'Conferir somente leitura das assinaturas e do diagnóstico do produto existente, sem reconectar o cliente.' },
  { id: 'la-climatizacao', name: 'LA Climatização', initials: 'LA', product: 'Marc.I.A · CRM de serviços',
    stage: 'Produção informada', stageKind: 'reported', number: null,
    businessId: null, wabaId: null, phoneNumberId: null, appId: '1952034255371331', ...pending(),
    evidence: [
      { date: '2026-10-23', kind: 'Relato do responsável', text: 'Cliente já atendido pela Proxy, em produção. Identificadores e saúde atual ainda não consultados por este painel.' },
      { date: '2026-10-19', kind: 'Documento · PR #19', text: 'ADR da integração LA registra o mesmo aplicativo Tech Provider e a conexão gerida pelo próprio produto. Evidência documental, sem consulta em tempo real.' },
    ], next: 'Obter metadados do diagnóstico da Marc.I.A por consulta autorizada, preservando credenciais e callback atuais.' },
  { id: 'ichthus', name: 'Ichthus Marketing', initials: 'IC', product: 'Proxy Relationship Intelligence',
    stage: 'Operação validada', stageKind: 'validated', verification: 'Validação funcional · 11/11/2026', number: '+55 19 99805-6642',
    businessId: '1163206548889117', wabaId: '107697061976892', phoneNumberId: '107612478652254',
    appId: '1952034255371331', ...pending(),
    credential: 'Uso validado no piloto de 11/11/2026 · validade atual não aferida',
    webhook: 'Recebimento confirmado no piloto · saúde atual não monitorada',
    inbound: 'Mensagem individual persistida no CRM em 11/11/2026',
    coexistence: 'Operação com WhatsApp Business App validada no piloto',
    evidence: [
      { date: '2026-10-23', kind: 'Capturas · interface Meta', text: 'Business, WABA e Phone Number ID conferidos. Conta aprovada e número conectado ao WhatsApp Business App. Coexistência com Cloud API não comprovada.' },
      { date: '2026-10-23', kind: 'Código · main', text: 'App ID identificado na página de coexistência. À época, associação e permissões ainda dependiam de auditoria Meta.' },
      { date: '2026-11-11', kind: 'Piloto real · Meta e CRM Ichthus', text: 'Coexistência autorizada, credencial operacional protegida na Proxy, recebimento individual persistido no CRM e envio humano pela Proxy aceito pela Meta com confirmação de entrega (delivered) para o número de teste final 3352.' },
      { date: '2026-11-11', kind: 'Código · PRs homologados', text: 'Inbox humano no CRM (PR #29), gateway de envio Proxy (PR #59) e envio humano CRM (PR #30), publicados em produção e testados na integração Ichthus.' },
    ], next: 'Operação individual de texto validada em 11/11/2026. Manter monitoramento de saúde atual separado do marco de homologação; não reabrir Embedded Signup ou alterar webhooks para corrigir o inventário.' },
];
export function listConnections() { return structuredClone(records); }
export function findConnection(id) { return listConnections().find(record => record.id === id) || null; }
export function inventorySummary() {
  return { registered: records.length, productionReported: records.filter(x => x.stageKind === 'reported').length,
    validated: records.filter(x => x.stageKind === 'validated').length,
    pending: records.filter(x => x.stageKind === 'pending').length, verifiedLive: 0 };
}
