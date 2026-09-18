# Blueprint operacional - CRM WhatsApp

## Objetivo

Este documento define os invariantes técnicos e operacionais para novas implantações de CRM e comunicação via WhatsApp conectadas à Proxy Technology como provedora da camada de integração.

A implementação de cada cliente pode variar em CRM, funil, atendimento, agenda, conteúdo, automações e relatórios. Os controles abaixo não devem variar entre clientes.

## Princípios obrigatórios

1. **Consentimento explícito e auditável**
   - Estados mínimos: `pending`, `opted_in` e `opted_out`.
   - Um contato cadastrado, importado, presente na agenda ou oriundo de relacionamento anterior não é convertido automaticamente em `opted_in`.
   - Todo `opted_in` precisa guardar origem, data e evidência auditável.

2. **Sem override administrativo de opt-in**
   - A interface administrativa não oferece ação "marcar como opt-in".
   - Regularização de consentimento histórico exige procedimento específico, com evidência anexada/registrada e trilha de auditoria.

3. **Elegibilidade separada da base**
   - Base operacional e público elegível são conceitos distintos.
   - Campanhas consultam uma view/lista de elegibilidade formada apenas por contatos ativos com opt-in válido.

4. **Revalidação no momento do envio**
   - O contato é revalidado antes de cada mensagem.
   - Um opt-out posterior à preparação da fila impede o envio.

5. **Templates aprovados**
   - Campanhas iniciadas pela empresa utilizam templates aprovados e ativos na Meta quando exigido.
   - Texto livre em massa não é disponibilizado como atalho operacional.

6. **Aprovação humana**
   - Fluxo mínimo: rascunho -> revisão/aprovação -> materialização do público elegível -> fila -> processamento.
   - A existência de uma campanha não dispara mensagens automaticamente.

7. **Processamento controlado**
   - Lotes limitados pelo runtime do cliente, com teto técnico de 50 por execução na referência atual.
   - Status de submissão, entrega, leitura, resposta, falha e exclusão são persistidos.

8. **Kill switch**
   - Cada cliente possui estado operacional de envio independente.
   - Existe bloqueio emergencial server-side capaz de impedir todos os disparos sem alterar dados de campanha.

9. **Opt-out operacional**
   - Respostas equivalentes a SAIR/PARAR/CANCELAR devem atualizar consentimento e remover imediatamente o contato da elegibilidade.
   - O evento de revogação deve permanecer auditável.

10. **Credenciais server-side**
    - Tokens operacionais nunca são devolvidos ao navegador.
    - Embedded Signup e troca de código ocorrem com validação server-side.
    - Credenciais persistidas devem ser cifradas em repouso e associadas aos ativos corretos do cliente.

## Fronteira de responsabilidade do produto

### Cliente

O cliente é responsável por:
- origem e legitimidade das bases fornecidas;
- estratégias de aquisição de contatos;
- obtenção das autorizações necessárias;
- definição do conteúdo e finalidade das campanhas;
- escolha de públicos e segmentos dentro dos contatos elegíveis;
- aprovação e comando operacional dos disparos.

### Plataforma

A plataforma é responsável por:
- integração técnica com a WhatsApp Business Platform;
- proteção das credenciais;
- aplicação das regras de elegibilidade;
- impedir uso operacional de contatos `pending` e `opted_out`;
- aprovação/template/runtime antes de envio;
- processamento controlado;
- webhooks e trilhas de auditoria;
- opt-out e revalidação no momento do envio.

## Aquisição de opt-in

Cada implementação deve disponibilizar uma ou mais rotas rastreáveis de aquisição, por exemplo:
- landing page/formulário;
- newsletter por e-mail;
- tráfego pago;
- QR Code de evento;
- Instagram/LinkedIn;
- convite compartilhado em interação individual.

A origem da autorização deve ser preservada como dado de auditoria e atribuição.

## Base histórica

Bases históricas devem entrar como `pending` por padrão.

Se o cliente apresentar evidência histórica de autorização específica para WhatsApp, uma rotina de regularização pode ser executada separadamente, registrando:
- origem da evidência;
- canal;
- data ou período conhecido;
- referência documental/conversa;
- responsável pela validação;
- data da regularização.

A regularização nunca deve consistir em simples alteração massiva de status sem evidência.

## Lifecycle de implantação

1. Onboarding institucional e Embedded Signup.
2. Validação de WABA, número e coexistência quando aplicável.
3. Persistência segura das credenciais.
4. Assinatura de webhook.
5. Cadastro/sincronização de templates.
6. Homologação de opt-in.
7. Homologação de envio individual/template.
8. Validação de entrega, leitura e resposta.
9. Homologação de opt-out.
10. Configuração de dashboard e aprovação humana.
11. Handoff com envio inicialmente bloqueado.
12. Liberação do runtime somente após aceite operacional.

## Critério mínimo de homologação end-to-end

Uma implantação é considerada tecnicamente homologada quando demonstrar, no ambiente do cliente:

`opt-in -> elegibilidade -> template aprovado -> submissão -> entrega -> leitura -> resposta -> opt-out -> inelegibilidade`

Quando necessário, reopt-in também deve ser testado para validar a retomada legítima da elegibilidade.

## Reuso em novos clientes

As entidades de negócio podem mudar:
- clínica: paciente, lead, agendamento, retorno;
- prestador de serviços: lead, orçamento, OS, pós-venda;
- conteúdo: assinante, artigo, campanha;
- atendimento: conversa, fila, agente, SLA.

Os invariantes de consentimento, segurança, elegibilidade, aprovação, runtime e auditoria permanecem os mesmos.
