# ADR complementar — Proxy authoritative tenant policy control plane

Data: 2026-11-08
Estado: proposta de arquitetura; não habilita escrita, cobrança, migração, merge ou deploy.
Referências: Proxy #46, PR #48, LA #74.

## Decisão de produto
O CRM Proxy é a autoridade de decisão para políticas comerciais e operacionais de cada tenant: planos, recursos, orçamentos de serviços, créditos adicionais, habilitação/suspensão e regras de consumo. O CRM tenant continua como **enforcement point** (reserva e controle atômico local), mas não é fonte independente de autorização comercial. O objetivo é evitar dependência de disponibilidade online do Provider para cada mensagem.

**A integração é bidirecional por contrato, com permissões distintas**: leitura de telemetria e escrita de comandos administrativos. A primeira ativação operacional continua **somente leitura** até homologação de segurança. Conexão de administração não implica acesso irrestrito ao banco tenant.

## Separação econômica
- Plano comercial, capacidade/benefícios, franquia, créditos adquiridos e custos internos da Proxy são entidades diferentes.
- Crédito adquirido precisa de registro financeiro próprio, comprovante de pagamento/ajuste autorizado, competência, validade e regra de aplicação; não é simplesmente alterar `soft_limit_cents` sem histórico.
- A opção de vender créditos adicionais ainda não foi aprovada nem precificada. Não criar cobrança nem oferecer compras na UI do tenant neste estágio.
- Provisões financeiras não são faturas conciliadas. O teto técnico do consumo do provedor continua sendo calculado separadamente.

## Contrato de comando administrativo (futuro)
Comandos versionados e restritos a tipos permitidos, por exemplo:
`set_service_policy`, `grant_service_credit`, `revoke_unspent_credit`, `suspend_service`, `resume_service`.
Campos de envelope:
`command_id` (UUID idempotente), `schema_version`, `proxy_tenant_id`, `source_system`, `external_organization_id`, `service`, `operation`, `expected_policy_version`, `new_policy_version`, `effective_at`, `issued_at`, `expires_at`, `actor_id`, `reason`, `payload` com esquema estrito e `correlation_id`.
Não transmitir chaves, dados de contato, transcrições ou PII do cliente. O tenant não aceita payloads arbitrários ou SQL.

### Sequência operacional
1. Operador autenticado Proxy com papel explícito `finops_manage` solicita alteração para um tenant vinculado.
2. Proxy valida RBAC, contrato e elegibilidade comercial (pagamento confirmado quando aplicável), registra intenção e auditoria e emite comando assinado com expiração curta e chave de idempotência.
3. Adaptador do tenant valida autenticidade, audiência, ambiente, vínculo da organização, permissão, tipo, prazo e versão anterior; rejeita replay ou conflito de versão.
4. Aplica atualização de política em transação atômica com histórico imutável. A reserva local do tenant deve consultar a política efetiva mais recente.
5. Retorna confirmação com `command_id`, versão aplicada, instante e resumo sem segredos. Proxy mantém estados `requested`, `pending`, `applied`, `rejected`, `expired`, `reconciliation_required`.
6. Se timeout ou falha, **não repetir como novo comando**: consultar status pela mesma chave e reconciliar. A UI não declara política ativa sem confirmação.

### Autoridade e disponibilidade
- Fonte de verdade **desejada** para concessões: ledger/comandos autorizados na Proxy; fonte de verdade **executada**: versão local de política efetivamente aplicada e confirmada pelo tenant.
- Durante indisponibilidade, o tenant preserva a última política válida confirmada; novos créditos/elevações não entram em vigor até confirmação. Revogações/suspensões de emergência devem ter mecanismo próprio com confirmação, alerta sobre falha e contingência; nenhuma promessa de bloqueio instantâneo durante partição de rede.
- Evitar sincronia com a Proxy a cada mensagem. Persistir configurações e reservas atomicamente no tenant; reconcile apenas por necessidade ou lote.
- Mudanças descendentes devem garantir que gasto reservado/realizado não seja apagado, reclassificado ou anulado. Decréscimos abaixo do já consumido bloqueiam novas chamadas, não eliminam obrigações passadas.
- Isolamento: um `proxy_tenant_id` só pode gerenciar um `external_organization_id` explicitamente autorizado em cada origem/ambiente, com prova de vínculo e anti-replay.
- Falhas de observabilidade e de aplicação não devem abrir permissões por padrão.

## Implicações específicas LA
A configuração atualmente é `whatsapp_audio_budgets` por `organization_id`; reserva usa `soft_limit_cents` e o ledger de transcrições local. A RPC `whatsapp_audio_budget_snapshot` é **somente leitura** e `service_role` only; não deve ser sobrecarregada para comandos.
Criar futuramente interface **restrita e auditada** de aplicação de políticas na LA (preferencialmente endpoint/worker com assinatura e privilégio mínimo) após confirmar o melhor mecanismo no repositório LA. Não expor credenciais `service_role` à Proxy/browser desnecessariamente e não permitir escrita genérica nas tabelas de orçamento.
Plano e créditos adicionais requerem esquema próprio/ledger de alterações; não copiar R$ 297/R$ 30 da LA para os demais.
A tolerância R$ 3 permanece reserva operacional e não é crédito comercial vendável.

## Segurança e testes mandatórios antes de ativar escrita
- Casos negativos: CRM tenant, Meta admin sem papel FinOps, operação sem `finops_manage`, tenant diferente, ambiente errado, comando vencido/falsificado, payload extra, replay, versão obsoleta, charge não confirmado.
- Idempotência sob concorrência e retry; gravação de log de antes/depois, ator, motivo e timestamps.
- Aplicação exata de concessão/crédito uma única vez, incluindo em timeout/restart.
- Rollback em termos de **comando compensatório auditado**, não apagar eventos; não reduzir histórico de consumo.
- Verificação de que a UI Proxy distingue solicitado/aplicado/rejeitado e que o tenant aplica política local mesmo sem a Proxy online.
- Revisão de segurança e autorização explícita antes de qualquer migração, permissão, infraestrutura, merge ou deploy.

## Fases atualizadas
- **F1** contrato de telemetria/read model e testes (PR #48).
- **F2** desenhar envelope de comandos e estados; testes offline de validação, idempotência e conflito.
- **F3** conector seguro de leitura real da LA, sem side effects.
- **F4** implementar adaptador de aplicação de políticas no tenant em ambiente isolado, testes end-to-end e auditoria de versões; **não ativar no ambiente LA antes da homologação**.
- **F5** introduzir comandos de alteração em Proxy FinOps, com papel próprio `finops_manage`, workflows de aprovação e compensação.
- **F6** adicionar planos, créditos, pagamento e política de produtos, conforme decisões comerciais futuras.

Esta decisão substitui a interpretação de que a integração Proxy→tenant seria permanentemente somente leitura. Não substitui o gate de segurança da primeira integração.
