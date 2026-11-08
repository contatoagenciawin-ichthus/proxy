# Proxy FinOps — matriz de autorização e conector LA (proposta v1)
Data: 2026-11-08
Estado: design-only; sem acesso a produção, sem deploy e sem permissão para escrita.
Referências: Proxy #46 e PR #48; LA #74.

## Princípio de acesso
Toda leitura deve passar por autenticação efetiva da plataforma (`currentPlatformAdmin`) E uma autorização FinOps independente. A lista de IDs GitHub autorizados na administração Meta não concede automaticamente direitos financeiros. Membership/owner/admin de qualquer CRM tenant nunca autoriza FinOps.

| Identidade | Ver lista de tenants | Ver custos de um tenant | Alterar orçamento | Consultar chave/segredo |
| --- | --- | --- | --- | --- |
| Visitante/anônimo | Não | Não | Não | Não |
| Usuário/owner/admin de CRM tenant | Não | Não | Não | Não |
| Operador da administração Meta, sem papel FinOps | Não | Não | Não | Não |
| Operador Proxy com papel finops_read | Sim, apenas autorizados | Sim, com vínculo e allowlist | Não | Não |
| Operador Proxy com papel finops_manage (futuro) | Sim, apenas autorizados | Sim, com vínculo e allowlist | Só com trilha e aprovação | Não |
| Serviço backend de leitura | Não aplicável à interface | Apenas recurso e organização previamente vinculados | Não | Apenas no cofre do runtime |

A política é **deny-by-default**, inclusive quando configuração, vínculo, fonte, dados ou permissões estiverem ausentes. A segurança não deve depender de menus ocultos.

## Registro e vinculação de tenants
Separar `proxy_tenant_id` (UUID da provedora), `source_system` (namespace), `external_organization_id` (UUID no sistema de origem), `environment` e estado. Garantir unicidade do trio `source_system + external_organization_id + environment`, bem como validação da associação por serviço. O `tenantId` de uma requisição do navegador é somente uma chave de seleção: o backend deve consultar o registro privado autorizado e ignorar qualquer informação de acesso fornecida pelo usuário.

Para o piloto LA, não adivinhar o organization_id real: obtê-lo de fonte confiável na fase de integração e associá-lo à referência `la-climatizacao`, após conferência. Nenhum identificador de exemplo dos testes deve ser utilizado em produção.

## Conector read-only
Fase 1: interface server-side `readFinOpsSnapshot(tenantId,service)` que:
1. Verifica sessão Proxy e papel FinOps na borda, antes de qualquer acesso a segredo ou leitura do banco.
2. Resolve tenant e origem em registro interno validado; exige ambiente esperado e integração explicitamente habilitada.
3. Seleciona adaptador LA com credencial guardada no runtime servidor, não reutilizada da sessão do CRM.
4. Chama apenas a RPC agregada `whatsapp_audio_budget_snapshot` com organização vinculada; não consulta tabelas genéricas nem eventos/mensagens.
5. Revalida identidade da origem, esquema do retorno e campos permitidos contra `lib/finops/telemetry.mjs`.
6. Usa resposta de cache privado por curto período, com chave composta (tenant, serviço, competência), limites e deduplicação de solicitações concorrentes.
7. Devolve somente snapshot estritamente projetado e marcadores de fonte/atualização, `Cache-Control: no-store` na resposta HTTP ao navegador. Falhas retornam indisponibilidade sem detalhes de segredo.

Não implementar consulta financeira direta do navegador ao Supabase, nem uma API pública de telemetria por padrão. Priorizar uma ponte produto→Provider com token de escopo mínimo, autenticação mútua/replay protection e allowlist caso a auditoria mostre inadequação em armazenar service_role do Supabase da LA no Proxy.

## Limites de dados da versão atual
A função LA entrega agregado `spent_estimate_cents`, `soft_limit_cents` e `hard_limit_cents`. O contrato v1 adapta **apenas o consumo estimado**; reservas individualizadas, custo incerto e faturamento conciliado ficam `null`. `null` não deve ser representado como `R$ 0,00`. Os limites de R$ 30 + R$ 3 não autorizam uso extra; R$ 267/264 não representam lucro.

A função de snapshot calcula o mês corrente em São Paulo e **não recebe competência como argumento**. Não mostrar isso como consulta histórica; para histórico, criar interface versionada independente após revisão.

## Matriz mínima de testes antes de integrar
- Anônimo, usuário CRM e operador Meta não-FinOps: negação na rota e nenhuma leitura da fonte.
- Admin com sessão expirada/revogada: negação; troca de tenant na URL não contorna allowlist.
- Reader autorizado: apenas registros autorizados, somente `read` e com projeção segura.
- Falha de fonte, organização inexistente, ID trocado, dados inválidos ou resposta com segredo: indisponível sem vazamento.
- Requisições repetidas: cache/deduplicação e teto técnico; não aumentar chamadas externas sem necessidade.
- Dados incompletos: `null` explícito, nunca inventar faturamento real, margem ou lucro.
- Alterações administrativas: bloqueadas na v1; implementação futura exige RBAC granular, CSRF, motivo e log imutável.
- Regressão: transcrição e webhook WhatsApp da LA idênticos ao baseline.

## Gates
**Gate A:** contrato v1 e testes unitários verdes (PR #48).
**Gate B:** identidade real da organização LA e fonte de credencial conferidas em contexto seguro; ADR de acesso mínimo revisada.
**Gate C:** integração isolada de leitura, testes HTTP de autorização e inspeção de logs sem dados sensíveis.
**Gate D:** aprovação explícita antes de qualquer infraestrutura, permissões, merge ou deploy.

Nenhuma etapa autoriza por si só mudanças na base LA, políticas RLS, secrets, callbacks Meta ou produção.
