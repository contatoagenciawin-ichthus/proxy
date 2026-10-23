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
    stage: 'Homologação pendente', stageKind: 'pending', number: '+55 19 99805-6642',
    businessId: '1163206548889117', wabaId: '107697061976892', phoneNumberId: '107612478652254',
    appId: '1952034255371331', ...pending(),
    evidence: [
      { date: '2026-10-23', kind: 'Capturas · interface Meta', text: 'Business, WABA e Phone Number ID conferidos. Conta aprovada e número conectado ao WhatsApp Business App. Coexistência com Cloud API não comprovada.' },
      { date: '2026-10-23', kind: 'Código · main', text: 'App ID identificado na página de coexistência. Associação efetiva e permissões ainda dependem da auditoria Meta.' },
    ], next: 'Confirmar aplicativo, credencial e assinatura da WABA antes de homologar recebimento e resposta humana no CRM.' },
];
export function listConnections() { return structuredClone(records); }
export function findConnection(id) { return listConnections().find(record => record.id === id) || null; }
export function inventorySummary() {
  return { registered: records.length, productionReported: records.filter(x => x.stageKind === 'reported').length,
    pending: records.filter(x => x.stageKind === 'pending').length, verifiedLive: 0 };
}
