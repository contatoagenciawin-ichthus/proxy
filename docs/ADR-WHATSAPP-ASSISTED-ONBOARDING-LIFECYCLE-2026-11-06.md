# ADR — Onboarding assistido e ciclo de vida WhatsApp multi-tenant

Data: 2026-11-06  
Status: **decisão de produto e arquitetura aprovada para orientar implementação; não significa funcionalidade implementada nem conexão ativa**.  
Escopo: Proxy Technology (provider), produtos/CRMs consumidores e operação Meta.

## Decisão

Adotar **onboarding assistido com provisionamento manual supervisionado**. O cliente solicita a integração dentro de seu CRM, mas não acessa a administração Proxy nem inicia Embedded Signup diretamente pelo CRM. O CRM envia pedido autenticado e assinado à Proxy. A Proxy registra protocolo, origem, tenant, organização, solicitante e histórico; um operador autorizado acompanha pendências, valida os ativos e realiza o onboarding em sessão assistida, com participação do cliente quando exigida pela Meta. O CRM recebe estados por protocolo.

Automatizar o transporte do pedido, a fila, a auditoria, os recibos e as validações técnicas apropriadas; preservar atuação humana para conferência e habilitação dos ativos, autorizações, revisão de permissões e decisão de ativação. Não exigir autorização ampla à BM quando o consentimento ou compartilhamento necessário puder ser obtido com menor privilégio.

**Meta imediata:** conectar o número da Ichthus Marketing, primeiro tenant, por esse fluxo de ponta a ponta. Não iniciar conexão direta fora do protocolo para acelerar a homologação.

## Contrato de operação e responsabilidades

1. **CRM/tenant:** administrador autorizado solicita integração, recebe protocolo e acompanha andamento. O clique deve enfileirar a entrega, sem ação manual de homologação. Pedidos repetidos em aberto são idempotentes.
2. **Proxy/provider:** autentica o CRM/produto e a organização com assinatura própria, protege contra replay, persiste intenção, devolve recibo e exibe solicitação em `app.proxyone.tech/meta/admin`, pela entrada prioritária **WhatsApp → Solicitações**.
3. **Operador Proxy:** abre a ficha vinculada ao protocolo, assume responsabilidade, registra pendências/evidências e valida identidade empresarial, propriedade e permissões dos ativos. Cliente participa de consentimento, login ou QR apenas quando exigido.
4. **Onboarding:** a rota existente `/meta/onboarding/coexistence` é ferramenta da operação, não entrada autônoma do cliente. Seu início deve exigir contexto de protocolo e operador autorizado, evitando troca de código/credencial desvinculada da solicitação.
5. **Validação/ativação:** conferir Business Portfolio, WABA e Phone Number ID esperados, autorização, assinatura e callback **por WABA** quando aplicável, guardando estado anterior e rollback restrito ao tenant. Testar mensagem real, resposta no PC, status de entrega, eco da resposta do celular e isolamento entre clientes antes de declarar atendimento diário ativo. Registrar evidência e devolver estado ao CRM no mesmo protocolo.
6. **IA:** ativação separada e expressamente autorizada, nunca inferida da conexão WhatsApp.

Estados distintos: solicitação recebida, provisionamento em andamento, autorização concluída, conexão técnica validada, atendimento operacional liberado, automação/IA habilitada. Estados de erro, suspensão e encerramento devem ser explícitos. **Autorização Meta não equivale a atendimento ativo.** Uma mensagem real recebida é requisito para avançar à operação, não prova isolada de todos os testes.

## Inventário administrativo e cardinalidade

A ficha de cada solicitação/conexão deve exibir para consulta rápida, com controle de acesso: organização/tenant e CRM de origem, protocolo, solicitante, responsável, etapa, pendências, histórico e timestamps; Business Portfolio ID, WABA ID, Phone Number ID, telefone, modalidade (coexistência/Cloud API), configuration ID efetivo, origem e status da autorização, callback/roteamento efetivo por WABA, status operacional e evidências de testes. Segredos e tokens nunca são expostos ao browser ou logs.

Modelo: **tenant 1:N WABAs; WABA 1:N números** (e conexões/protocolos versionados), sem supor exclusividade global ou uma WABA por cliente. Verificar propriedade e dependências antes de desvincular ativos compartilhados.

## Ciclo de vida, separado por camada

Prever operações com autorização administrativa e auditoria: adicionar número, substituir, suspender, desconectar, encerrar contrato, recuperar, reconectar e reativar. Diferenciar:
- **Desativação no CRM:** desliga atendimento/IA e uso naquele produto, sem automaticamente alterar ativos Meta.
- **Desvinculação operacional Proxy:** desabilita roteamento e credenciais/assinaturas aplicáveis ao vínculo, com checagem de dependências e possibilidade de reversão controlada.
- **Operação em ativos Meta:** remoção de número/WABA, migração ou revogação exigem procedimento separado, verificação de titularidade, impacto e confirmação explícita; não excluir WABA ou número automaticamente ao encerrar contrato.

Perda de número ou suspeita de comprometimento: priorizar suspensão segura e recuperação; troca de número: validar o substituto antes de desativar o anterior sempre que possível. Desconexão por WABA deve considerar todos os números e demais produtos dependentes.

## Integrações existentes e limites

- **Não modificar** callback global do app, nem interromper Eduardo Brasil ou LA Climatização.
- Configuração Embedded Signup da Proxy encontrada no código: `3237839906603757` e `featureType: "whatsapp_business_app_onboarding"`; **a habilitação de coexistência dessa configuração pela Meta ainda requer confirmação autenticada**.
- `1741838130384076` refere-se à revisão separada `business_management`, não ao onboarding WhatsApp.
- Página de coexistência já existe em `https://proxy.ichthusmkt.com.br/meta/onboarding/coexistence`; acesso direto não deve contornar protocolo/validação.
- Não usar tokens de Meta no CRM/browser, nem presumir permissão de excluir ou migrar WABA.

## Entrega mínima e roadmap

**Agora (Ichthus):** CRM solicita e recebe recibo; Proxy mostra solicitação e ficha básica com responsável, pendência e histórico; operador inicia onboarding vinculado ao protocolo; valida ativos e testes de canal; confirma resultado de modo idempotente ao CRM. Contador de pedidos novos basta para o piloto; e-mails podem ficar para depois.

**Preparar no modelo agora, implementar depois:** administração de múltiplos números/WABAs, solicitações de alteração e desconexão, operações de desprovisionamento, alertas e inventário ampliado. A estrutura deve suportar o ciclo de vida sem exigir implementação prematura de comandos destrutivos Meta.

## Referências de implementação (não pressupõem merge/publicação)

- CRM: PRs #11 e #15 (solicitação/protocolo); #18 (receptor de eventos/caixa; retirar login Meta direto do CRM).
- Proxy: PR #21 (recepção assinada e fila); #19 (handoff isolado); #38 (domínio CRM, já incorporado no #39 segundo revisão); #39 (validação/handoff/eventos); #5 (configuration ID); #6 (separação App Review).
- Verificar branches, PRs, ambientes e contratos antes de mesclar ou publicar. As mudanças em desenvolvimento não representam ativação de produção.

## Restrições desta ADR

Este documento não aprova alterações na Meta, merge automático, deploy de produção, mudança de webhook, execução de Embedded Signup ou desconexão. Registrar datas, evidências, responsável e rollback ao executar cada operação futura.
