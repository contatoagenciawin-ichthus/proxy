# Auditoria de continuidade — pedido CRM → recibo Proxy (06/11/2026)

Status: revisão estática de PRs, **sem execução E2E, sem merge, sem deploy e sem consulta a segredos**. Complemento da ADR de onboarding assistido.

## Evidência nos PRs

| Superfície | Evidência de código | Lacuna comprovável |
| --- | --- | --- |
| CRM #15 | `components/connection-request-panel.js`: POST `connections.request`, GET `connections.list`, protocolo e estados `registered`/`received_by_proxy` | Botão `Testar entrega à Proxy` é restrito à homologação; fluxo normal não invoca worker. |
| CRM #15 | `lib/relationship/connection-delivery.mjs`: HMAC em tupla canônica, HTTPS, checagem de recibo e recusa de redirects; `connection-delivery-worker.mjs`: processo de uma tentativa com ACK/erro | Nenhum scheduler, gatilho de evento ou consumer produtivo de outbox demonstrado; serviço worker com configuração e roles restritas ainda precisa de ativação/autorização. |
| CRM #15 | `docs/g2-e2e-isolated-test-runbook-2026-11-03.md` | Documento registra explicitamente que protocolo sintético `7777...` foi inserido no banco, mas não entregue por HTTP ao receptor. Evidências anteriores não provam causalidade E2E nova. Verificar estado posterior antes de afirmar que segue pendente. |
| Proxy #21 | `app/api/meta/admin/connection-requests/route.ts`: POST fail-closed com store persistente; `connection-request-protocol.mjs`: verificação de HMAC, janela temporal, allowlist e recibo | Não há evidência consultada de disponibilidade em produção, configuração dos flags, login restrito e E2E autenticado. |
| Proxy #21 | `app/meta/admin/page.tsx`: seção `Solicitações de integração recebidas` com distinção `disabled`/`unavailable`/`ready` | Apenas tabela; não há ficha de protocolo, responsável, pendências e histórico administrativo editável. |
| Proxy #21 | `lib/meta-admin/connection-requests-admin.mjs`: leitura por allowlist server-side sob escopo de tenant | Fila exibe UUID de organização e protocolo, não nome amigável e número solicitados no roadmap; payload assinado atual não inclui número. Não acrescentar número sem revisar contrato, fonte confiável e privacidade. |

## Primeiro marco operacional (sem Meta)

1. Confirmar o HEAD, CI, estado dos PRs #15 e #21 e migrações efetivamente aplicadas no ambiente de teste separado; não confundir READY de Vercel com E2E.
2. Testar em Preview isolado com organização sintética, login Postgres sem BYPASSRLS, HMAC/allowlist próprios e segredos não expostos; receptor só confirma após persistência.
3. Criar pedido pela UI CRM com ator administrativo real, não inserir protocolo por SQL; confirmar estado `registered/pending` e outbox.
4. Acionar **um worker protegido no servidor** para consumir a outbox, sem depender de botão manual visível ao tenant; confirmar recibo `received_by_proxy` e ACK `acknowledged` no CRM.
5. Confirmar repetição idempotente, falha/retry, indisponibilidade da Proxy e isolamento de duas organizações.
6. Só depois avaliar implantação em produção com flags específicas, observabilidade e rollback, sem alterações Meta.
7. Entrega de UX mínima: ação `Solicitar integração`, protocolo e `Recebido pela Proxy` somente após ACK; Proxy exibe registro consultável e contador. Ficha operacional completa vem na etapa seguinte.

## Restrições

- Não promover PR #15 em bloco sem avaliar mudanças de login, equipe e schema que não pertencem à integração.
- Não executar migrações/alterar Neon ou Vercel e não habilitar receiver/worker em produção por causa deste relatório.
- Não remover webhook atual nem modificar integração Eduardo Brasil/LA.
- Não confundir o receptor de intenção do #21 com o handoff de autorização e eventos WhatsApp dos PRs #19/#39.
- O ID `3237839906603757` está no código de coexistência; habilitação específica Meta continua pendente de confirmação.
- A ficha administrativa deverá suportar múltiplas WABAs/números e ciclo de vida, mas não bloquear o primeiro recibo CRM → Proxy.

## Próxima decisão de engenharia

Escolher mecanismo server-side confiável de execução da outbox (invocação segura no momento do pedido + retry programado ou worker agendado), com isolamento tenant, limitação de tentativas, lease e auditoria. Não executar network IO Meta no request do CRM. Primeiro provar recebimento/ACK em Preview com protocolo criado pela UI.
